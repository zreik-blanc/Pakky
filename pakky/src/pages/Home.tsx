import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { SystemInfo, PackageInstallItem, UserConfig, ConfigSettings } from '@/lib/types';
import { useInstallStore } from '@/stores/installStore';
import { installAPI, configAPI } from '@/lib/electron';
import type { PakkyConfig } from '@/lib/types';
import { UI_STRINGS } from '@/lib/constants';
import { PackageSearch } from '@/components/packages/PackageSearch';
import { HomebrewAlert } from '@/components/home/HomebrewAlert';
import { PackageQueue } from '@/components/home/PackageQueue';
import { ExportPreviewDialog } from '@/components/export/ExportPreviewDialog';
import { ImportedConfigAlert } from '@/components/alerts/ImportedConfigAlert';
import { QueueManager } from '@/lib/managers/queueManager';
import { ScriptInputDialog } from '@/components/install/ScriptInputDialog';
import { AddScriptDialog } from '@/components/install/AddScriptDialog';
import { useInstallationSubscription } from '@/hooks/useInstallationSubscription';
import { usePackageActions } from '@/hooks/usePackageActions';
import { usePackageManagerCheck } from '@/hooks/usePackageManagerCheck';
import { pageEnter } from '@/lib/animations';

interface HomePageProps {
    systemInfo: SystemInfo | null;
    userConfig: UserConfig | null;
    importedPackages?: PackageInstallItem[];
    onClearImported?: () => void;
    selectedPackages: PackageInstallItem[];
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageInstallItem[]>>;
    installLogs: Record<string, string[]>;
    setInstallLogs: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    onNavigateToPresets?: () => void;
    hasImportedConfig?: boolean;
    onClearImportedFlag?: () => void;
}

export default function HomePage({
    systemInfo,
    userConfig,
    importedPackages,
    onClearImported,
    selectedPackages,
    setSelectedPackages,
    installLogs,
    setInstallLogs,
    onNavigateToPresets,
    hasImportedConfig,
    onClearImportedFlag
}: HomePageProps) {
    const [isStartingInstall, setIsStartingInstall] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showImportedAlert, setShowImportedAlert] = useState(false);
    const [showScriptInputDialog, setShowScriptInputDialog] = useState(false);
    const [showAddScriptDialog, setShowAddScriptDialog] = useState(false);

    // Installation settings - user configurable
    const [installSettings, setInstallSettings] = useState<ConfigSettings>({
        continue_on_error: true,
        skip_already_installed: true,
        parallel_installs: false,
    });

    const {
        progress,
        config: loadedConfig,
        setPackages,
        startInstallation,
        completeInstallation,
        cancelInstallation: cancelInstallInStore
    } = useInstallStore();

    // Package manager check hook (Homebrew on macOS, Winget on Windows, etc.)
    const {
        isMissing: isPackageManagerMissing,
        isInstalling: isInstallingPackageManager,
        handleInstall: handleInstallPackageManager,
    } = usePackageManagerCheck({ platform: systemInfo?.platform });

    // Installation subscription hook
    useInstallationSubscription({
        setSelectedPackages,
        setInstallLogs,
    });

    // Package actions hook
    const {
        addPackage,
        removePackage,
        handleReinstall,
    } = usePackageActions({
        selectedPackages,
        setSelectedPackages,
        isStartingInstall,
        installStatus: progress.status,
    });

    // Handle imported packages
    useEffect(() => {
        if (importedPackages && importedPackages.length > 0) {
            setSelectedPackages(prev => QueueManager.merge(prev, importedPackages));
            onClearImported?.();
        }
    }, [importedPackages, onClearImported, setSelectedPackages]);

    // Sync install settings when config is loaded/imported
    useEffect(() => {
        if (loadedConfig?.settings) {
            setInstallSettings(prev => ({ ...prev, ...loadedConfig.settings }));
        }
    }, [loadedConfig]);

    // Check if user wants to install from imported config
    const handleStartInstall = () => {
        if (isStartingInstall) return;

        // If packages came from an imported config, show confirmation first
        if (hasImportedConfig && selectedPackages.length > 0) {
            setShowImportedAlert(true);
            return;
        }

        // Otherwise check for scripts that need user input
        checkForScriptInputs();
    };

    // Check if any scripts need user input before proceeding
    const checkForScriptInputs = () => {
        const scriptsWithInputs = selectedPackages.filter(
            pkg => pkg.type === 'script' &&
                pkg.promptForInput &&
                Object.keys(pkg.promptForInput).length > 0
        );

        if (scriptsWithInputs.length > 0) {
            setShowScriptInputDialog(true);
        } else {
            executeInstallation({});
        }
    };

    // Handle script input dialog confirmation
    const handleScriptInputConfirm = (values: Record<string, string>) => {
        setShowScriptInputDialog(false);
        executeInstallation(values, selectedPackages);
    };

    // Handle skip scripts (remove scripts from installation)
    const handleSkipScripts = () => {
        setShowScriptInputDialog(false);
        const nonScriptPackages = selectedPackages.filter(pkg => pkg.type !== 'script');
        setSelectedPackages(nonScriptPackages);
        executeInstallation({}, nonScriptPackages);
    };

    // Actual installation logic
    const executeInstallation = async (userInputValues: Record<string, string>, packagesToUse?: PackageInstallItem[]) => {
        if (isStartingInstall) return;
        setIsStartingInstall(true);

        const packagesSource = packagesToUse || selectedPackages;

        try {
            const installed = await installAPI.getInstalledPackages();
            const installedSet = new Set([
                ...installed.formulae,
                ...installed.casks
            ]);

            const updatedPackages = packagesSource.map(pkg => {
                if (pkg.action === 'reinstall') {
                    return { ...pkg, status: 'pending' as const };
                }
                // Scripts are never "already installed"
                if (pkg.type !== 'script' && installedSet.has(pkg.name)) {
                    return { ...pkg, status: 'already_installed' as const };
                }
                if (pkg.status === 'failed' || pkg.status === 'success') {
                    return { ...pkg, status: 'pending' as const };
                }
                return pkg;
            });

            setSelectedPackages(updatedPackages);

            const packagesToInstall = updatedPackages.filter(p => p.status !== 'already_installed');
            if (packagesToInstall.length === 0) {
                setIsStartingInstall(false);
                return;
            }

            setPackages(updatedPackages);
            startInstallation();
            setInstallLogs({});

            // Pass install settings (UI settings override loaded config settings)
            const settingsToUse = { ...loadedConfig?.settings, ...installSettings };
            await installAPI.startInstallation(updatedPackages, settingsToUse, userInputValues);
        } catch (error) {
            console.error('Installation failed:', error);
            completeInstallation();
        } finally {
            setIsStartingInstall(false);
        }
    };

    const handleCancelInstall = async () => {
        try {
            await installAPI.cancelInstallation();
            cancelInstallInStore();
        } catch (error) {
            console.error('Failed to cancel:', error);
        }
    };

    // Handle imported config alert confirmation
    const handleImportedAlertConfirm = () => {
        setShowImportedAlert(false);
        onClearImportedFlag?.(); // Clear the flag so it doesn't show again
        checkForScriptInputs(); // Check for script inputs before proceeding
    };

    // Handle imported config alert rejection
    const handleImportedAlertReject = () => {
        setShowImportedAlert(false);
    };

    // Handle review config (opens export dialog)
    const handleReviewConfig = () => {
        setShowImportedAlert(false);
        setShowExportDialog(true);
    };

    const handleExportConfig = () => {
        if (selectedPackages.length === 0) return;
        setShowExportDialog(true);
    };

    const handleConfirmExport = async (config: PakkyConfig) => {
        try {
            const savedPath = await configAPI.saveConfigDialog(config);
            if (savedPath) {
                setShowExportDialog(false);
            }
        } catch (error) {
            console.error(UI_STRINGS.ERRORS.EXPORT_FAILED, error);
        }
    };

    // Clear all packages and reset imported flag
    const handleClearAll = () => {
        setSelectedPackages([]);
        onClearImportedFlag?.();
    };

    // Handle adding a custom script
    const handleAddScript = (script: PackageInstallItem) => {
        setSelectedPackages(prev => {
            const { added } = QueueManager.addMultiple(prev, [script]);
            return [...prev, ...added];
        });
    };

    const isInstalling = progress.status === 'installing';

    return (
        <motion.div
            className="max-w-4xl mx-auto flex flex-col h-full"
            variants={pageEnter}
            initial="hidden"
            animate="visible"
        >
            {/* Imported config confirmation alert */}
            {showImportedAlert && (
                <ImportedConfigAlert
                    packageCount={selectedPackages.length}
                    onConfirm={handleImportedAlertConfirm}
                    onReject={handleImportedAlertReject}
                    onReviewConfig={handleReviewConfig}
                />
            )}

            {/* Welcome / Search Header - Fixed, doesn't scroll */}
            <div className="space-y-4 mb-6 shrink-0">
                {isPackageManagerMissing && (
                    <HomebrewAlert
                        isInstalling={isInstallingPackageManager}
                        onInstall={handleInstallPackageManager}
                    />
                )}

                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">{UI_STRINGS.HOME.TITLE}</h2>
                    <p className="text-muted-foreground">{UI_STRINGS.HOME.DESCRIPTION}</p>
                </div>

                <div className="card p-1 bg-gradient-to-br from-card/50 to-background border-border/50 shadow-sm relative z-20">
                    <PackageSearch
                        onAddPackage={addPackage}
                        disabled={isInstalling}
                        isAdded={(id) => selectedPackages.some(p => p.id === id)}
                    />
                </div>
            </div>

            {/* Selected Packages List - fills remaining space */}
            <div className="flex-1 min-h-0">
                <PackageQueue
                    packages={selectedPackages}
                    installLogs={installLogs}
                    isInstalling={isInstalling}
                    isStartingInstall={isStartingInstall}
                    installSettings={installSettings}
                    onInstallSettingsChange={setInstallSettings}
                    onRemove={removePackage}
                    onReinstall={handleReinstall}
                    onReorder={setSelectedPackages}
                    onStartInstall={handleStartInstall}
                    onCancelInstall={handleCancelInstall}
                    onExport={handleExportConfig}
                    onClear={handleClearAll}
                    onNavigateToPresets={onNavigateToPresets}
                    onAddScript={() => setShowAddScriptDialog(true)}
                />
            </div>

            {/* Footer Info */}
            <div className="fixed bottom-2 right-4 text-[10px] text-muted-foreground/30 pointer-events-none">
                {UI_STRINGS.HOME.FOOTER_INFO} • {systemInfo?.arch}
            </div>

            <ExportPreviewDialog
                open={showExportDialog}
                onOpenChange={setShowExportDialog}
                packages={selectedPackages}
                onConfirm={handleConfirmExport}
                userName={systemInfo?.platform === 'macos' ? userConfig?.userName : 'User'}
                systemInfo={systemInfo}
            />

            <ScriptInputDialog
                open={showScriptInputDialog}
                onOpenChange={setShowScriptInputDialog}
                packages={selectedPackages}
                onConfirm={handleScriptInputConfirm}
                onSkip={handleSkipScripts}
            />

            <AddScriptDialog
                open={showAddScriptDialog}
                onOpenChange={setShowAddScriptDialog}
                onAdd={handleAddScript}
            />
        </motion.div>
    );
}

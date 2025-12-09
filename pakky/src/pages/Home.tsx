import { useState, useEffect, useCallback } from 'react';
import type { SystemInfo, PackageInstallItem } from '@/lib/types';
import { useInstallStore } from '@/stores/installStore';
import { searchAPI, installAPI, configAPI } from '@/lib/electron';
import type { PakkyConfig, SearchResult } from '@/lib/types';
import { INSTALL_CONFIG } from '@/lib/config';
import { PackageSearch } from '@/components/packages/PackageSearch';
import { HomebrewAlert } from '@/components/home/HomebrewAlert';
import { PackageQueue } from '@/components/home/PackageQueue';

interface HomePageProps {
    systemInfo: SystemInfo | null;
    importedPackages?: PackageInstallItem[];
    onClearImported?: () => void;
    selectedPackages: PackageInstallItem[];
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageInstallItem[]>>;
    installLogs: Record<string, string[]>;
    setInstallLogs: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    onNavigateToPresets?: () => void;
}

export default function HomePage({
    systemInfo,
    importedPackages,
    onClearImported,
    selectedPackages,
    setSelectedPackages,
    installLogs,
    setInstallLogs,
    onNavigateToPresets
}: HomePageProps) {
    const [isStartingInstall, setIsStartingInstall] = useState(false);
    const [isHomebrewMissing, setIsHomebrewMissing] = useState(false);
    const [isInstallingHomebrew, setIsInstallingHomebrew] = useState(false);

    const {
        progress,
        setPackages,
        startInstallation,
        addPackageLog,
        completeInstallation,
        cancelInstallation: cancelInstallInStore
    } = useInstallStore();

    // Check for Homebrew on mount
    useEffect(() => {
        if (systemInfo?.platform === 'macos') {
            installAPI.checkHomebrew().then(isInstalled => {
                setIsHomebrewMissing(!isInstalled);
            });
        }
    }, [systemInfo?.platform]);

    const handleInstallHomebrew = async () => {
        setIsInstallingHomebrew(true);
        try {
            await installAPI.installHomebrew();
            setIsHomebrewMissing(false);
        } catch (error) {
            console.error('Failed to install Homebrew:', error);
            alert('Failed to install Homebrew. Please check the logs.');
        } finally {
            setIsInstallingHomebrew(false);
        }
    };

    // Handle imported packages
    useEffect(() => {
        if (importedPackages && importedPackages.length > 0) {
            setSelectedPackages(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newPackages = importedPackages.filter(p => !existingIds.has(p.id));
                return [...prev, ...newPackages];
            });
            onClearImported?.();
        }
    }, [importedPackages, onClearImported, setSelectedPackages]);

    // Subscribe to progress updates
    useEffect(() => {
        const unsubProgress = installAPI.onProgress((progressUpdate) => {
            if (progressUpdate.packages) {
                setPackages(progressUpdate.packages);
            }

            if (progressUpdate.packages) {
                setSelectedPackages(prev => {
                    return prev.map(pkg => {
                        const updated = progressUpdate.packages.find((p: PackageInstallItem) => p.id === pkg.id);
                        return updated || pkg;
                    });
                });
            }

            if (progressUpdate.status === 'completed' || progressUpdate.status === 'cancelled') {
                completeInstallation();
            }
        });

        const unsubLog = installAPI.onLog((log) => {
            addPackageLog(log.packageId, log.line);
            const maxLogs = INSTALL_CONFIG.maxLogsPerPackage;
            setInstallLogs(prev => {
                const existingLogs = prev[log.packageId] || [];
                const newLogs = existingLogs.length >= maxLogs
                    ? [...existingLogs.slice(-(maxLogs - 1)), log.line]
                    : [...existingLogs, log.line];
                return { ...prev, [log.packageId]: newLogs };
            });
        });

        return () => {
            unsubProgress();
            unsubLog();
        };
        // Intentionally only run on mount/unmount - IPC listeners should be set up once
        // and the callbacks use refs/external state that don't need to trigger re-subscription
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addPackage = useCallback(async (result: SearchResult) => {
        // Double check not added
        if (selectedPackages.some(p => p.id === `${result.type}:${result.name}`)) {
            return;
        }

        let description = result.description;
        if (!description) {
            try {
                const info = await searchAPI.getPackageInfo(result.name, result.type);
                description = info?.description;
            } catch { /* ignore */ }
        }

        const newPackage: PackageInstallItem = {
            id: `${result.type}:${result.name}`,
            name: result.name,
            type: result.type,
            status: result.installed ? 'already_installed' : 'pending',
            description: description || `${result.type === 'cask' ? 'Application' : 'CLI tool'}`,
            logs: [],
        };

        setSelectedPackages(prev => [...prev, newPackage]);
    }, [selectedPackages, setSelectedPackages]);

    const removePackage = useCallback((id: string) => {
        setSelectedPackages(prev => prev.filter(p => p.id !== id));
    }, [setSelectedPackages]);

    const handleReinstall = useCallback((id: string) => {
        setSelectedPackages(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, status: 'pending', action: 'reinstall' };
            }
            return p;
        }));
    }, [setSelectedPackages]);

    // Check installed system packages periodically or on mount/import
    // Debounced to prevent multiple concurrent API calls
    useEffect(() => {
        if (selectedPackages.length === 0) return;
        if (isStartingInstall || progress.status === 'installing') return;

        const timer = setTimeout(async () => {
            try {
                const installed = await installAPI.getInstalledPackages();
                const installedSet = new Set([...installed.formulae, ...installed.casks]);

                setSelectedPackages(prev => {
                    const hasChanges = prev.some(pkg =>
                        !pkg.action &&
                        pkg.status !== 'installing' &&
                        pkg.status !== 'success' &&
                        pkg.status !== 'failed' &&
                        installedSet.has(pkg.name) &&
                        pkg.status !== 'already_installed'
                    );

                    if (!hasChanges) return prev;

                    return prev.map(pkg => {
                        if (pkg.action || pkg.status === 'installing' || pkg.status === 'success' || pkg.status === 'failed') return pkg;

                        if (installedSet.has(pkg.name)) {
                            return { ...pkg, status: 'already_installed' };
                        }
                        return pkg;
                    });
                });
            } catch { /* ignore */ }
        }, INSTALL_CONFIG.checkInstalledDebounceMs);

        return () => clearTimeout(timer);
    }, [selectedPackages.length, isStartingInstall, progress.status, setSelectedPackages]);

    const handleStartInstall = async () => {
        if (isStartingInstall) return;
        setIsStartingInstall(true);

        try {
            const installed = await installAPI.getInstalledPackages();
            const installedSet = new Set([
                ...installed.formulae,
                ...installed.casks
            ]);

            const updatedPackages = selectedPackages.map(pkg => {
                if (pkg.action === 'reinstall') {
                    return { ...pkg, status: 'pending' as const };
                }
                if (installedSet.has(pkg.name)) {
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
                console.log('All packages are already installed');
                setIsStartingInstall(false);
                return;
            }

            setPackages(updatedPackages);
            startInstallation();
            setInstallLogs({});

            await installAPI.startInstallation(updatedPackages);
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

    const handleExportConfig = async () => {
        if (selectedPackages.length === 0) return;

        const formulae = selectedPackages
            .filter(p => p.type === 'formula')
            .map(p => p.name);

        const casks = selectedPackages
            .filter(p => p.type === 'cask')
            .map(p => p.name);

        const config: PakkyConfig = {
            name: 'My Pakky Config',
            version: '1.0.0',
            description: 'Exported from Pakky',
            macos: {
                homebrew: {
                    formulae: formulae.length > 0 ? formulae : undefined,
                    casks: casks.length > 0 ? casks : undefined,
                }
            }
        };

        try {
            const savedPath = await configAPI.saveConfigDialog(config);
            if (savedPath) console.log('Config saved to:', savedPath);
        } catch (error) {
            console.error('Failed to export config:', error);
        }
    };

    const isInstalling = progress.status === 'installing';

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-full animate-in fade-in duration-500">
            {/* Welcome / Search Header - Fixed, doesn't scroll */}
            <div className="space-y-4 mb-6 shrink-0">
                {isHomebrewMissing && (
                    <HomebrewAlert
                        isInstalling={isInstallingHomebrew}
                        onInstall={handleInstallHomebrew}
                    />
                )}

                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">Library</h2>
                    <p className="text-muted-foreground">Search and manage your packages.</p>
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
                    onRemove={removePackage}
                    onReinstall={handleReinstall}
                    onStartInstall={handleStartInstall}
                    onCancelInstall={handleCancelInstall}
                    onExport={handleExportConfig}
                    onNavigateToPresets={onNavigateToPresets}
                />
            </div>

            {/* Footer Info */}
            <div className="fixed bottom-2 right-4 text-[10px] text-muted-foreground/30 pointer-events-none">
                Homebrew • {systemInfo?.arch}
            </div>
        </div>
    );
}

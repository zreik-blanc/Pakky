import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, Loader2, Download, PackageOpen } from 'lucide-react';
import type { SystemInfo, PackageInstallItem } from '@/lib/types';
import { useInstallStore } from '@/stores/installStore';
import { searchAPI, installAPI, configAPI } from '@/lib/electron';
import type { PakkyConfig, SearchResult } from '@/lib/types';
import { PackageSearch } from '@/components/packages/PackageSearch';
import { PackageCard } from '@/components/packages/PackageCard';
import { Button } from '@/components/ui/button';

interface HomePageProps {
    systemInfo: SystemInfo | null;
    importedPackages?: PackageInstallItem[];
    onClearImported?: () => void;
    selectedPackages: PackageInstallItem[];
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageInstallItem[]>>;
    installLogs: Record<string, string[]>;
    setInstallLogs: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

export default function HomePage({
    systemInfo,
    importedPackages,
    onClearImported,
    selectedPackages,
    setSelectedPackages,
    installLogs,
    setInstallLogs
}: HomePageProps) {
    const [isStartingInstall, setIsStartingInstall] = useState(false);

    const {
        progress,
        setPackages,
        startInstallation,
        addPackageLog,
        completeInstallation,
        cancelInstallation: cancelInstallInStore
    } = useInstallStore();

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
            const MAX_LOGS_PER_PACKAGE = 500;
            setInstallLogs(prev => {
                const existingLogs = prev[log.packageId] || [];
                const newLogs = existingLogs.length >= MAX_LOGS_PER_PACKAGE
                    ? [...existingLogs.slice(-(MAX_LOGS_PER_PACKAGE - 1)), log.line]
                    : [...existingLogs, log.line];
                return { ...prev, [log.packageId]: newLogs };
            });
        });

        return () => {
            unsubProgress();
            unsubLog();
        };
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

    const pendingPackages = selectedPackages.filter(p => p.status !== 'already_installed');
    const isInstalling = progress.status === 'installing';

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Welcome / Search Header */}
            <div className="space-y-4">
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

            {/* Selected Packages List */}
            {selectedPackages.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">Queue</span>
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {pendingPackages.length} pending
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {!isInstalling && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportConfig}
                                    className="h-8 gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </Button>
                            )}

                            {pendingPackages.length > 0 && (
                                <>
                                    {isInstalling ? (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleCancelInstall}
                                            className="h-8 shadow-sm gap-2"
                                        >
                                            <Square className="w-3.5 h-3.5 fill-current" />
                                            Cancel
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={handleStartInstall}
                                            disabled={isStartingInstall}
                                            className="h-8 shadow-sm bg-primary hover:bg-primary/90 gap-2"
                                        >
                                            {isStartingInstall ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Play className="w-3.5 h-3.5 fill-current" />
                                            )}
                                            {isStartingInstall ? 'Checking...' : 'Install All'}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {selectedPackages.map((pkg) => (
                            <PackageCard
                                key={pkg.id}
                                pkg={pkg}
                                onRemove={removePackage}
                                disabled={isInstalling}
                                logs={installLogs[pkg.id]}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center space-y-4 border-2 border-dashed border-border/50 rounded-xl bg-card/20">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                        <PackageOpen className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">Your queue is empty</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Search for packages above to add them to your installation queue.
                        </p>
                    </div>
                </div>
            )}

            {/* Footer Info */}
            <div className="fixed bottom-2 right-4 text-[10px] text-muted-foreground/30 pointer-events-none">
                Homebrew • {systemInfo?.arch}
            </div>
        </div>
    );
}

import { useCallback, useEffect } from 'react';
import { searchAPI, installAPI } from '@/lib/electron';
import { INSTALL } from '@/lib/constants';
import type { PackageInstallItem, SearchResult } from '@/lib/types';
import { QueueManager } from '@/lib/managers/queueManager';

interface UsePackageActionsProps {
    selectedPackages: PackageInstallItem[];
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageInstallItem[]>>;
    isStartingInstall: boolean;
    installStatus: 'idle' | 'checking' | 'installing' | 'completed' | 'cancelled';
}

/**
 * Hook providing package management actions: add, remove, reinstall.
 * Also handles checking installed status of packages.
 */
export function usePackageActions({
    selectedPackages,
    setSelectedPackages,
    isStartingInstall,
    installStatus,
}: UsePackageActionsProps) {

    const addPackage = useCallback(async (result: SearchResult) => {
        // Double check not added
        // Although QueueManager.add also checks, avoiding the API call for description if possible is good optimization
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

        setSelectedPackages(prev => {
            const { added } = QueueManager.add(prev, {
                name: result.name,
                type: result.type,
                description,
                installed: result.installed,
            });

            return added.length > 0 ? [...prev, ...added] : prev;
        });
    }, [selectedPackages, setSelectedPackages]);

    const removePackage = useCallback((id: string) => {
        setSelectedPackages(prev => QueueManager.remove(prev, id));
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
        if (isStartingInstall || installStatus === 'installing') return;

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
        }, INSTALL.CHECK_INSTALLED_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [selectedPackages.length, isStartingInstall, installStatus, setSelectedPackages]);

    return {
        addPackage,
        removePackage,
        handleReinstall,
    };
}

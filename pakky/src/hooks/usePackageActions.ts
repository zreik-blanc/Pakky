import { useCallback, useEffect } from 'react';
import { searchAPI, installAPI } from '@/lib/electron';
import { INSTALL_CONFIG } from '@/lib/config';
import type { PackageInstallItem, SearchResult } from '@/lib/types';

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
        }, INSTALL_CONFIG.checkInstalledDebounceMs);

        return () => clearTimeout(timer);
    }, [selectedPackages.length, isStartingInstall, installStatus, setSelectedPackages]);

    return {
        addPackage,
        removePackage,
        handleReinstall,
    };
}

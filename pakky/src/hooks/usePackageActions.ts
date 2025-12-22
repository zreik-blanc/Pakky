import { useCallback, useEffect } from 'react';
import { searchAPI, installAPI } from '@/lib/electron';
import { INSTALL } from '@/lib/constants';
import type { SearchResult } from '@/lib/types';
import { useQueueStore, selectPackages } from '@/stores/queueStore';
import { useInstallStore } from '@/stores/installStore';

interface UsePackageActionsProps {
    isStartingInstall: boolean;
}

/**
 * Hook providing package management actions: add, remove, reinstall.
 * Also handles checking installed status of packages.
 * Uses stores directly instead of props to avoid prop drilling.
 */
export function usePackageActions({
    isStartingInstall,
}: UsePackageActionsProps) {
    const packages = useQueueStore(selectPackages);
    const { addPackage: addToQueue, removePackage: removeFromQueue, updatePackage, setPackages } = useQueueStore();
    const installStatus = useInstallStore(state => state.progress.status);

    const addPackage = useCallback(async (result: SearchResult) => {
        // Double check not added
        // Although QueueManager.add also checks, avoiding the API call for description if possible is good optimization
        const currentPackages = useQueueStore.getState().packages;
        if (currentPackages.some(p => p.id === `${result.type}:${result.name}`)) {
            return;
        }

        let description = result.description;
        if (!description) {
            try {
                const info = await searchAPI.getPackageInfo(result.name, result.type);
                description = info?.description;
            } catch { /* ignore */ }
        }

        addToQueue({
            name: result.name,
            type: result.type,
            description,
            installed: result.installed,
        });
    }, [addToQueue]);

    const removePackage = useCallback((id: string) => {
        removeFromQueue(id);
    }, [removeFromQueue]);

    const handleReinstall = useCallback((id: string) => {
        updatePackage(id, { status: 'pending', action: 'reinstall' });
    }, [updatePackage]);

    // Check installed system packages periodically or on mount/import
    // Debounced to prevent multiple concurrent API calls
    useEffect(() => {
        if (packages.length === 0) return;
        if (isStartingInstall || installStatus === 'installing') return;

        const timer = setTimeout(async () => {
            try {
                const installed = await installAPI.getInstalledPackages();
                const installedSet = new Set([...installed.formulae, ...installed.casks]);

                const currentPackages = useQueueStore.getState().packages;
                const hasChanges = currentPackages.some(pkg =>
                    !pkg.action &&
                    pkg.status !== 'installing' &&
                    pkg.status !== 'success' &&
                    pkg.status !== 'failed' &&
                    installedSet.has(pkg.name) &&
                    pkg.status !== 'already_installed'
                );

                if (!hasChanges) return;

                setPackages(currentPackages.map(pkg => {
                    if (pkg.action || pkg.status === 'installing' || pkg.status === 'success' || pkg.status === 'failed') return pkg;

                    if (installedSet.has(pkg.name)) {
                        return { ...pkg, status: 'already_installed' };
                    }
                    return pkg;
                }));
            } catch { /* ignore */ }
        }, INSTALL.CHECK_INSTALLED_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [packages.length, isStartingInstall, installStatus, setPackages]);

    return {
        addPackage,
        removePackage,
        handleReinstall,
    };
}

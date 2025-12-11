import { useEffect } from 'react';
import { installAPI } from '@/lib/electron';
import { useInstallStore } from '@/stores/installStore';
import type { PackageInstallItem } from '@/lib/types';

interface UseInstallationSubscriptionProps {
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageInstallItem[]>>;
    setInstallLogs: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

/**
 * Hook to subscribe to installation progress and log updates via IPC.
 * Sets up listeners on mount and cleans them up on unmount.
 */
export function useInstallationSubscription({
    setSelectedPackages,
    setInstallLogs,
}: UseInstallationSubscriptionProps) {
    const {
        setPackages,
        addPackageLog,
        completeInstallation,
    } = useInstallStore();

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
            // Store handles log truncation via addPackageLog
            addPackageLog(log.packageId, log.line);
            
            // Also update local state for UI (store is source of truth for truncation)
            setInstallLogs(prev => ({
                ...prev,
                [log.packageId]: [...(prev[log.packageId] || []), log.line]
            }));
        });

        return () => {
            unsubProgress();
            unsubLog();
        };
        // Intentionally only run on mount/unmount - IPC listeners should be set up once
        // and the callbacks use refs/external state that don't need to trigger re-subscription
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

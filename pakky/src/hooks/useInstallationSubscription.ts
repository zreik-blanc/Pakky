import { useEffect } from 'react';
import { installAPI } from '@/lib/electron';
import { useInstallStore } from '@/stores/installStore';
import { INSTALL_CONFIG } from '@/lib/config';
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
}

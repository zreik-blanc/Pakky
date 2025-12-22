import { useEffect } from 'react';
import { installAPI } from '@/lib/electron';
import { useInstallStore } from '@/stores/installStore';
import { useQueueStore } from '@/stores/queueStore';
import type { PackageInstallItem } from '@/lib/types';

/**
 * Hook to subscribe to installation progress and log updates via IPC.
 * Sets up listeners on mount and cleans them up on unmount.
 * Uses stores directly instead of props to avoid prop drilling.
 */
export function useInstallationSubscription() {
    const {
        setPackages: setInstallPackages,
        addPackageLog,
        completeInstallation,
    } = useInstallStore();

    const { setPackages: setQueuePackages, addLog } = useQueueStore();

    useEffect(() => {
        const unsubProgress = installAPI.onProgress((progressUpdate) => {
            if (progressUpdate.packages) {
                setInstallPackages(progressUpdate.packages);
            }

            if (progressUpdate.packages) {
                setQueuePackages(
                    useQueueStore.getState().packages.map(pkg => {
                        const updated = progressUpdate.packages.find((p: PackageInstallItem) => p.id === pkg.id);
                        return updated || pkg;
                    })
                );
            }

            if (progressUpdate.status === 'completed' || progressUpdate.status === 'cancelled') {
                completeInstallation();
            }
        });

        const unsubLog = installAPI.onLog((log) => {
            // Store handles log truncation via addPackageLog
            addPackageLog(log.packageId, log.line);
            // Also update queue store logs
            addLog(log.packageId, log.line);
        });

        return () => {
            unsubProgress();
            unsubLog();
        };
        // Intentionally only run on mount/unmount - IPC listeners should be set up once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

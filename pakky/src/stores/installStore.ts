import { create } from 'zustand';
import type {
    InstallProgress,
    PackageInstallItem,
    PackageStatus
} from '../lib/types';
import { INSTALL } from '../lib/constants';

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate package counts from status values
 * Centralized to avoid duplication
 */
function calculatePackageCounts(packages: PackageInstallItem[]) {
    return {
        completedPackages: packages.filter(
            (p) => p.status === 'success' || p.status === 'already_installed'
        ).length,
        failedPackages: packages.filter((p) => p.status === 'failed').length,
        skippedPackages: packages.filter((p) => p.status === 'skipped').length,
    };
}

// ============================================
// Store Interface
// ============================================

interface InstallProgressState {
    /** Installation progress tracking */
    progress: InstallProgress;
}

interface InstallProgressActions {
    // Lifecycle
    startInstallation: () => void;
    cancelInstallation: () => void;
    completeInstallation: () => void;

    // Package updates
    setPackages: (packages: PackageInstallItem[]) => void;
    updatePackageStatus: (packageId: string, status: PackageStatus, error?: string) => void;
    addPackageLog: (packageId: string, log: string) => void;
    setCurrentPackage: (packageId: string | undefined) => void;

    // Reset
    reset: () => void;
}

type InstallStore = InstallProgressState & InstallProgressActions;

// ============================================
// Initial State
// ============================================

const initialProgress: InstallProgress = {
    status: 'idle',
    packages: [],
    totalPackages: 0,
    completedPackages: 0,
    failedPackages: 0,
    skippedPackages: 0,
};

// ============================================
// Store
// ============================================

export const useInstallStore = create<InstallStore>((set) => ({
    progress: initialProgress,

    startInstallation: () => set((state) => ({
        progress: {
            ...state.progress,
            status: 'installing',
            completedPackages: 0,
            failedPackages: 0,
            skippedPackages: 0,
        },
    })),

    cancelInstallation: () => set((state) => ({
        progress: {
            ...state.progress,
            status: 'cancelled',
            currentPackage: undefined,
        },
    })),

    completeInstallation: () => set((state) => ({
        progress: {
            ...state.progress,
            status: 'completed',
            currentPackage: undefined,
        },
    })),

    setPackages: (packages) => set((state) => {
        const counts = calculatePackageCounts(packages);

        return {
            progress: {
                ...state.progress,
                packages,
                totalPackages: packages.length,
                ...counts,
            },
        };
    }),

    updatePackageStatus: (packageId, status, error) => set((state) => {
        const packages = state.progress.packages.map((pkg) => {
            if (pkg.id === packageId) {
                return {
                    ...pkg,
                    status,
                    error,
                    endTime: ['success', 'failed', 'skipped', 'already_installed'].includes(status)
                        ? Date.now()
                        : pkg.endTime,
                    startTime: status === 'installing' ? Date.now() : pkg.startTime,
                };
            }
            return pkg;
        });

        const counts = calculatePackageCounts(packages);

        return {
            progress: {
                ...state.progress,
                packages,
                ...counts,
            },
        };
    }),

    addPackageLog: (packageId, log) => set((state) => {
        const maxLogs = INSTALL.MAX_LOGS_PER_PACKAGE;
        return {
            progress: {
                ...state.progress,
                packages: state.progress.packages.map((pkg) => {
                    if (pkg.id === packageId) {
                        const newLogs = pkg.logs.length >= maxLogs
                            ? [...pkg.logs.slice(-(maxLogs - 1)), log]
                            : [...pkg.logs, log];
                        return {
                            ...pkg,
                            logs: newLogs,
                        };
                    }
                    return pkg;
                }),
            },
        };
    }),

    setCurrentPackage: (packageId) => set((state) => ({
        progress: {
            ...state.progress,
            currentPackage: packageId,
        },
    })),

    reset: () => set({
        progress: initialProgress,
    }),
}));

// ============================================
// Selectors
// ============================================

export const selectProgress = (state: InstallStore) => state.progress;
export const selectStatus = (state: InstallStore) => state.progress.status;
export const selectPackages = (state: InstallStore) => state.progress.packages;
export const selectCurrentPackage = (state: InstallStore) => state.progress.currentPackage;
export const selectIsInstalling = (state: InstallStore) => state.progress.status === 'installing';

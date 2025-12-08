import { create } from 'zustand';
import type {
    PakkyConfig,
    InstallProgress,
    PackageInstallItem,
    PackageStatus
} from '../lib/types';
import { INSTALL_CONFIG } from '../lib/config';

interface InstallStore {
    // State
    progress: InstallProgress;
    config: PakkyConfig | null;
    userInputValues: Record<string, string>;

    // Actions
    setConfig: (config: PakkyConfig | null) => void;
    startInstallation: () => void;
    cancelInstallation: () => void;
    completeInstallation: () => void;

    // Package updates
    setPackages: (packages: PackageInstallItem[]) => void;
    updatePackageStatus: (packageId: string, status: PackageStatus, error?: string) => void;
    addPackageLog: (packageId: string, log: string) => void;
    setCurrentPackage: (packageId: string | undefined) => void;

    // User input
    setUserInputValues: (values: Record<string, string>) => void;
    setUserInputValue: (key: string, value: string) => void;

    // Reset
    reset: () => void;
}

const initialProgress: InstallProgress = {
    status: 'idle',
    packages: [],
    totalPackages: 0,
    completedPackages: 0,
    failedPackages: 0,
    skippedPackages: 0,
};

export const useInstallStore = create<InstallStore>((set) => ({
    progress: initialProgress,
    config: null,
    userInputValues: {},

    setConfig: (config) => set({ config }),

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
        // Recalculate counts from package statuses
        const completedPackages = packages.filter(
            (p) => p.status === 'success' || p.status === 'already_installed'
        ).length;
        const failedPackages = packages.filter((p) => p.status === 'failed').length;
        const skippedPackages = packages.filter((p) => p.status === 'skipped').length;

        return {
            progress: {
                ...state.progress,
                packages,
                totalPackages: packages.length,
                completedPackages,
                failedPackages,
                skippedPackages,
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

        const completedPackages = packages.filter(
            (p) => p.status === 'success' || p.status === 'already_installed'
        ).length;
        const failedPackages = packages.filter((p) => p.status === 'failed').length;
        const skippedPackages = packages.filter((p) => p.status === 'skipped').length;

        return {
            progress: {
                ...state.progress,
                packages,
                completedPackages,
                failedPackages,
                skippedPackages,
            },
        };
    }),

    addPackageLog: (packageId, log) => set((state) => {
        const maxLogs = INSTALL_CONFIG.maxLogsPerPackage;
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

    setUserInputValues: (values) => set({ userInputValues: values }),

    setUserInputValue: (key, value) => set((state) => ({
        userInputValues: {
            ...state.userInputValues,
            [key]: value,
        },
    })),

    reset: () => set({
        progress: initialProgress,
        config: null,
        userInputValues: {},
    }),
}));

import { create } from 'zustand';
import type { PackageInstallItem } from '../lib/types';
import { QueueManager, type CreatePackageParams } from '@/lib/managers/queueManager';
import { userConfigAPI } from '@/lib/electron';

// ============================================
// Types
// ============================================

interface QueueState {
    /** Packages selected for installation (the queue) */
    packages: PackageInstallItem[];
    /** Packages imported from config file */
    importedPackages: PackageInstallItem[];
    /** Whether packages came from an import */
    hasImportedConfig: boolean;
    /** Installation logs per package */
    logs: Record<string, string[]>;
    /** Save timeout ref for debounced persistence */
    _saveTimeout: ReturnType<typeof setTimeout> | null;
}

interface QueueActions {
    // Queue management
    setPackages: (packages: PackageInstallItem[]) => void;
    addPackage: (params: CreatePackageParams) => void;
    addPackages: (pkgs: PackageInstallItem[]) => void;
    removePackage: (id: string) => void;
    clearPackages: () => void;
    updatePackage: (id: string, updates: Partial<PackageInstallItem>) => void;
    reorderPackages: (packages: PackageInstallItem[]) => void;

    // Import management
    setImportedPackages: (packages: PackageInstallItem[]) => void;
    clearImportedPackages: () => void;
    setHasImportedConfig: (value: boolean) => void;

    // Log management
    setLogs: (logs: Record<string, string[]>) => void;
    addLog: (packageId: string, log: string) => void;
    clearLogs: (packageId?: string) => void;

    // Initialization
    initFromUserConfig: (queue: PackageInstallItem[]) => void;

    // Internal
    _scheduleSave: () => void;
}

type QueueStore = QueueState & QueueActions;

// ============================================
// Initial State
// ============================================

const initialState: QueueState = {
    packages: [],
    importedPackages: [],
    hasImportedConfig: false,
    logs: {},
    _saveTimeout: null,
};

// ============================================
// Store
// ============================================

export const useQueueStore = create<QueueStore>((set, get) => ({
    ...initialState,

    // ----------------------------------------
    // Queue Management
    // ----------------------------------------

    setPackages: (packages) => {
        set({ packages });
        get()._scheduleSave();
    },

    addPackage: (params) => {
        set((state) => {
            const result = QueueManager.add(state.packages, params);
            return {
                packages: [...state.packages, ...result.added],
            };
        });
        get()._scheduleSave();
    },

    addPackages: (pkgs) => {
        set((state) => ({
            packages: QueueManager.merge(state.packages, pkgs),
        }));
        get()._scheduleSave();
    },

    removePackage: (id) => {
        set((state) => ({
            packages: QueueManager.remove(state.packages, id),
            logs: (() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [id]: _removed, ...rest } = state.logs;
                return rest;
            })(),
        }));
        get()._scheduleSave();
    },

    clearPackages: () => {
        set({
            packages: [],
            hasImportedConfig: false,
            logs: {},
        });
        get()._scheduleSave();
    },

    updatePackage: (id, updates) => {
        set((state) => ({
            packages: state.packages.map((pkg) =>
                pkg.id === id ? { ...pkg, ...updates } : pkg
            ),
        }));
        get()._scheduleSave();
    },

    reorderPackages: (packages) => {
        // Reorder keeps positions updated
        const reordered = packages.map((pkg, index) => ({
            ...pkg,
            position: index + 1,
        }));
        set({ packages: reordered });
        get()._scheduleSave();
    },

    // ----------------------------------------
    // Import Management
    // ----------------------------------------

    setImportedPackages: (packages) => {
        set({
            importedPackages: packages,
            hasImportedConfig: packages.length > 0,
        });
    },

    clearImportedPackages: () => {
        set({
            importedPackages: [],
            hasImportedConfig: false,
        });
    },

    setHasImportedConfig: (value) => {
        set({ hasImportedConfig: value });
    },

    // ----------------------------------------
    // Log Management
    // ----------------------------------------

    setLogs: (logs) => {
        set({ logs });
    },

    addLog: (packageId, log) => {
        set((state) => ({
            logs: {
                ...state.logs,
                [packageId]: [...(state.logs[packageId] || []), log],
            },
        }));
    },

    clearLogs: (packageId) => {
        if (packageId) {
            set((state) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [packageId]: _removed, ...rest } = state.logs;
                return { logs: rest };
            });
        } else {
            set({ logs: {} });
        }
    },

    // ----------------------------------------
    // Initialization
    // ----------------------------------------

    initFromUserConfig: (queue) => {
        if (queue && queue.length > 0) {
            set((state) => ({
                packages: QueueManager.merge(state.packages, queue),
            }));
        }
    },

    // ----------------------------------------
    // Internal: Debounced Persistence
    // ----------------------------------------

    _scheduleSave: () => {
        const state = get();

        // Clear existing timeout
        if (state._saveTimeout) {
            clearTimeout(state._saveTimeout);
        }

        // Schedule new save (debounced 1s)
        const timeout = setTimeout(() => {
            userConfigAPI.save({
                queue: get().packages,
            }).catch((err) => console.error('Failed to save queue:', err));
        }, 1000);

        set({ _saveTimeout: timeout });
    },
}));

// ============================================
// Selectors (for performance)
// ============================================

export const selectPackages = (state: QueueStore) => state.packages;
export const selectImportedPackages = (state: QueueStore) => state.importedPackages;
export const selectHasImportedConfig = (state: QueueStore) => state.hasImportedConfig;
export const selectLogs = (state: QueueStore) => state.logs;
export const selectPackageCount = (state: QueueStore) => state.packages.length;
export const selectHasPackages = (state: QueueStore) => state.packages.length > 0;

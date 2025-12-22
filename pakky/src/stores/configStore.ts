import { create } from 'zustand';
import type { PakkyConfig, ConfigSettings } from '../lib/types';

// ============================================
// Store Interface
// ============================================

interface ConfigState {
    /** Currently loaded config (from import or preset) */
    config: PakkyConfig | null;
    /** User input values for script prompts */
    userInputValues: Record<string, string>;
}

interface ConfigActions {
    /** Set the loaded config */
    setConfig: (config: PakkyConfig | null) => void;
    /** Get effective settings (from config or defaults) */
    getEffectiveSettings: () => ConfigSettings;
    /** Set all user input values */
    setUserInputValues: (values: Record<string, string>) => void;
    /** Set a single user input value */
    setUserInputValue: (key: string, value: string) => void;
    /** Clear user input values */
    clearUserInputValues: () => void;
    /** Reset the store */
    reset: () => void;
}

type ConfigStore = ConfigState & ConfigActions;

// ============================================
// Default Settings
// ============================================

const DEFAULT_SETTINGS: ConfigSettings = {
    continue_on_error: true,
    skip_already_installed: true,
    parallel_installs: false,
};

// ============================================
// Initial State
// ============================================

const initialState: ConfigState = {
    config: null,
    userInputValues: {},
};

// ============================================
// Store
// ============================================

export const useConfigStore = create<ConfigStore>((set, get) => ({
    ...initialState,

    setConfig: (config) => set({ config }),

    getEffectiveSettings: () => {
        const config = get().config;
        return {
            ...DEFAULT_SETTINGS,
            ...config?.settings,
        };
    },

    setUserInputValues: (values) => set({ userInputValues: values }),

    setUserInputValue: (key, value) => set((state) => ({
        userInputValues: {
            ...state.userInputValues,
            [key]: value,
        },
    })),

    clearUserInputValues: () => set({ userInputValues: {} }),

    reset: () => set(initialState),
}));

// ============================================
// Selectors
// ============================================

export const selectConfig = (state: ConfigStore) => state.config;
export const selectUserInputValues = (state: ConfigStore) => state.userInputValues;
export const selectSettings = (state: ConfigStore) => state.config?.settings;

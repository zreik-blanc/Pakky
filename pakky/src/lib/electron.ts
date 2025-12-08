// Electron IPC API wrapper for renderer process
// Types are provided by electron/electron-env.d.ts
import type { PakkyConfig, InstallProgress } from './types';

// System API
export const systemAPI = {
    getPlatform: (): Promise<string> => {
        return window.pakky.invoke<string>('system:getPlatform');
    },

    getSystemInfo: (): Promise<{
        platform: string;
        arch: string;
        version: string;
        homeDir: string;
        hostname: string;
    }> => {
        return window.pakky.invoke<{
            platform: string;
            arch: string;
            version: string;
            homeDir: string;
            hostname: string;
        }>('system:getInfo');
    },

    checkHomebrew: (): Promise<boolean> => {
        return window.pakky.invoke<boolean>('system:checkHomebrew');
    },

    quitApp: (): Promise<void> => {
        return window.pakky.invoke<void>('app:quit');
    },
};

// Config API
export const configAPI = {
    loadConfig: (filePath: string): Promise<PakkyConfig> => {
        return window.pakky.invoke<PakkyConfig>('config:load', filePath);
    },

    saveConfig: (filePath: string, config: PakkyConfig): Promise<void> => {
        return window.pakky.invoke<void>('config:save', filePath, config);
    },

    selectConfigFile: (): Promise<string | null> => {
        return window.pakky.invoke<string | null>('config:selectFile');
    },

    saveConfigDialog: (config: PakkyConfig): Promise<string | null> => {
        return window.pakky.invoke<string | null>('config:saveDialog', config);
    },
};

// Install API
export const installAPI = {
    startInstallation: (packages: Array<{
        id: string
        name: string
        type: 'formula' | 'cask' | 'mas' | 'winget' | 'chocolatey' | 'apt' | 'dnf' | 'pacman'
        status: string
        description?: string
        logs: string[]
        error?: string
    }>): Promise<{ success: boolean; completedPackages: number; failedPackages: number }> => {
        return window.pakky.invoke<{ success: boolean; completedPackages: number; failedPackages: number }>('install:start', { packages })
    },

    cancelInstallation: (): Promise<void> => {
        return window.pakky.invoke<void>('install:cancel');
    },

    getInstalledPackages: (): Promise<{
        formulae: string[];
        casks: string[];
    }> => {
        return window.pakky.invoke<{ formulae: string[]; casks: string[] }>('install:getInstalled');
    },

    installHomebrew: (): Promise<void> => {
        return window.pakky.invoke<void>('install:homebrew');
    },

    checkHomebrew: (): Promise<boolean> => {
        return window.pakky.invoke<boolean>('install:checkHomebrew');
    },

    // Subscribe to installation progress updates
    onProgress: (callback: (progress: InstallProgress) => void) => {
        const listenerId = window.pakky.on<InstallProgress>('install:progress', (_event, progress) => callback(progress));
        return () => window.pakky.off('install:progress', listenerId);
    },

    // Subscribe to log output
    onLog: (callback: (log: { packageId: string; line: string; type: 'stdout' | 'stderr' }) => void) => {
        const listenerId = window.pakky.on<{ packageId: string; line: string; type: 'stdout' | 'stderr' }>('install:log', (_event, log) => callback(log));
        return () => window.pakky.off('install:log', listenerId);
    },
};

// Search API
export const searchAPI = {
    searchBrew: (query: string): Promise<Array<{
        name: string;
        type: 'formula' | 'cask';
        description?: string;
        version?: string;
        installed?: boolean;
    }>> => {
        return window.pakky.invoke<Array<{
            name: string;
            type: 'formula' | 'cask';
            description?: string;
            version?: string;
            installed?: boolean;
        }>>('search:brew', query);
    },

    getPackageInfo: (name: string, type: 'formula' | 'cask'): Promise<{
        description?: string;
        version?: string;
    } | null> => {
        return window.pakky.invoke<{ description?: string; version?: string } | null>('search:info', name, type);
    },
};

// User Input API (for .pakky.env)
export const userInputAPI = {
    getStoredValues: (): Promise<Record<string, string>> => {
        return window.pakky.invoke<Record<string, string>>('userInput:getValues');
    },

    saveValues: (values: Record<string, string>): Promise<void> => {
        return window.pakky.invoke<void>('userInput:saveValues', values);
    },

    getValue: (key: string): Promise<string | null> => {
        return window.pakky.invoke<string | null>('userInput:getValue', key);
    },
};

// Shell API
// SECURITY NOTE: runCommand has been removed to prevent arbitrary command execution
export const shellAPI = {
    openExternal: (url: string): Promise<void> => {
        return window.pakky.invoke<void>('shell:openExternal', url);
    },
};

// User Config API
export const userConfigAPI = {
    read: (): Promise<import('./types').UserConfig | null> => {
        return window.pakky.invoke<import('./types').UserConfig | null>('userConfig:read');
    },

    save: (config: { userName: string; systemInfo?: import('./types').SystemInfo }): Promise<void> => {
        return window.pakky.invoke<void>('userConfig:save', config);
    },

    reset: (): Promise<void> => {
        return window.pakky.invoke<void>('userConfig:reset');
    },
};

// Presets API
export const presetsAPI = {
    getPresets: (): Promise<import('./types').Preset[]> => {
        return window.pakky.invoke<import('./types').Preset[]>('presets:list');
    },
};

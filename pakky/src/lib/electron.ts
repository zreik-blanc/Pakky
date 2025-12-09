// Electron IPC API wrapper for renderer process
// Types are provided by electron/electron-env.d.ts
import type { PakkyConfig, InstallProgress } from './types';

// Security scan result from config loading
export interface SecurityScanResult {
    hasDangerousContent: boolean;
    hasSuspiciousContent: boolean;
    hasObfuscation: boolean;
    dangerousCommands: string[];
    suspiciousCommands: string[];
    obfuscatedCommands: string[];
    warnings: string[];
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface ConfigLoadResult {
    config: PakkyConfig;
    security: SecurityScanResult;
}

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
    loadConfig: (filePath: string): Promise<ConfigLoadResult> => {
        return window.pakky.invoke<ConfigLoadResult>('config:load', filePath);
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
        type: 'formula' | 'cask' | 'mas' | 'winget' | 'chocolatey' | 'apt' | 'dnf' | 'pacman' | 'script'
        status: string
        description?: string
        logs: string[]
        error?: string
        postInstall?: string[]
        required?: boolean
        commands?: string[]
        promptForInput?: {
            [key: string]: {
                message: string
                default?: string
                validation?: 'email' | 'url' | 'path' | 'none'
            }
        }
    }>, settings?: {
        continue_on_error?: boolean
        skip_already_installed?: boolean
        parallel_installs?: boolean
    }, userInputValues?: Record<string, string>): Promise<{ success: boolean; completedPackages: number; failedPackages: number }> => {
        return window.pakky.invoke<{ success: boolean; completedPackages: number; failedPackages: number }>('install:start', { packages, settings, userInputValues })
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

    save: (config: Partial<import('./types').UserConfig>): Promise<void> => {
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

// Window API
export const windowAPI = {
    /** Resize window to normal app size (1200x800) with animation */
    setNormalSize: (): Promise<boolean> => {
        return window.pakky.invoke<boolean>('window:setNormalSize');
    },

    /** Resize window to onboarding size (600x600) */
    setOnboardingSize: (): Promise<void> => {
        return window.pakky.invoke<void>('window:setOnboardingSize');
    },

    /** Get current window size */
    getSize: (): Promise<{ width: number; height: number } | null> => {
        return window.pakky.invoke<{ width: number; height: number } | null>('window:getSize');
    },
};

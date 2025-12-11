/**
 * Shared Types - Barrel Export
 * Central export point for all shared types used by both
 * the Electron main process and the React renderer process.
 */

// Configuration types
export type {
    PakkyConfig,
    ConfigSettings,
    ConfigMetadata,
    MacOSConfig,
    PackageObject,
    CaskObject,
    MASApp,
    ShellConfig,
    MacOSSystemSettings,
    WindowsConfig,
    WingetPackage,
    LinuxConfig,
    ScriptStep,
    SecurityLevelKey,
} from './config';

// Package & Installation types
export type {
    PackageType,
    PackageStatus,
    PackageInstallItem,
    InstallStatus,
    InstallProgress,
    SearchResult,
} from './packages';

// Security types
export type {
    ParsedCommand,
    SecurityScanResult,
    ConfigLoadResult,
} from './security';

// System & User types
export type {
    Platform,
    SystemInfo,
    UserConfig,
    UserInputValues,
} from './system';

// Preset types
export type {
    Preset,
} from './presets';

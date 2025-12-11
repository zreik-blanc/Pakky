/**
 * System & User Types
 * Platform information and user configuration
 */

import type { PackageInstallItem } from './packages';
import type { SecurityLevelKey } from './config';

// ============================================
// Platform Types
// ============================================

export type Platform = 'macos' | 'windows' | 'linux' | 'unknown';

export interface SystemInfo {
    platform: Platform;
    arch: string;
    version: string;
    homeDir: string;
    hostname: string;
}

// ============================================
// User Configuration
// ============================================

export interface UserConfig {
    userName: string;
    systemInfo: SystemInfo;
    queue?: PackageInstallItem[];
    securityLevel?: SecurityLevelKey;
    firstLaunchAt: string;
    lastSeenAt: string;
}

// ============================================
// User Input Storage
// ============================================

export interface UserInputValues {
    [key: string]: string;
}

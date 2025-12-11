/**
 * Package & Installation Types
 * Types for package management and installation progress
 */

// ============================================
// Package Types
// ============================================

export type PackageType = 
    | 'formula' 
    | 'cask' 
    | 'mas' 
    | 'winget' 
    | 'chocolatey' 
    | 'apt' 
    | 'dnf' 
    | 'pacman' 
    | 'script';

export type PackageStatus =
    | 'pending'
    | 'checking'
    | 'installing'
    | 'success'
    | 'failed'
    | 'skipped'
    | 'already_installed';

export interface PackageInstallItem {
    id: string;
    name: string;
    type: PackageType;
    position?: number;
    status: PackageStatus;
    description?: string;
    version?: string;
    required?: boolean;
    postInstall?: string[];
    extensions?: string[];
    commands?: string[];
    promptForInput?: {
        [key: string]: {
            message: string;
            default?: string;
            validation?: 'email' | 'url' | 'path' | 'none';
        };
    };
    logs: string[];
    error?: string;
    startTime?: number;
    endTime?: number;
    action?: 'install' | 'reinstall';
}

// ============================================
// Installation Progress
// ============================================

export type InstallStatus = 'idle' | 'checking' | 'installing' | 'completed' | 'cancelled';

export interface InstallProgress {
    status: InstallStatus;
    currentPackage?: string;
    packages: PackageInstallItem[];
    totalPackages: number;
    completedPackages: number;
    failedPackages: number;
    skippedPackages: number;
}

// ============================================
// Search Result
// ============================================

export interface SearchResult {
    name: string;
    type: 'formula' | 'cask';
    description?: string;
    version?: string;
    installed?: boolean;
}

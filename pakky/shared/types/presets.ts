/**
 * Preset Types
 * Configuration presets for quick setup
 */

import type { ConfigSettings, PackageObject, CaskObject, ScriptStep } from './config';

export interface Preset {
    id: string;
    name: string;
    description: string;
    icon?: string;
    settings?: ConfigSettings;
    macos?: {
        requires?: {
            min_version?: string;
            arch?: ('arm64' | 'x86_64')[];
        };
        homebrew?: {
            taps?: string[];
            formulae?: (string | PackageObject)[];
            casks?: (string | CaskObject)[];
        };
        mas?: {
            id: number;
            name: string;
            description?: string;
            required?: boolean;
        }[];
        shell?: {
            default_shell?: 'zsh' | 'bash' | 'fish';
            install_oh_my_zsh?: boolean;
            oh_my_zsh_theme?: string;
            zsh_plugins?: string[];
        };
    };
    windows?: {
        requires?: {
            min_version?: string;
        };
        winget?: (string | {
            id: string;
            description?: string;
            required?: boolean;
        })[];
        chocolatey?: string[];
        wsl?: {
            enable?: boolean;
            distro?: string;
            install_packages?: string[];
        };
        powershell?: {
            profile_setup?: boolean;
            modules?: string[];
        };
    };
    linux?: {
        requires?: {
            distros?: string[];
        };
        apt?: (string | PackageObject)[];
        dnf?: string[];
        pacman?: string[];
        flatpak?: {
            enabled?: boolean;
            packages?: string[];
        };
    };
    packages?: {
        taps?: string[];
        formulae?: (string | PackageObject)[];
        casks?: (string | CaskObject)[];
    };
    scripts?: ScriptStep[];
}

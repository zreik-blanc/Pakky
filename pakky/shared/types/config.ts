/**
 * Configuration Types
 * Core types for Pakky configurations
 */

// ============================================
// Config Root Types
// ============================================

export interface PakkyConfig {
    $schema?: string;
    name: string;
    version: string;
    author?: string;
    description?: string;
    tags?: string[];
    settings?: ConfigSettings;
    macos?: MacOSConfig;
    windows?: WindowsConfig;
    linux?: LinuxConfig;
    scripts?: ScriptStep[];
    metadata?: ConfigMetadata;
}

export interface ConfigSettings {
    continue_on_error?: boolean;
    skip_already_installed?: boolean;
    parallel_installs?: boolean;
    create_backup?: boolean;
}

export interface ConfigMetadata {
    created_at?: string;
    updated_at?: string;
    pakky_version?: string;
    exported_from?: string;
    checksum?: string;
}

// ============================================
// macOS Configuration
// ============================================

export interface MacOSConfig {
    requires?: {
        min_version?: string;
        arch?: ('arm64' | 'x86_64')[];
    };
    homebrew?: {
        taps?: string[];
        formulae?: (string | PackageObject)[];
        casks?: (string | CaskObject)[];
    };
    mas?: MASApp[];
    shell?: ShellConfig;
    system?: MacOSSystemSettings;
}

export interface PackageObject {
    name: string;
    version?: string;
    description?: string;
    required?: boolean;
    position?: number;
    post_install?: string[];
}

export interface CaskObject {
    name: string;
    description?: string;
    required?: boolean;
    position?: number;
    extensions?: string[];
    post_install?: string[];
}

export interface MASApp {
    id: number;
    name: string;
    description?: string;
    required?: boolean;
}

export interface ShellConfig {
    default_shell?: 'zsh' | 'bash' | 'fish';
    install_oh_my_zsh?: boolean;
    oh_my_zsh_theme?: string;
    zsh_plugins?: string[];
    dotfiles?: {
        source: string;
        files: string[];
    };
}

export interface MacOSSystemSettings {
    dock?: {
        autohide?: boolean;
        size?: number;
        position?: 'bottom' | 'left' | 'right';
        show_recents?: boolean;
    };
    finder?: {
        show_hidden_files?: boolean;
        show_path_bar?: boolean;
        show_status_bar?: boolean;
        default_view?: 'icon' | 'list' | 'column' | 'gallery';
    };
    keyboard?: {
        key_repeat_rate?: number;
        initial_key_repeat?: number;
        disable_press_and_hold?: boolean;
    };
    trackpad?: {
        tap_to_click?: boolean;
        three_finger_drag?: boolean;
    };
    screenshots?: {
        location?: string;
        format?: 'png' | 'jpg' | 'pdf';
        show_thumbnail?: boolean;
    };
}

// ============================================
// Windows Configuration
// ============================================

export interface WindowsConfig {
    requires?: {
        min_version?: string;
    };
    winget?: (string | WingetPackage)[];
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
}

export interface WingetPackage {
    id: string;
    description?: string;
    required?: boolean;
}

// ============================================
// Linux Configuration
// ============================================

export interface LinuxConfig {
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
    shell?: ShellConfig;
}

// ============================================
// Script Configuration
// ============================================

export interface ScriptStep {
    name: string;
    position?: number;
    condition?: string;
    prompt?: string;
    prompt_for_input?: {
        [key: string]: {
            message: string;
            default?: string;
            validation?: 'email' | 'url' | 'path' | 'none';
        };
    };
    commands: string[];
    continue_on_error?: boolean;
}

// ============================================
// Security Level
// ============================================

export type SecurityLevelKey = 'STRICT' | 'STANDARD' | 'PERMISSIVE';

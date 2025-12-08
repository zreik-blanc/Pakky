// Pakky Configuration Types

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
    post_install?: PostInstallStep[];
    metadata?: ConfigMetadata;
}

export interface ConfigSettings {
    continue_on_error?: boolean;
    skip_already_installed?: boolean;
    parallel_installs?: boolean;
    create_backup?: boolean;
}

// macOS Configuration
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
    post_install?: string[];
}

export interface CaskObject {
    name: string;
    description?: string;
    required?: boolean;
    extensions?: string[]; // VS Code extensions
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

// Windows Configuration
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

// Linux Configuration
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

// Post-install Configuration
export interface PostInstallStep {
    name: string;
    condition?: string; // 'always', 'macos', 'windows', 'linux', 'package_installed:<name>'
    prompt?: string; // Ask user before running
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

export interface ConfigMetadata {
    created_at?: string;
    updated_at?: string;
    pakky_version?: string;
    exported_from?: string;
    checksum?: string;
}

// Installation Status Types
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
    type: 'formula' | 'cask' | 'mas' | 'winget' | 'chocolatey' | 'apt' | 'dnf' | 'pacman';
    status: PackageStatus;
    description?: string;
    logs: string[];
    error?: string;
    startTime?: number;
    endTime?: number;
}

export interface InstallProgress {
    status: 'idle' | 'checking' | 'installing' | 'completed' | 'cancelled';
    currentPackage?: string;
    packages: PackageInstallItem[];
    totalPackages: number;
    completedPackages: number;
    failedPackages: number;
    skippedPackages: number;
}

// Platform Info
export type Platform = 'macos' | 'windows' | 'linux' | 'unknown';

export interface SystemInfo {
    platform: Platform;
    arch: string;
    version: string;
    homeDir: string;
    hostname: string;
}

// User Input Storage
export interface UserInputValues {
    [key: string]: string;
}

// Search Result from Homebrew
export interface SearchResult {
    name: string;
    type: 'formula' | 'cask';
    description?: string;
    version?: string;
    installed?: boolean;
}

export interface Preset {
    id: string;
    name: string;
    description: string;
    icon?: string; // Icon name if we want to dynamic load icons later, but for now we might rely on hardcoded mapping or generic ones
    macos?: {
        homebrew?: {
            formulae?: (string | PackageObject)[];
            casks?: (string | CaskObject)[];
        }
    };
    packages?: {
        formulae?: (string | PackageObject)[];
        casks?: (string | CaskObject)[];
    };
}


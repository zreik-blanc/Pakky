/**
 * Config Builder Utility
 * Builds rich PakkyConfig objects from selected packages
 */

import type { 
    PakkyConfig, 
    PackageInstallItem, 
    SystemInfo, 
    ConfigSettings,
    ConfigMetadata,
    PackageObject,
    CaskObject 
} from './types';
import { APP_CONFIG } from './config';

// ============================================
// Types
// ============================================

export interface BuildConfigOptions {
    name: string;
    description?: string;
    author?: string;
    tags?: string[];
    includeDescriptions: boolean;
    includeMetadata: boolean;
    includeSystemRequirements: boolean;
    settings: ConfigSettings;
    systemInfo?: SystemInfo;
}

// ============================================
// Auto-Tag Suggestions
// ============================================

interface TagRule {
    keywords: string[];
    tags: string[];
}

const TAG_RULES: TagRule[] = [
    { keywords: ['node', 'npm', 'yarn', 'pnpm', 'typescript', 'deno', 'bun'], tags: ['javascript', 'web-dev'] },
    { keywords: ['python', 'pip', 'conda', 'jupyter', 'pandas', 'numpy'], tags: ['python', 'data-science'] },
    { keywords: ['docker', 'kubernetes', 'podman', 'k9s', 'helm'], tags: ['devops', 'containerization'] },
    { keywords: ['visual-studio-code', 'sublime', 'atom', 'vim', 'neovim', 'emacs'], tags: ['editor', 'development'] },
    { keywords: ['git', 'gh', 'gitlab', 'hub', 'lazygit'], tags: ['version-control'] },
    { keywords: ['postgres', 'mysql', 'redis', 'mongodb', 'sqlite', 'mariadb'], tags: ['database'] },
    { keywords: ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'vite'], tags: ['frontend'] },
    { keywords: ['aws', 'azure', 'gcloud', 'terraform', 'pulumi'], tags: ['cloud'] },
    { keywords: ['go', 'golang', 'rust', 'cargo'], tags: ['systems-programming'] },
    { keywords: ['java', 'kotlin', 'gradle', 'maven'], tags: ['java'] },
    { keywords: ['ruby', 'rails', 'rbenv'], tags: ['ruby'] },
    { keywords: ['php', 'composer', 'laravel'], tags: ['php'] },
    { keywords: ['figma', 'sketch', 'adobe'], tags: ['design'] },
    { keywords: ['slack', 'discord', 'zoom', 'teams'], tags: ['communication'] },
    { keywords: ['1password', 'bitwarden', 'lastpass'], tags: ['security'] },
    { keywords: ['raycast', 'alfred', 'rectangle', 'magnet'], tags: ['productivity'] },
    { keywords: ['iterm', 'warp', 'alacritty', 'kitty', 'hyper'], tags: ['terminal'] },
    { keywords: ['arc', 'firefox', 'chrome', 'brave', 'safari'], tags: ['browser'] },
    { keywords: ['spotify', 'vlc', 'iina'], tags: ['media'] },
];

/**
 * Generate tag suggestions based on package names
 */
export function generateTagSuggestions(packages: PackageInstallItem[]): string[] {
    const packageNames = packages.map(p => p.name.toLowerCase());
    const suggestedTags = new Set<string>();

    for (const rule of TAG_RULES) {
        const hasMatch = rule.keywords.some(keyword => 
            packageNames.some(name => name.includes(keyword))
        );
        if (hasMatch) {
            rule.tags.forEach(tag => suggestedTags.add(tag));
        }
    }

    return Array.from(suggestedTags).sort();
}

// ============================================
// Config Building
// ============================================

/**
 * Convert packages to package objects with optional descriptions
 */
function convertToPackageObjects(
    packages: PackageInstallItem[], 
    includeDescriptions: boolean
): (string | PackageObject)[] {
    if (!includeDescriptions) {
        return packages.map(p => p.name);
    }

    return packages.map(p => {
        if (p.description) {
            return {
                name: p.name,
                description: p.description,
            } as PackageObject;
        }
        return p.name;
    });
}

/**
 * Convert cask packages to cask objects with optional descriptions
 */
function convertToCaskObjects(
    packages: PackageInstallItem[], 
    includeDescriptions: boolean
): (string | CaskObject)[] {
    if (!includeDescriptions) {
        return packages.map(p => p.name);
    }

    return packages.map(p => {
        if (p.description) {
            return {
                name: p.name,
                description: p.description,
            } as CaskObject;
        }
        return p.name;
    });
}

/**
 * Generate config metadata
 */
function generateMetadata(systemInfo?: SystemInfo): ConfigMetadata {
    const now = new Date().toISOString();
    
    let exportedFrom = 'Unknown';
    if (systemInfo) {
        const platformName = systemInfo.platform === 'macos' ? 'macOS' : 
                            systemInfo.platform === 'windows' ? 'Windows' : 
                            systemInfo.platform === 'linux' ? 'Linux' : 'Unknown';
        exportedFrom = `${platformName} ${systemInfo.version} (${systemInfo.arch})`;
    }

    return {
        created_at: now,
        updated_at: now,
        pakky_version: APP_CONFIG.version,
        exported_from: exportedFrom,
    };
}

/**
 * Get macOS version from system info version string
 * Extracts major.minor version (e.g., "14.2" from "14.2.1")
 */
function getMacOSMinVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length >= 2) {
        return `${parts[0]}.${parts[1]}`;
    }
    return version;
}

/**
 * Build a complete PakkyConfig from selected packages
 */
export function buildPakkyConfig(
    packages: PackageInstallItem[],
    options: BuildConfigOptions
): PakkyConfig {
    const formulae = packages.filter(p => p.type === 'formula');
    const casks = packages.filter(p => p.type === 'cask');

    const config: PakkyConfig = {
        $schema: './pakky-config.schema.json',
        name: options.name,
        version: APP_CONFIG.DEFAULTS.EXPORT_VERSION,
    };

    // Add optional top-level fields
    if (options.author) {
        config.author = options.author;
    }

    if (options.description) {
        config.description = options.description;
    }

    if (options.tags && options.tags.length > 0) {
        config.tags = options.tags;
    }

    // Add settings if any are enabled
    const hasSettings = Object.values(options.settings).some(v => v !== undefined);
    if (hasSettings) {
        config.settings = options.settings;
    }

    // Build macOS config
    if (formulae.length > 0 || casks.length > 0) {
        config.macos = {
            homebrew: {}
        };

        // Add system requirements if enabled
        if (options.includeSystemRequirements && options.systemInfo) {
            config.macos.requires = {
                min_version: getMacOSMinVersion(options.systemInfo.version),
                arch: [options.systemInfo.arch as 'arm64' | 'x86_64'],
            };
        }

        // Add formulae
        if (formulae.length > 0) {
            config.macos.homebrew!.formulae = convertToPackageObjects(
                formulae, 
                options.includeDescriptions
            );
        }

        // Add casks
        if (casks.length > 0) {
            config.macos.homebrew!.casks = convertToCaskObjects(
                casks, 
                options.includeDescriptions
            );
        }
    }

    // Add metadata if enabled
    if (options.includeMetadata) {
        config.metadata = generateMetadata(options.systemInfo);
    }

    return config;
}

// ============================================
// Default Options
// ============================================

export const DEFAULT_BUILD_OPTIONS: Omit<BuildConfigOptions, 'name'> = {
    includeDescriptions: true,
    includeMetadata: true,
    includeSystemRequirements: true,
    settings: {
        continue_on_error: true,
        skip_already_installed: true,
        parallel_installs: false,
    },
};

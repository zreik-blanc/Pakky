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
    CaskObject,
    ScriptStep
} from './types';
import { APP, EXPORT_DEFAULTS, TAG_RULES } from './constants';

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
    // User-specified system requirements (for export customization)
    systemRequirements?: {
        minVersion?: string;
        architectures?: ('arm64' | 'x86_64')[];
    };
}

// ============================================
// Auto-Tag Suggestions
// ============================================

// TAG_RULES is now imported from './constants/tags'

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
 * Convert packages to package objects with optional descriptions and position
 */
function convertToPackageObjects(
    packages: PackageInstallItem[],
    includeDescriptions: boolean
): (string | PackageObject)[] {
    // Always use object format to include position
    return packages.map(p => {
        const obj: PackageObject = {
            name: p.name,
        };
        if (includeDescriptions && p.description) {
            obj.description = p.description;
        }
        if (p.position !== undefined) {
            obj.position = p.position;
        }
        return obj;
    });
}

/**
 * Convert cask packages to cask objects with optional descriptions and position
 */
function convertToCaskObjects(
    packages: PackageInstallItem[],
    includeDescriptions: boolean
): (string | CaskObject)[] {
    // Always use object format to include position
    return packages.map(p => {
        const obj: CaskObject = {
            name: p.name,
        };
        if (includeDescriptions && p.description) {
            obj.description = p.description;
        }
        if (p.position !== undefined) {
            obj.position = p.position;
        }
        return obj;
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
        pakky_version: APP.VERSION,
        exported_from: exportedFrom,
    };
}

/**
 * Get macOS version from system info version string
 * Extracts major.minor version (e.g., "14.2" from "14.2.1")
 */
export function getMacOSMinVersion(version: string): string {
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
    // Sort by position to preserve user's queue order
    const sortedPackages = [...packages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const formulae = sortedPackages.filter(p => p.type === 'formula');
    const casks = sortedPackages.filter(p => p.type === 'cask');
    const scripts = sortedPackages.filter(p => p.type === 'script');

    const config: PakkyConfig = {
        $schema: './pakky-config.schema.json',
        name: options.name,
        version: EXPORT_DEFAULTS.VERSION,
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

        // Add system requirements if enabled (inside macos config)
        if (options.includeSystemRequirements && options.systemRequirements) {
            const { minVersion, architectures } = options.systemRequirements;
            if (minVersion || (architectures && architectures.length > 0)) {
                config.macos.requires = {};
                if (minVersion) {
                    config.macos.requires.min_version = minVersion;
                }
                if (architectures && architectures.length > 0) {
                    config.macos.requires.arch = architectures;
                }
            }
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

    // Add scripts
    if (scripts.length > 0) {
        config.scripts = scripts.map(script => {
            const step: ScriptStep = {
                name: script.name,
                commands: script.commands || [],
            };
            if (script.position !== undefined) {
                step.position = script.position;
            }
            if (script.description && script.description !== 'Script') {
                step.prompt = script.description;
            }
            if (script.promptForInput && Object.keys(script.promptForInput).length > 0) {
                step.prompt_for_input = script.promptForInput;
            }
            return step;
        });
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
    includeSystemRequirements: false,
    settings: {
        continue_on_error: true,
        skip_already_installed: true,
        parallel_installs: false,
    },
};

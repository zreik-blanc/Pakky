/**
 * Config Parser Utility
 * Parses PakkyConfig and Preset objects into PackageInstallItem arrays
 * Handles rich schemas with descriptions, post_install, required flags, etc.
 */

import type { 
    PakkyConfig, 
    PackageInstallItem, 
    Preset,
    PackageObject,
    CaskObject,
    ConfigSettings,
    PostInstallStep
} from './types';

// ============================================
// Types
// ============================================

export interface ParsedConfig {
    packages: PackageInstallItem[];
    settings?: ConfigSettings;
    configName?: string;
    configDescription?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse a formula item (string or PackageObject) into PackageInstallItem
 */
function parseFormulaItem(item: string | PackageObject): PackageInstallItem {
    if (typeof item === 'string') {
        return {
            id: `formula:${item}`,
            name: item,
            type: 'formula',
            status: 'pending',
            description: 'CLI tool',
            logs: [],
        };
    }

    return {
        id: `formula:${item.name}`,
        name: item.name,
        type: 'formula',
        status: 'pending',
        description: item.description || 'CLI tool',
        version: item.version,
        required: item.required,
        postInstall: item.post_install,
        logs: [],
    };
}

/**
 * Parse a cask item (string or CaskObject) into PackageInstallItem
 */
function parseCaskItem(item: string | CaskObject): PackageInstallItem {
    if (typeof item === 'string') {
        return {
            id: `cask:${item}`,
            name: item,
            type: 'cask',
            status: 'pending',
            description: 'Application',
            logs: [],
        };
    }

    return {
        id: `cask:${item.name}`,
        name: item.name,
        type: 'cask',
        status: 'pending',
        description: item.description || 'Application',
        required: item.required,
        extensions: item.extensions,
        postInstall: item.post_install,
        logs: [],
    };
}

/**
 * Parse a post-install script into PackageInstallItem
 */
function parsePostScriptItem(script: PostInstallStep): PackageInstallItem {
    return {
        id: `script:${script.name}`,
        name: script.name,
        type: 'script',
        status: 'pending',
        description: script.prompt || 'Post-install script',
        commands: script.commands,
        promptForInput: script.prompt_for_input,
        logs: [],
    };
}

// ============================================
// Main Parsing Functions
// ============================================

/**
 * Parse a PakkyConfig into packages and settings
 */
export function parseConfig(config: PakkyConfig): ParsedConfig {
    const packages: PackageInstallItem[] = [];

    // Parse macOS homebrew packages
    if (config.macos?.homebrew) {
        const homebrew = config.macos.homebrew;

        // Add formulae
        if (homebrew.formulae) {
            for (const item of homebrew.formulae) {
                packages.push(parseFormulaItem(item));
            }
        }

        // Add casks
        if (homebrew.casks) {
            for (const item of homebrew.casks) {
                packages.push(parseCaskItem(item));
            }
        }
    }

    // Parse post-install scripts
    if (config.post_install) {
        for (const script of config.post_install) {
            packages.push(parsePostScriptItem(script));
        }
    }

    // TODO: Add support for MAS apps, Windows packages, Linux packages when those features are implemented

    return {
        packages,
        settings: config.settings,
        configName: config.name,
        configDescription: config.description,
    };
}

/**
 * Parse a Preset into packages
 * Presets can have packages in either preset.packages or preset.macos.homebrew
 */
export function parsePreset(preset: Preset): PackageInstallItem[] {
    const packages: PackageInstallItem[] = [];
    
    // Get formulae from either location
    const formulae = preset.packages?.formulae || preset.macos?.homebrew?.formulae || [];
    const casks = preset.packages?.casks || preset.macos?.homebrew?.casks || [];

    // Parse formulae
    for (const item of formulae) {
        packages.push(parseFormulaItem(item));
    }

    // Parse casks
    for (const item of casks) {
        packages.push(parseCaskItem(item));
    }

    // Parse post-install scripts
    if (preset.post_install) {
        for (const script of preset.post_install) {
            packages.push(parsePostScriptItem(script));
        }
    }

    return packages;
}

/**
 * Get package names preview for display (e.g., in preset cards)
 */
export function getPackageNamesPreview(preset: Preset, maxItems: number = 6): string[] {
    const formulae = preset.packages?.formulae || preset.macos?.homebrew?.formulae || [];
    const casks = preset.packages?.casks || preset.macos?.homebrew?.casks || [];
    
    const all = [...formulae, ...casks].slice(0, maxItems);
    return all.map(item => typeof item === 'string' ? item : item.name);
}

/**
 * Count total packages in a preset
 */
export function countPresetPackages(preset: Preset): { formulae: number; casks: number; total: number } {
    const formulae = preset.packages?.formulae || preset.macos?.homebrew?.formulae || [];
    const casks = preset.packages?.casks || preset.macos?.homebrew?.casks || [];
    
    return {
        formulae: formulae.length,
        casks: casks.length,
        total: formulae.length + casks.length,
    };
}

/**
 * Check if a config has any packages to install
 */
export function hasPackages(config: PakkyConfig): boolean {
    const homebrew = config.macos?.homebrew;
    const hasHomebrewPackages = homebrew && (
        (homebrew.formulae?.length ?? 0) > 0 ||
        (homebrew.casks?.length ?? 0) > 0
    );
    const hasPostInstall = (config.post_install?.length ?? 0) > 0;
    
    return hasHomebrewPackages || hasPostInstall;
}

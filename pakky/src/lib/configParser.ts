/**
 * Config Parser Utility
 * Parses PakkyConfig and Preset objects into PackageInstallItem arrays
 * Handles rich schemas with descriptions, scripts, required flags, etc.
 */

import type {
    PakkyConfig,
    PackageInstallItem,
    Preset,
    PackageObject,
    CaskObject,
    ConfigSettings,
    ScriptStep
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
        position: item.position, // Preserve position from config
        status: 'pending',
        description: item.description || 'CLI tool',
        version: item.version,
        required: item.required,
        postInstall: item.post_install, // per-package post-install commands
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
        position: item.position, // Preserve position from config
        status: 'pending',
        description: item.description || 'Application',
        required: item.required,
        extensions: item.extensions,
        postInstall: item.post_install, // per-package post-install commands
        logs: [],
    };
}

/**
 * Parse a script step into PackageInstallItem
 */
function parseScriptItem(script: ScriptStep): PackageInstallItem {
    return {
        id: `script:${script.name}`,
        name: script.name,
        type: 'script',
        position: script.position, // Preserve position from config
        status: 'pending',
        description: script.prompt || 'Script',
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

    // Parse scripts
    if (config.scripts) {
        for (const script of config.scripts) {
            packages.push(parseScriptItem(script));
        }
    }

    // Check if any packages have positions from the imported config
    const hasImportedPositions = packages.some(pkg => pkg.position !== undefined);

    let packagesWithPositions: PackageInstallItem[];
    if (hasImportedPositions) {
        // Sort by imported positions, then assign sequential positions
        const sorted = [...packages].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
        packagesWithPositions = sorted.map((pkg, index) => ({
            ...pkg,
            position: index + 1,
        }));
    } else {
        // No imported positions, assign sequential positions
        packagesWithPositions = packages.map((pkg, index) => ({
            ...pkg,
            position: index + 1,
        }));
    }

    // TODO: Add support for MAS apps, Windows packages, Linux packages when those features are implemented

    return {
        packages: packagesWithPositions,
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

    // Parse scripts
    if (preset.scripts) {
        for (const script of preset.scripts) {
            packages.push(parseScriptItem(script));
        }
    }

    // Check if any packages have positions from the preset
    const hasImportedPositions = packages.some(pkg => pkg.position !== undefined);

    if (hasImportedPositions) {
        // Sort by imported positions, then assign sequential positions
        const sorted = [...packages].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
        return sorted.map((pkg, index) => ({
            ...pkg,
            position: index + 1,
        }));
    }

    // No imported positions, assign sequential positions
    return packages.map((pkg, index) => ({
        ...pkg,
        position: index + 1,
    }));
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
    const hasScripts = (config.scripts?.length ?? 0) > 0;

    return hasHomebrewPackages || hasScripts;
}

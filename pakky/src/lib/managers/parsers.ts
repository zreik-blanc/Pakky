import type { PackageObject, CaskObject, ScriptStep } from '../types';
import type { CreatePackageParams } from './queueManager';

// ============================================
// Parser Helpers
// ============================================

/**
 * Parse a formula item (string or PackageObject) into CreatePackageParams.
 */
export function parseFormulaToParams(item: string | PackageObject): CreatePackageParams {
    if (typeof item === 'string') {
        return { type: 'formula', name: item };
    }

    return {
        type: 'formula',
        name: item.name,
        description: item.description,
        position: item.position,
        version: item.version,
        required: item.required,
        postInstall: item.post_install,
    };
}

/**
 * Parse a cask item (string or CaskObject) into CreatePackageParams.
 */
export function parseCaskToParams(item: string | CaskObject): CreatePackageParams {
    if (typeof item === 'string') {
        return { type: 'cask', name: item };
    }

    return {
        type: 'cask',
        name: item.name,
        description: item.description,
        position: item.position,
        required: item.required,
        extensions: item.extensions,
        postInstall: item.post_install,
    };
}

/**
 * Parse a script step into CreatePackageParams.
 */
export function parseScriptToParams(script: ScriptStep): CreatePackageParams {
    return {
        type: 'script',
        name: script.name,
        description: script.prompt || 'Script',
        position: script.position,
        commands: script.commands,
        promptForInput: script.prompt_for_input,
    };
}

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
        homebrew?: {
            taps?: string[];
            formulae?: (string | PackageObject)[];
            casks?: (string | CaskObject)[];
        }
    };
    packages?: {
        taps?: string[];
        formulae?: (string | PackageObject)[];
        casks?: (string | CaskObject)[];
    };
    scripts?: ScriptStep[];
}

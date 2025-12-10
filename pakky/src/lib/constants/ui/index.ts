/**
 * UI Strings Barrel Export
 * Re-exports all UI string constants
 */

import { COMMON } from './common';
import { HOME } from './home';
import { QUEUE } from './queue';
import { SETTINGS } from './settings';
import { ERRORS } from './errors';
import { PRESETS } from './presets';

export { COMMON, HOME, QUEUE, SETTINGS, ERRORS, PRESETS };

// Legacy compatibility - grouped export matching old UI_STRINGS structure
export const UI_STRINGS = {
    COMMON,
    HOME,
    QUEUE,
    SETTINGS,
    ERRORS,
    PRESETS,
} as const;

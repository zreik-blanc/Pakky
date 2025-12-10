/**
 * Electron Constants Barrel Export
 * Central export point for all electron-side constants
 */

export { PATHS } from './paths';
export { ELECTRON_WINDOW } from './window';
export { CSP } from './security';
export { DIALOGS } from './dialogs';

// Legacy compatibility - grouped export matching old ELECTRON_CONFIG structure
import { PATHS } from './paths';
import { ELECTRON_WINDOW } from './window';
import { CSP } from './security';

export const ELECTRON_CONFIG = {
    PATHS,
    WINDOW: ELECTRON_WINDOW,
    CSP,
} as const;

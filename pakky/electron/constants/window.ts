/**
 * Electron Window Constants
 * Window appearance settings for main process (electron-specific only)
 * Note: BACKGROUND_COLOR is in src/lib/constants/window.ts for single source of truth
 */

export const ELECTRON_WINDOW = {
    TITLE_BAR_STYLE: 'hiddenInset' as const,
} as const;

/**
 * Window Configuration Constants
 * Window dimensions and appearance settings
 */

export const WINDOW = {
    /** Normal app size */
    NORMAL: {
        WIDTH: 1200,
        HEIGHT: 800,
        MIN_WIDTH: 900,
        MIN_HEIGHT: 600,
    },
    /** Onboarding size (smaller, focused) */
    ONBOARDING: {
        WIDTH: 600,
        HEIGHT: 600,
        MIN_WIDTH: 600,
        MIN_HEIGHT: 600,
    },
    BACKGROUND_COLOR: '#0d0d0d',
} as const;

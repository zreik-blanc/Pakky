export const ELECTRON_CONFIG = {
    PATHS: {
        USER_CONFIG: 'user-config.json',
        ICON: 'electron-vite.svg',
        PRELOAD: 'preload.mjs',
        INDEX_HTML: 'index.html',
    },
    WINDOW: {
        BACKGROUND_COLOR: '#0d0d0d',
        TITLE_BAR_STYLE: 'hiddenInset' as const,
    },
    CSP: {
        DEV: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws://localhost:*",
        PROD: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:",
    }
} as const;

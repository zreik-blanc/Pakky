// ============================================
// Application Info
// ============================================
export const APP_CONFIG = {
    name: 'Pakky',
    version: '0.0.3',
    packageManager: 'Homebrew',
    DEFAULTS: {
        EXPORT_NAME: 'My Pakky Config',
        EXPORT_VERSION: '1.0.0',
        EXPORT_DESCRIPTION: 'Exported from Pakky',
    }
} as const;

// ============================================
// Window Configuration
// ============================================
export const WINDOW_CONFIG = {
    // Normal app size
    normal: {
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
    },
    // Onboarding size (smaller, focused)
    onboarding: {
        width: 600,
        height: 600,
        minWidth: 600,
        minHeight: 600,
    },
    backgroundColor: '#0d0d0d',
} as const;

// ============================================
// Installation & Logging
// ============================================
export const INSTALL_CONFIG = {
    /** Maximum log entries per package to prevent memory issues */
    maxLogsPerPackage: 500,
    /** Debounce delay for checking installed packages (ms) */
    checkInstalledDebounceMs: 500,
} as const;

// ============================================
// Search Configuration
// ============================================
export const SEARCH_CONFIG = {
    /** Minimum characters to trigger search */
    minQueryLength: 2,
    /** Maximum characters allowed in search */
    maxQueryLength: 100,
    /** Debounce delay for search input (ms) */
    debounceMs: 300,
    /** Maximum search results to show */
    maxResults: 15,
    /** Maximum results per category (formula/cask) */
    maxResultsPerCategory: 10,
} as const;

// ============================================
// Security Configuration
// ============================================
export const SECURITY_CONFIG = {
    /** Maximum allowed package name length */
    maxPackageNameLength: 128,
    /** Regex pattern for valid package names */
    packageNamePattern: /^[a-z0-9][a-z0-9-_@/.]*$/i,
    /** Allowed URL protocols for external links */
    allowedUrlProtocols: ['http:', 'https:'] as const,
} as const;

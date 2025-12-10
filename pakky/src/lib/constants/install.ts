/**
 * Installation Constants
 * Package installation and logging settings
 */

export const INSTALL = {
    /** Maximum log entries per package to prevent memory issues */
    MAX_LOGS_PER_PACKAGE: 500,
    /** Debounce delay for checking installed packages (ms) */
    CHECK_INSTALLED_DEBOUNCE_MS: 500,
} as const;

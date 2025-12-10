/**
 * Security Configuration Constants
 * Input validation and security settings
 */

export const SECURITY = {
    /** Maximum allowed package name length */
    MAX_PACKAGE_NAME_LENGTH: 128,
    /** Regex pattern for valid package names */
    PACKAGE_NAME_PATTERN: /^[a-z0-9][a-z0-9-_@/.]*$/i,
    /** Allowed URL protocols for external links */
    ALLOWED_URL_PROTOCOLS: ['http:', 'https:'] as const,
} as const;

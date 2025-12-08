import path from 'node:path'
import os from 'node:os'

// Valid package name pattern (prevents command injection)
export const PACKAGE_NAME_REGEX = /^[a-z0-9][a-z0-9-_@/.]*$/i

// Allowed directories for config files (prevents path traversal)
export const ALLOWED_CONFIG_DIRS = [
    os.homedir(),
    path.join(os.homedir(), '.config'),
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'Desktop'),
    path.join(os.homedir(), 'Downloads'),
]

/**
 * Validates that a file path is within allowed directories
 * @param filePath - The path to validate
 * @returns true if the path is allowed, false otherwise
 */
export function isPathAllowed(filePath: string): boolean {
    const resolvedPath = path.resolve(filePath)
    // Check if path is within any allowed directory
    const isAllowed = ALLOWED_CONFIG_DIRS.some(dir => resolvedPath.startsWith(dir))
    // Also verify it's a .json file for config operations
    const isJsonFile = resolvedPath.endsWith('.json')
    return isAllowed && isJsonFile
}

/**
 * Validates package name to prevent command injection
 * @param name - Package name to validate
 * @returns true if valid, false otherwise
 */
export function isValidPackageName(name: string): boolean {
    return PACKAGE_NAME_REGEX.test(name) && name.length <= 128
}

/**
 * Validates URL for safe external opening
 * @param url - URL to validate
 * @returns true if safe to open, false otherwise
 */
export function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

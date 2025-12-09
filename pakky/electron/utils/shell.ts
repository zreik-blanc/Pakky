import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'


// Promisified exec for general command execution
export const execAsync = promisify(exec)

// Promisified execFile for safe command execution (prevents shell injection)
export const execFileAsync = promisify(execFile)

/**
 * Common Homebrew installation paths
 * - Apple Silicon Macs: /opt/homebrew/bin/brew
 * - Intel Macs: /usr/local/bin/brew
 */
const HOMEBREW_PATHS = [
    '/opt/homebrew/bin/brew',  // Apple Silicon (M1/M2/M3)
    '/usr/local/bin/brew',     // Intel Macs
]

/**
 * Get the path to the Homebrew binary
 * Returns null if Homebrew is not installed
 */
export function getHomebrewPath(): string | null {
    // Check common paths first (faster than which)
    for (const brewPath of HOMEBREW_PATHS) {
        if (existsSync(brewPath)) {
            return brewPath
        }
    }
    return null
}

/**
 * Get enhanced PATH with Homebrew directories included
 */
export function getEnhancedPath(): string {
    const currentPath = process.env.PATH || ''
    const homebrewDirs = [
        '/opt/homebrew/bin',
        '/opt/homebrew/sbin',
        '/usr/local/bin',
        '/usr/local/sbin',
    ]

    // Add Homebrew paths if not already present
    const pathParts = currentPath.split(':')
    for (const dir of homebrewDirs) {
        if (!pathParts.includes(dir)) {
            pathParts.unshift(dir)
        }
    }

    return pathParts.join(':')
}

/**
 * Get environment variables with Homebrew paths included
 */
export function getEnhancedEnv(): NodeJS.ProcessEnv {
    return {
        ...process.env,
        PATH: getEnhancedPath(),
    }
}

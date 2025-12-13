import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// Timeout and buffer limits for shell commands
const EXEC_TIMEOUT_MS = 3000
const EXEC_MAX_BUFFER = 1024 * 1024 // 1MB

export type PlatformName = 'macos' | 'windows' | 'linux' | 'unknown'

/**
 * Get the normalized platform name
 */
export function getPlatformName(): PlatformName {
    const platform = process.platform
    if (platform === 'darwin') return 'macos'
    if (platform === 'win32') return 'windows'
    if (platform === 'linux') return 'linux'
    return 'unknown'
}

/**
 * Get system information
 * Async to avoid blocking on operations like hostname lookup
 */
export async function getSystemInfo() {
    let hostname = 'unknown'
    let version = os.release()

    // Use Node's os.hostname() as the primary fast path (no shell spawn)
    try {
        hostname = os.hostname()
    } catch (err) {
        console.warn('[platform] os.hostname() failed:', err)
    }

    // Get macOS product version (e.g. 14.2) instead of Darwin kernel version (e.g. 23.2.0)
    if (getPlatformName() === 'macos') {
        try {
            const { stdout } = await execFileAsync('sw_vers', ['-productVersion'], {
                timeout: EXEC_TIMEOUT_MS,
                maxBuffer: EXEC_MAX_BUFFER,
            })
            version = stdout.trim()
        } catch (err) {
            // Log timeout/error but keep os.release() as fallback
            if (err && typeof err === 'object' && 'killed' in err && err.killed) {
                console.warn('[platform] sw_vers timed out after', EXEC_TIMEOUT_MS, 'ms, using os.release() fallback')
            } else {
                console.warn('[platform] sw_vers failed:', err, '- using os.release() fallback')
            }
        }
    }

    return {
        platform: getPlatformName(),
        arch: process.arch,
        version,
        homeDir: os.homedir(),
        hostname,
    }
}

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
 * Collects basic system information for the current host.
 *
 * Attempts to determine the hostname and OS version; on macOS it prefers the
 * user-visible product version reported by `sw_vers -productVersion` and falls
 * back to `os.release()` if `sw_vers` fails or times out.
 *
 * @returns An object with:
 * - `platform`: the normalized platform name (`'macos' | 'windows' | 'linux' | 'unknown'`)
 * - `arch`: the CPU architecture string (e.g., `'x64'`, `'arm64'`)
 * - `version`: the OS version string (macOS product version when available, otherwise kernel release)
 * - `homeDir`: the user's home directory path
 * - `hostname`: the resolved hostname or `'unknown'` if it could not be obtained
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
            // Check multiple timeout indicators for cross-version Node/Electron compatibility
            const isTimeout =
                err &&
                typeof err === 'object' &&
                (('killed' in err && err.killed === true) ||
                    ('code' in err && err.code === 'ETIMEDOUT') ||
                    ('signal' in err && err.signal != null))

            if (isTimeout) {
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
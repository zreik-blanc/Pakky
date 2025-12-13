import os from 'node:os'
import { execAsync } from './shell'

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

    // Get hostname asynchronously to avoid blocking
    try {
        const { stdout } = await execAsync('hostname')
        hostname = stdout.trim()
    } catch {
        try { hostname = os.hostname() } catch { /* ignore */ }
    }

    // Get macOS product version (e.g. 14.2) instead of Darwin kernel version (e.g. 23.2.0)
    if (getPlatformName() === 'macos') {
        try {
            const { stdout } = await execAsync('sw_vers -productVersion')
            version = stdout.trim()
        } catch { /* keep os.release() */ }
    }

    return {
        platform: getPlatformName(),
        arch: process.arch,
        version,
        homeDir: os.homedir(),
        hostname,
    }
}

import os from 'node:os'

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
 */
export function getSystemInfo() {
    return {
        platform: getPlatformName(),
        arch: process.arch,
        version: os.release(),
        homeDir: os.homedir(),
        hostname: os.hostname(),
    }
}

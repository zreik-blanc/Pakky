import { getPlatformName } from '../utils'

// Re-export macOS installer
export * from './macos'

// Export types
export type { InstallationState, ProgressCallback, LogCallback } from './macos'

/**
 * Get the appropriate installer for the current platform
 * Currently only macOS is implemented
 */
export function getPlatformInstaller() {
    const platform = getPlatformName()

    switch (platform) {
        case 'macos':
            return import('./macos')
        case 'windows':
            throw new Error('Windows installer not implemented yet')
        case 'linux':
            throw new Error('Linux installer not implemented yet')
        default:
            throw new Error(`Unsupported platform: ${platform}`)
    }
}

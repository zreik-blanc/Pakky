import { ipcMain, BrowserWindow } from 'electron'
import type { PackageInstallItem, ConfigSettings } from '../../src/lib/types'
import {
    getInstalledPackages,
    installHomebrew,
    isHomebrewInstalled,
    installPackage,
    cancelInstallation,
    type InstallationState,
} from '../installers'
import { logger } from '../utils'

// Interface for install request from renderer
interface InstallRequest {
    packages: PackageInstallItem[]
    settings?: ConfigSettings
    userInputValues?: Record<string, string>
}

// Default installation settings
const DEFAULT_SETTINGS: ConfigSettings = {
    continue_on_error: true,
    skip_already_installed: true,
    parallel_installs: false,
}

// Track current installation state
let currentInstallation: InstallationState = {
    isRunning: false,
    isCancelled: false,
    currentProcess: null,
}

/**
 * Register installation-related IPC handlers
 */
export function registerInstallHandlers(getWindow: () => BrowserWindow | null) {
    ipcMain.handle('install:getInstalled', async () => {
        return getInstalledPackages()
    })

    ipcMain.handle('install:homebrew', async () => {
        return installHomebrew()
    })

    ipcMain.handle('install:checkHomebrew', async () => {
        return isHomebrewInstalled()
    })

    ipcMain.handle('install:start', async (_event, request: InstallRequest) => {
        if (currentInstallation.isRunning) {
            throw new Error('Installation already in progress')
        }

        const { packages, settings: userSettings, userInputValues = {} } = request
        const settings = { ...DEFAULT_SETTINGS, ...userSettings }

        if (!packages || packages.length === 0) {
            throw new Error('No packages to install')
        }

        logger.install.info('Starting installation with packages:', packages.map(p => p.name))
        logger.install.debug('Installation settings:', settings)

        // Reset installation state
        currentInstallation = {
            isRunning: true,
            isCancelled: false,
            currentProcess: null,
        }

        const win = getWindow()

        // Helper to send progress to renderer
        const sendProgressUpdate = (update: {
            status: string
            currentPackage?: string
            completedPackages: number
            failedPackages: number
            packages: PackageInstallItem[]
        }) => {
            win?.webContents.send('install:progress', update)
        }

        // Helper to send log to renderer
        const sendLogUpdate = (packageId: string, line: string, type: 'stdout' | 'stderr') => {
            win?.webContents.send('install:log', { packageId, line, type })
        }

        let completedCount = 0
        let failedCount = 0
        const updatedPackages = [...packages]

        // Process each package sequentially
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i]

            // Check if cancelled
            if (currentInstallation.isCancelled) {
                // Mark remaining packages as skipped
                for (let j = i; j < packages.length; j++) {
                    updatedPackages[j] = { ...updatedPackages[j], status: 'skipped' as const }
                }
                break
            }

            // Skip already installed packages (respects skip_already_installed setting)
            if (pkg.status === 'already_installed' && settings.skip_already_installed) {
                completedCount++
                sendProgressUpdate({
                    status: 'installing',
                    currentPackage: pkg.id,
                    completedPackages: completedCount,
                    failedPackages: failedCount,
                    packages: updatedPackages,
                })
                continue
            }

            // Update current package
            updatedPackages[i] = { ...updatedPackages[i], status: 'installing' as const }
            sendProgressUpdate({
                status: 'installing',
                currentPackage: pkg.id,
                completedPackages: completedCount,
                failedPackages: failedCount,
                packages: updatedPackages,
            })

            // Install the package using the platform installer
            const success = await installPackage(
                pkg,
                currentInstallation,
                (status, error) => {
                    updatedPackages[i] = {
                        ...updatedPackages[i],
                        status: status as PackageInstallItem['status'],
                        error,
                    }
                },
                (line, type) => sendLogUpdate(pkg.id, line, type),
                userInputValues
            )

            if (success) {
                completedCount++
            } else if (!currentInstallation.isCancelled) {
                failedCount++

                // Check if we should stop on error (respects continue_on_error setting)
                if (!settings.continue_on_error) {
                    // Mark remaining packages as skipped
                    for (let j = i + 1; j < packages.length; j++) {
                        updatedPackages[j] = { ...updatedPackages[j], status: 'skipped' as const }
                    }

                    sendProgressUpdate({
                        status: 'installing',
                        currentPackage: pkg.id,
                        completedPackages: completedCount,
                        failedPackages: failedCount,
                        packages: updatedPackages,
                    })

                    logger.install.info('Stopping installation due to error (continue_on_error=false)')
                    break
                }
            }

            // Send updated progress
            sendProgressUpdate({
                status: 'installing',
                currentPackage: pkg.id,
                completedPackages: completedCount,
                failedPackages: failedCount,
                packages: updatedPackages,
            })
        }

        // Installation complete
        currentInstallation.isRunning = false

        const finalStatus = currentInstallation.isCancelled ? 'cancelled' : 'completed'

        sendProgressUpdate({
            status: finalStatus,
            currentPackage: undefined,
            completedPackages: completedCount,
            failedPackages: failedCount,
            packages: updatedPackages,
        })

        logger.install.info(`Installation complete: ${completedCount} succeeded, ${failedCount} failed`)

        return {
            success: failedCount === 0,
            completedPackages: completedCount,
            failedPackages: failedCount,
        }
    })

    ipcMain.handle('install:cancel', async () => {
        logger.install.info('Cancelling installation...')
        cancelInstallation(currentInstallation)
        return { cancelled: true }
    })
}

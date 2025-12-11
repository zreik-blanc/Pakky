import { ipcMain, app } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { UserConfig } from '../../src/lib/types'
import { logger } from '../utils'

const USER_CONFIG_FILENAME = 'user-config.json'

async function getUserConfigPath(): Promise<string> {
    return path.join(app.getPath('userData'), USER_CONFIG_FILENAME)
}

export function registerUserConfigHandlers() {
    ipcMain.handle('userConfig:read', async () => {
        try {
            const configPath = await getUserConfigPath()
            const content = await fs.readFile(configPath, 'utf-8')
            return JSON.parse(content) as UserConfig
        } catch (error) {
            // Check for JSON parse error (corruption)
            if (error instanceof SyntaxError) {
                // Throw specific error for frontend to handle
                throw new Error('CONFIG_CORRUPTED')
            }

            // If file doesn't exist (ENOENT), return null
            return null
        }
    })

    ipcMain.handle('userConfig:reset', async () => {
        try {
            const configPath = await getUserConfigPath()
            const backupPath = `${configPath}.corrupted.${Date.now()}.json`
            await fs.rename(configPath, backupPath)
            logger.config.info(`Backed up corrupted config to: ${backupPath}`)
        } catch (backupError: unknown) {
            // If file is gone (ENOENT), it means another process handled it.
            const isENOENT = backupError instanceof Error && 'code' in backupError && (backupError as NodeJS.ErrnoException).code === 'ENOENT'
            if (!isENOENT) {
                logger.config.error('Failed to backup corrupted config:', backupError)
                throw new Error('Failed to reset configuration')
            }
        }
    })

    ipcMain.handle('userConfig:save', async (_, config: Partial<UserConfig>) => {
        try {
            const configPath = await getUserConfigPath()

            // Load existing config to merge if needed, or start fresh
            let newConfig: UserConfig
            try {
                const existingContent = await fs.readFile(configPath, 'utf-8')
                const existingConfig = JSON.parse(existingContent)
                newConfig = { ...existingConfig, ...config, lastSeenAt: new Date().toISOString() }
            } catch {
                let sysInfo = config.systemInfo
                if (!sysInfo) {
                    try {
                        const { getSystemInfo } = await import('../utils')
                        const detected = getSystemInfo()
                        sysInfo = {
                            platform: detected.platform,
                            arch: detected.arch,
                            version: detected.version,
                            homeDir: detected.homeDir,
                            hostname: detected.hostname
                        }
                    } catch (e) {
                        sysInfo = {
                            platform: 'unknown',
                            arch: 'unknown',
                            version: 'unknown',
                            homeDir: '',
                            hostname: ''
                        }
                    }
                }

                const now = new Date().toISOString()
                newConfig = {
                    userName: config.userName || 'User',
                    systemInfo: sysInfo,
                    queue: config.queue || [],
                    firstLaunchAt: config.firstLaunchAt || now,
                    lastSeenAt: now,
                }
            }

            await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8')
            return newConfig
        } catch (error) {
            logger.config.error('Failed to save user config:', error)
            throw new Error('Failed to save user configuration')
        }
    })
}

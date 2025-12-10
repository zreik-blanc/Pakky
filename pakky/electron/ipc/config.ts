import { ipcMain, dialog, app } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { isPathAllowed, scanShellCommands, extractShellCommands, type SecurityScanResult } from '../utils'
import type { PakkyConfig, SecurityLevelKey } from '../../src/lib/types'
import { PakkyConfigSchema } from './schemas'
import { ZodError } from 'zod'
import { DIALOGS } from '../constants'

// Extended return type that includes security scan results
interface ConfigLoadResult {
    config: PakkyConfig
    security: SecurityScanResult
}

/**
 * Get user's security level from their config
 */
async function getUserSecurityLevel(): Promise<SecurityLevelKey> {
    try {
        const configPath = path.join(app.getPath('userData'), 'user-config.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const userConfig = JSON.parse(content)
        return userConfig.securityLevel || 'STRICT'
    } catch {
        return 'STRICT' // Default to strictest level
    }
}

/**
 * Register config-related IPC handlers
 */
export function registerConfigHandlers() {
    ipcMain.handle('config:load', async (_, filePath: string): Promise<ConfigLoadResult> => {
        // Security: Validate path to prevent path traversal attacks
        if (!isPathAllowed(filePath)) {
            throw new Error('Access to this file path is not allowed')
        }

        try {
            const content = await fs.readFile(filePath, 'utf-8')
            const json = JSON.parse(content)
            const config = PakkyConfigSchema.parse(json)

            // Get user's security level preference
            const securityLevel = await getUserSecurityLevel()
            console.log(`[Security] Using security level: ${securityLevel}`)

            // Security: Scan for dangerous shell commands using user's security level
            const shellCommands = extractShellCommands(json)
            const security = scanShellCommands(shellCommands, securityLevel)

            console.log(`[Security] Scan result:`, {
                level: securityLevel,
                dangerous: security.dangerousCommands.length,
                suspicious: security.suspiciousCommands.length,
                blocked: security.blockedCommands.length,
                unknown: security.unknownCommands.length,
            })

            if (security.hasDangerousContent) {
                console.warn('[Security] Dangerous commands detected in config:', security.dangerousCommands)
            }
            if (security.blockedCommands.length > 0) {
                console.warn(`[Security] Commands blocked at ${securityLevel} level:`, security.blockedCommands)
            }

            return { config, security }
        } catch (error) {
            console.error('Config load error:', error)

            if (error instanceof ZodError) {
                throw new Error(`Invalid configuration: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
            }

            // Security: Don't expose detailed error information
            throw new Error('Failed to load configuration file')
        }
    })

    ipcMain.handle('config:save', async (_, filePath: string, config: PakkyConfig) => {
        // Security: Validate path to prevent path traversal attacks
        if (!isPathAllowed(filePath)) {
            throw new Error('Access to this file path is not allowed')
        }

        try {
            await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8')
        } catch (error) {
            // Security: Don't expose detailed error information
            console.error('Config save error:', error)
            throw new Error('Failed to save configuration file')
        }
    })

    ipcMain.handle('config:selectFile', async () => {
        const result = await dialog.showOpenDialog({
            title: DIALOGS.CONFIG_SELECT.TITLE,
            filters: DIALOGS.CONFIG_SELECT.FILTERS as Electron.FileFilter[],
            properties: ['openFile'],
        })

        if (result.canceled || result.filePaths.length === 0) {
            return null
        }
        return result.filePaths[0]
    })

    ipcMain.handle('config:saveDialog', async (_, config: PakkyConfig) => {
        const result = await dialog.showSaveDialog({
            title: DIALOGS.CONFIG_SAVE.TITLE,
            defaultPath: DIALOGS.CONFIG_SAVE.DEFAULT_PATH,
            filters: DIALOGS.CONFIG_SAVE.FILTERS as Electron.FileFilter[],
        })

        if (result.canceled || !result.filePath) {
            return null
        }

        await fs.writeFile(result.filePath, JSON.stringify(config, null, 2), 'utf-8')
        return result.filePath
    })
}

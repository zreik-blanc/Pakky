import { ipcMain, dialog } from 'electron'
import fs from 'node:fs/promises'
import { isPathAllowed, scanShellCommands, extractShellCommands, type SecurityScanResult } from '../utils'
import type { PakkyConfig } from '../../src/lib/types'
import { PakkyConfigSchema } from './schemas'
import { ZodError } from 'zod'

// Extended return type that includes security scan results
interface ConfigLoadResult {
    config: PakkyConfig
    security: SecurityScanResult
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
            
            // Security: Scan for dangerous shell commands
            const shellCommands = extractShellCommands(json)
            const security = scanShellCommands(shellCommands)
            
            if (security.hasDangerousContent) {
                console.warn('[Security] Dangerous commands detected in config:', security.dangerousCommands)
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
            title: 'Select Pakky Configuration',
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] },
            ],
            properties: ['openFile'],
        })

        if (result.canceled || result.filePaths.length === 0) {
            return null
        }
        return result.filePaths[0]
    })

    ipcMain.handle('config:saveDialog', async (_, config: PakkyConfig) => {
        const result = await dialog.showSaveDialog({
            title: 'Save Pakky Configuration',
            defaultPath: 'pakky-config.json',
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
            ],
        })

        if (result.canceled || !result.filePath) {
            return null
        }

        await fs.writeFile(result.filePath, JSON.stringify(config, null, 2), 'utf-8')
        return result.filePath
    })
}

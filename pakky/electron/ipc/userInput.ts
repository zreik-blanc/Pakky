import { ipcMain, app } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { logger } from '../utils'

// Store in app's userData directory instead of predictable home location
// This is more secure as it's within the app's sandbox
const getUserInputPath = () => path.join(app.getPath('userData'), 'user-input.json')

// Pattern for detecting sensitive keys that should trigger warnings
const SENSITIVE_KEY_PATTERN = /password|token|secret|key|credential|api[_-]?key|auth/i

/**
 * Warn about potentially sensitive data being stored
 */
function warnIfSensitive(values: Record<string, string>): void {
    const sensitiveKeys = Object.keys(values).filter(k => SENSITIVE_KEY_PATTERN.test(k))
    if (sensitiveKeys.length > 0) {
        logger.main.warn(`Storing potentially sensitive keys: ${sensitiveKeys.join(', ')}. Consider using environment variables for secrets.`)
    }
}

/**
 * Register user input-related IPC handlers
 */
export function registerUserInputHandlers() {
    ipcMain.handle('userInput:getValues', async () => {
        try {
            const content = await fs.readFile(getUserInputPath(), 'utf-8')
            return JSON.parse(content) as Record<string, string>
        } catch {
            return {}
        }
    })

    ipcMain.handle('userInput:saveValues', async (_, values: Record<string, string>) => {
        // Warn about sensitive keys
        warnIfSensitive(values)

        const content = JSON.stringify(values)
        const filePath = getUserInputPath()
        const tempPath = `${filePath}.tmp`

        // Atomic write: write to temp file first, then rename
        // This prevents corruption if the process is interrupted
        await fs.writeFile(tempPath, content, { encoding: 'utf-8', mode: 0o600 })
        await fs.rename(tempPath, filePath)
    })

    ipcMain.handle('userInput:getValue', async (_, key: string) => {
        try {
            const content = await fs.readFile(getUserInputPath(), 'utf-8')
            const values = JSON.parse(content) as Record<string, string>
            return values[key] || null
        } catch {
            return null
        }
    })
}

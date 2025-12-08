import { ipcMain } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const pakkyEnvPath = path.join(os.homedir(), '.pakky.env')

/**
 * Register user input-related IPC handlers
 */
export function registerUserInputHandlers() {
    ipcMain.handle('userInput:getValues', async () => {
        try {
            const content = await fs.readFile(pakkyEnvPath, 'utf-8')
            const values: Record<string, string> = {}
            content.split('\n').forEach(line => {
                const [key, ...rest] = line.split('=')
                if (key && rest.length > 0) {
                    values[key.trim()] = rest.join('=').trim()
                }
            })
            return values
        } catch {
            return {}
        }
    })

    ipcMain.handle('userInput:saveValues', async (_, values: Record<string, string>) => {
        const content = Object.entries(values)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n')
        // Security: Write file with restrictive permissions (owner read/write only)
        await fs.writeFile(pakkyEnvPath, content, { encoding: 'utf-8', mode: 0o600 })
    })

    ipcMain.handle('userInput:getValue', async (_, key: string) => {
        try {
            const content = await fs.readFile(pakkyEnvPath, 'utf-8')
            const values: Record<string, string> = {}
            content.split('\n').forEach(line => {
                const [k, ...rest] = line.split('=')
                if (k && rest.length > 0) {
                    values[k.trim()] = rest.join('=').trim()
                }
            })
            return values[key] || null
        } catch {
            return null
        }
    })
}

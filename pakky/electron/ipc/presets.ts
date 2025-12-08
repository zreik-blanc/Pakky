import { ipcMain, app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { PresetSchema } from './schemas'

export function registerPresetsHandlers() {
    ipcMain.handle('presets:list', async () => {
        try {
            // Check both APP_ROOT (set in main.ts) and cwd
            const root = process.env.APP_ROOT || process.cwd()

            const presetsDir = app.isPackaged
                ? path.join(process.resourcesPath, 'presets')
                : path.join(root, 'presets')

            // Check if directory exists
            try {
                await fs.access(presetsDir)
            } catch (e) {
                console.error('[Presets] Directory not found:', presetsDir)
                return []
            }

            const files = await fs.readdir(presetsDir)

            const jsonFiles = files.filter(f => f.endsWith('.json'))

            const presets = await Promise.all(jsonFiles.map(async file => {
                try {
                    const content = await fs.readFile(path.join(presetsDir, file), 'utf-8')
                    const data = JSON.parse(content)
                    const validated = PresetSchema.parse(data)

                    // Inject ID based on filename if not present
                    if (!validated.id) {
                        validated.id = file.replace('.json', '')
                    }
                    return validated
                } catch (e) {
                    console.error(`[Presets] Failed to load preset ${file}:`, e)
                    return null
                }
            }))

            return presets.filter(p => p !== null)
        } catch (error) {
            console.error('[Presets] Error listing presets:', error)
            throw error
        }
    })
}

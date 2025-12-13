import { ipcMain } from 'electron'
import { getPlatformName, getSystemInfo } from '../utils'

/**
 * Register system-related IPC handlers
 */
export function registerSystemHandlers() {
    ipcMain.handle('system:getPlatform', () => {
        return getPlatformName()
    })

    ipcMain.handle('system:getInfo', async () => {
        return await getSystemInfo()
    })
}

import { ipcMain } from 'electron'
import { getPlatformName, getSystemInfo } from '../utils'
import { isHomebrewInstalled } from '../installers'

/**
 * Register system-related IPC handlers
 */
export function registerSystemHandlers() {
    ipcMain.handle('system:getPlatform', () => {
        return getPlatformName()
    })

    ipcMain.handle('system:getInfo', () => {
        return getSystemInfo()
    })

    ipcMain.handle('system:checkHomebrew', async () => {
        return isHomebrewInstalled()
    })
}

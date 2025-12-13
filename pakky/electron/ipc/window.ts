import { ipcMain, type BrowserWindow } from 'electron'
import { logger } from '../utils'

// Use the centralized window config with lowercase property names for compatibility
/**
 * Register window-related IPC handlers
 * @param getWindow - Function to get the main BrowserWindow instance
 */
export function registerWindowHandlers(getWindow: () => BrowserWindow | null) {
    logger.window.debug('Registering window handlers...')

    // Get current window size info
    ipcMain.handle('window:getSize', async () => {
        const win = getWindow()
        if (!win) return null

        const [width, height] = win.getSize()
        return { width, height }
    })
}

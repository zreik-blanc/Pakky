import { ipcMain, type BrowserWindow } from 'electron'
import { WINDOW } from '../../src/lib/constants'
import { logger } from '../utils'

// Use the centralized window config with lowercase property names for compatibility
const WINDOW_CONFIG = {
    normal: {
        width: WINDOW.NORMAL.WIDTH,
        height: WINDOW.NORMAL.HEIGHT,
        minWidth: WINDOW.NORMAL.MIN_WIDTH,
        minHeight: WINDOW.NORMAL.MIN_HEIGHT,
    },
    onboarding: {
        width: WINDOW.ONBOARDING.WIDTH,
        height: WINDOW.ONBOARDING.HEIGHT,
        minWidth: WINDOW.ONBOARDING.MIN_WIDTH,
        minHeight: WINDOW.ONBOARDING.MIN_HEIGHT,
    },
} as const

/**
 * Register window-related IPC handlers
 * @param getWindow - Function to get the main BrowserWindow instance
 */
export function registerWindowHandlers(getWindow: () => BrowserWindow | null) {
    logger.window.debug('Registering window handlers...')

    // Resize window to normal app size (after onboarding)
    ipcMain.handle('window:setNormalSize', async () => {
        const win = getWindow()
        logger.window.debug('setNormalSize called, window exists:', !!win)
        if (!win) {
            logger.window.error('Window is null!')
            return false
        }

        const { width, height, minWidth, minHeight } = WINDOW_CONFIG.normal
        logger.window.debug('Resizing to:', { width, height, minWidth, minHeight })

        // Update minimum size first
        win.setMinimumSize(minWidth, minHeight)

        // Get current bounds
        const currentBounds = win.getBounds()
        logger.window.debug('Current bounds:', currentBounds)

        // Calculate new position to center the expanded window
        const newX = Math.max(0, currentBounds.x - Math.floor((width - currentBounds.width) / 2))
        const newY = Math.max(0, currentBounds.y - Math.floor((height - currentBounds.height) / 2))

        // Animate the resize with a smooth transition
        win.setBounds({
            x: newX,
            y: newY,
            width,
            height,
        }, true) // true = animate the transition

        // Wait for animation to complete (approx 250ms on macOS)
        await new Promise(resolve => setTimeout(resolve, 300))

        logger.window.debug('Resize complete')
        return true
    })

    // Resize window to onboarding size
    ipcMain.handle('window:setOnboardingSize', async () => {
        const win = getWindow()
        if (!win) return

        const { width, height, minWidth, minHeight } = WINDOW_CONFIG.onboarding

        // Update minimum size
        win.setMinimumSize(minWidth, minHeight)

        // Center the window on screen
        win.setSize(width, height, true)
        win.center()
    })

    // Get current window size info
    ipcMain.handle('window:getSize', async () => {
        const win = getWindow()
        if (!win) return null

        const [width, height] = win.getSize()
        return { width, height }
    })
}

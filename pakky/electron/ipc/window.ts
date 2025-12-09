import { ipcMain, type BrowserWindow } from 'electron'

// Window configuration constants
export const WINDOW_CONFIG = {
    // Normal app size
    normal: {
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
    },
    // Onboarding size (smaller, focused)
    onboarding: {
        width: 600,
        height: 600,
        minWidth: 600,
        minHeight: 600,
    },
} as const

/**
 * Register window-related IPC handlers
 * @param getWindow - Function to get the main BrowserWindow instance
 */
export function registerWindowHandlers(getWindow: () => BrowserWindow | null) {
    console.log('[Window IPC] Registering window handlers...')

    // Resize window to normal app size (after onboarding)
    ipcMain.handle('window:setNormalSize', async () => {
        const win = getWindow()
        console.log('[Window IPC] setNormalSize called, window exists:', !!win)
        if (!win) {
            console.error('[Window IPC] Window is null!')
            return false
        }

        const { width, height, minWidth, minHeight } = WINDOW_CONFIG.normal
        console.log('[Window IPC] Resizing to:', { width, height, minWidth, minHeight })

        // Update minimum size first
        win.setMinimumSize(minWidth, minHeight)

        // Get current bounds
        const currentBounds = win.getBounds()
        console.log('[Window IPC] Current bounds:', currentBounds)

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

        console.log('[Window IPC] Resize complete')
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

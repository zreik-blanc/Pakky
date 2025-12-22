import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerAllHandlers } from './ipc'
import { ELECTRON_CONFIG } from './constants'
import { WINDOW } from '../src/lib/constants'
import { logger } from './utils'
import { ipcRateLimiter, strictRateLimiter } from './utils/rate-limiter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null



function createWindow() {
  const windowConfig = WINDOW.NORMAL

  logger.main.info(`Creating window - Size: ${windowConfig.WIDTH}x${windowConfig.HEIGHT}`)

  win = new BrowserWindow({
    width: windowConfig.WIDTH,
    height: windowConfig.HEIGHT,
    minWidth: windowConfig.MIN_WIDTH,
    minHeight: windowConfig.MIN_HEIGHT,
    center: true,
    icon: path.join(process.env.VITE_PUBLIC, ELECTRON_CONFIG.PATHS.ICON),
    titleBarStyle: ELECTRON_CONFIG.WINDOW.TITLE_BAR_STYLE, // macOS native title bar
    show: false, // Don't show until ready to prevent white flash
    backgroundColor: WINDOW.BACKGROUND_COLOR, // Match the app's dark theme background
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true, // Enable sandbox for additional process isolation
    },
  })

  // Show window when ready to prevent flickering
  win.once('ready-to-show', () => {
    win?.show()
  })

  // Security: Add Content Security Policy headers
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          // Allow scripts and styles from self, allow unsafe-inline for Vite HMR in dev
          VITE_DEV_SERVER_URL
            ? ELECTRON_CONFIG.CSP.DEV
            : ELECTRON_CONFIG.CSP.PROD
        ]
      }
    })
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ============================================
// Register IPC Handlers
// ============================================
registerAllHandlers(() => win)

// ============================================
// App Lifecycle
// ============================================

// Cleanup rate limiters on app quit to prevent memory leaks
app.on('will-quit', () => {
  logger.main.info('Cleaning up rate limiters')
  ipcRateLimiter.destroy()
  strictRateLimiter.destroy()
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

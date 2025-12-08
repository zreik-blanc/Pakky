import type { BrowserWindow } from 'electron'
import { registerSystemHandlers } from './system'
import { registerConfigHandlers } from './config'
import { registerInstallHandlers } from './install'
import { registerSearchHandlers } from './search'
import { registerUserInputHandlers } from './userInput'
import { registerShellHandlers } from './shell'
import { registerPresetsHandlers } from './presets'

/**
 * Register all IPC handlers
 * @param getWindow - Function to get the main BrowserWindow instance
 */
export function registerAllHandlers(getWindow: () => BrowserWindow | null) {
    registerSystemHandlers()
    registerConfigHandlers()
    registerInstallHandlers(getWindow)
    registerSearchHandlers()
    registerUserInputHandlers()
    registerShellHandlers()
    registerPresetsHandlers()
}

// Re-export individual registrations for selective use
export { registerSystemHandlers } from './system'
export { registerConfigHandlers } from './config'
export { registerInstallHandlers } from './install'
export { registerSearchHandlers } from './search'
export { registerUserInputHandlers } from './userInput'
export { registerShellHandlers } from './shell'
export { registerPresetsHandlers } from './presets'

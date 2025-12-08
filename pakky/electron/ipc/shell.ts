import { ipcMain, shell } from 'electron'
import { isSafeUrl } from '../utils'

/**
 * Register shell-related IPC handlers
 */
export function registerShellHandlers() {
    // SECURITY: shell:run handler has been REMOVED to prevent arbitrary command execution
    // If shell command execution is needed, implement specific, validated handlers instead

    ipcMain.handle('shell:openExternal', async (_, url: string) => {
        // Security: Validate URL to prevent malicious protocol handlers
        if (!isSafeUrl(url)) {
            throw new Error('Only HTTP and HTTPS URLs are allowed')
        }
        await shell.openExternal(url)
    })
}

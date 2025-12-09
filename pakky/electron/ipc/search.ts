import { ipcMain } from 'electron'
import { execFileAsync, isValidPackageName, getHomebrewPath } from '../utils'

// Search result item interface
interface SearchResultItem {
    name: string
    type: 'formula' | 'cask'
    description?: string
    version?: string
    installed?: boolean
}

/**
 * Register search-related IPC handlers
 */
export function registerSearchHandlers() {
    ipcMain.handle('search:brew', async (_, query: string): Promise<SearchResultItem[]> => {
        // Security: Validate query to prevent injection
        if (!query || query.length < 2 || query.length > 100) {
            return []
        }

        // Security: Additional validation - only allow safe characters in search
        if (!/^[a-zA-Z0-9-_@/.+ ]+$/.test(query)) {
            return []
        }

        // Get the Homebrew path - needed for packaged apps where PATH doesn't include brew
        const brewPath = getHomebrewPath()
        if (!brewPath) {
            console.error('Homebrew not found')
            return []
        }

        try {
            // Search both formulae and casks
            const results: SearchResultItem[] = []

            // Get installed packages for comparison
            let installedFormulae: string[] = []
            let installedCasks: string[] = []

            try {
                const { stdout: formulaeList } = await execFileAsync(brewPath, ['list', '--formula'])
                installedFormulae = formulaeList.trim().split('\n').filter(Boolean)
            } catch { /* ignore */ }

            try {
                const { stdout: casksList } = await execFileAsync(brewPath, ['list', '--cask'])
                installedCasks = casksList.trim().split('\n').filter(Boolean)
            } catch { /* ignore */ }

            // Security: Use execFileAsync with arguments array (prevents command injection)
            // Search formulae
            try {
                const { stdout: formulaeOutput } = await execFileAsync(brewPath, ['search', '--formula', query])
                const formulae = formulaeOutput.trim().split('\n').filter(Boolean).slice(0, 10)

                for (const name of formulae) {
                    if (name && !name.startsWith('==>')) {
                        results.push({
                            name: name.trim(),
                            type: 'formula',
                            installed: installedFormulae.includes(name.trim()),
                        })
                    }
                }
            } catch { /* no results */ }

            // Search casks
            try {
                const { stdout: casksOutput } = await execFileAsync(brewPath, ['search', '--cask', query])
                const casks = casksOutput.trim().split('\n').filter(Boolean).slice(0, 10)

                for (const name of casks) {
                    if (name && !name.startsWith('==>')) {
                        results.push({
                            name: name.trim(),
                            type: 'cask',
                            installed: installedCasks.includes(name.trim()),
                        })
                    }
                }
            } catch { /* no results */ }

            return results.slice(0, 15) // Limit total results
        } catch (error) {
            console.error('Search error:', error)
            return []
        }
    })

    ipcMain.handle('search:info', async (_, name: string, type: 'formula' | 'cask'): Promise<{ description?: string; version?: string } | null> => {
        // Security: Validate package name to prevent injection
        if (!isValidPackageName(name)) {
            return null
        }

        // Get the Homebrew path - needed for packaged apps
        const brewPath = getHomebrewPath()
        if (!brewPath) {
            return null
        }

        try {
            const flag = type === 'cask' ? '--cask' : '--formula'
            // Security: Use execFileAsync with arguments array (prevents command injection)
            const { stdout } = await execFileAsync(brewPath, ['info', flag, '--json=v2', name])
            const data = JSON.parse(stdout)

            if (type === 'cask' && data.casks && data.casks.length > 0) {
                const cask = data.casks[0]
                return {
                    description: cask.desc || undefined,
                    version: cask.version || undefined,
                }
            } else if (type === 'formula' && data.formulae && data.formulae.length > 0) {
                const formula = data.formulae[0]
                return {
                    description: formula.desc || undefined,
                    version: formula.versions?.stable || undefined,
                }
            }

            return null
        } catch {
            return null
        }
    })
}

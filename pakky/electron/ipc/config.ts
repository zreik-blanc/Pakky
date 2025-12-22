import { ipcMain, dialog, app } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { isPathAllowed, scanShellCommands, extractShellCommands, strictRateLimiter, logger, type SecurityScanResult } from '../utils'
import type { PakkyConfig, SecurityLevelKey } from '../../src/lib/types'
import { PakkyConfigSchema } from './schemas'
import { ZodError } from 'zod'
import { DIALOGS } from '../constants'

// Security limits for JSON parsing
const JSON_LIMITS = {
    MAX_SIZE: 10 * 1024 * 1024,      // 10MB max file size
    MAX_NESTING_DEPTH: 50,            // Maximum nesting depth
} as const

// Extended return type that includes security scan results
interface ConfigLoadResult {
    config: PakkyConfig
    security: SecurityScanResult
}

/**
 * Check JSON nesting depth to prevent stack overflow
 */
function checkNestingDepth(obj: unknown, depth: number = 0): void {
    if (depth > JSON_LIMITS.MAX_NESTING_DEPTH) {
        throw new Error(`JSON nesting exceeds maximum depth of ${JSON_LIMITS.MAX_NESTING_DEPTH}`)
    }
    if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
            checkNestingDepth(value, depth + 1)
        }
    }
}

/**
 * Safely parse JSON with size and depth limits
 */
function safeJsonParse(content: string): unknown {
    if (content.length > JSON_LIMITS.MAX_SIZE) {
        throw new Error(`JSON content exceeds maximum size of ${JSON_LIMITS.MAX_SIZE} bytes`)
    }

    const parsed = JSON.parse(content)
    checkNestingDepth(parsed)
    return parsed
}

/**
 * Get user's security level from their config
 */
async function getUserSecurityLevel(): Promise<SecurityLevelKey> {
    try {
        const configPath = path.join(app.getPath('userData'), 'user-config.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const userConfig = JSON.parse(content)
        return userConfig.securityLevel || 'STRICT'
    } catch {
        return 'STRICT' // Default to strictest level
    }
}

/**
 * Register config-related IPC handlers
 */
export function registerConfigHandlers() {
    ipcMain.handle('config:load', async (event, filePath: string): Promise<ConfigLoadResult> => {
        // Rate limiting to prevent DoS
        const rateLimitKey = `config:load:${event.sender.id}`
        if (!strictRateLimiter.allow(rateLimitKey)) {
            throw new Error('Rate limit exceeded. Please slow down.')
        }

        // Security: Validate path to prevent path traversal attacks
        if (!isPathAllowed(filePath)) {
            throw new Error('Access to this file path is not allowed')
        }

        try {
            const content = await fs.readFile(filePath, 'utf-8')
            const json = safeJsonParse(content) as Record<string, unknown>
            const config = PakkyConfigSchema.parse(json)

            // Get user's security level preference
            const securityLevel = await getUserSecurityLevel()
            logger.config.debug(`Using security level: ${securityLevel}`)

            // Security: Scan for dangerous shell commands using user's security level
            const shellCommands = extractShellCommands(json)
            const security = scanShellCommands(shellCommands, securityLevel)

            logger.config.debug('Security scan result', {
                level: securityLevel,
                dangerous: security.dangerousCommands.length,
                suspicious: security.suspiciousCommands.length,
                blocked: security.blockedCommands.length,
                unknown: security.unknownCommands.length,
            })

            if (security.hasDangerousContent) {
                logger.config.warn('Dangerous commands detected in config', { commands: security.dangerousCommands })
            }
            if (security.blockedCommands.length > 0) {
                logger.config.warn(`Commands blocked at ${securityLevel} level`, { commands: security.blockedCommands })
            }

            return { config, security }
        } catch (error) {
            // Structured error logging with details for debugging
            logger.config.error('Configuration load failed', {
                filePath,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                type: error instanceof ZodError ? 'validation' : 'unknown'
            })

            if (error instanceof ZodError) {
                throw new Error(`Invalid configuration: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
            }

            // Security: Don't expose detailed error information to renderer
            throw new Error('Failed to load configuration file')
        }
    })

    ipcMain.handle('config:save', async (_, filePath: string, config: PakkyConfig) => {
        // Security: Validate path to prevent path traversal attacks
        if (!isPathAllowed(filePath)) {
            throw new Error('Access to this file path is not allowed')
        }

        try {
            await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8')
        } catch (error) {
            logger.config.error('Config save failed', {
                filePath,
                error: error instanceof Error ? error.message : String(error)
            })
            throw new Error('Failed to save configuration file')
        }
    })

    // New handler: Parse config content directly (for paste import)
    ipcMain.handle('config:parseContent', async (event, content: string): Promise<ConfigLoadResult> => {
        // Rate limiting to prevent DoS
        const rateLimitKey = `config:parseContent:${event.sender.id}`
        if (!strictRateLimiter.allow(rateLimitKey)) {
            throw new Error('Rate limit exceeded. Please slow down.')
        }

        try {
            const json = safeJsonParse(content) as Record<string, unknown>
            const config = PakkyConfigSchema.parse(json)

            // Get user's security level preference
            const securityLevel = await getUserSecurityLevel()
            logger.config.debug(`Parsing pasted content with security level: ${securityLevel}`)

            // Security: Scan for dangerous shell commands using user's security level
            const shellCommands = extractShellCommands(json)
            const security = scanShellCommands(shellCommands, securityLevel)

            logger.config.debug('Pasted content scan result', {
                level: securityLevel,
                dangerous: security.dangerousCommands.length,
                suspicious: security.suspiciousCommands.length,
                blocked: security.blockedCommands.length,
                unknown: security.unknownCommands.length,
            })

            if (security.hasDangerousContent) {
                logger.config.warn('Dangerous commands detected in pasted config', { commands: security.dangerousCommands })
            }
            if (security.blockedCommands.length > 0) {
                logger.config.warn(`Commands blocked at ${securityLevel} level`, { commands: security.blockedCommands })
            }

            return { config, security }
        } catch (error) {
            // Structured error logging with details for debugging
            logger.config.error('Configuration parse failed', {
                contentLength: content.length,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                type: error instanceof SyntaxError ? 'syntax' : error instanceof ZodError ? 'validation' : 'unknown'
            })

            if (error instanceof SyntaxError) {
                throw new Error('Invalid JSON format. Please check your configuration syntax.')
            }

            if (error instanceof ZodError) {
                throw new Error(`Invalid configuration: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
            }

            throw new Error('Failed to parse configuration content')
        }
    })

    ipcMain.handle('config:selectFile', async () => {
        const result = await dialog.showOpenDialog({
            title: DIALOGS.CONFIG_SELECT.TITLE,
            filters: DIALOGS.CONFIG_SELECT.FILTERS as Electron.FileFilter[],
            properties: ['openFile'],
        })

        if (result.canceled || result.filePaths.length === 0) {
            return null
        }
        return result.filePaths[0]
    })

    ipcMain.handle('config:saveDialog', async (_, config: PakkyConfig) => {
        const result = await dialog.showSaveDialog({
            title: DIALOGS.CONFIG_SAVE.TITLE,
            defaultPath: DIALOGS.CONFIG_SAVE.DEFAULT_PATH,
            filters: DIALOGS.CONFIG_SAVE.FILTERS as Electron.FileFilter[],
        })

        if (result.canceled || !result.filePath) {
            return null
        }

        await fs.writeFile(result.filePath, JSON.stringify(config, null, 2), 'utf-8')
        return result.filePath
    })
}

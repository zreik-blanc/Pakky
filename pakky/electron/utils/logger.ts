/**
 * Logger Utility
 * Structured logging with log levels for the Electron main process
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// In production, only show info and above. In dev, show all.
const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
}

const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
}

function formatMessage(level: LogLevel, context: string, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`
}

/**
 * Logger with context prefix for better traceability
 */
export function createLogger(context: string) {
    return {
        debug: (message: string, ...args: unknown[]) => {
            if (shouldLog('debug')) {
                console.log(formatMessage('debug', context, message), ...args)
            }
        },
        info: (message: string, ...args: unknown[]) => {
            if (shouldLog('info')) {
                console.log(formatMessage('info', context, message), ...args)
            }
        },
        warn: (message: string, ...args: unknown[]) => {
            if (shouldLog('warn')) {
                console.warn(formatMessage('warn', context, message), ...args)
            }
        },
        error: (message: string, ...args: unknown[]) => {
            if (shouldLog('error')) {
                console.error(formatMessage('error', context, message), ...args)
            }
        },
    }
}

// Pre-configured loggers for common contexts
export const logger = {
    main: createLogger('Main'),
    ipc: createLogger('IPC'),
    install: createLogger('Install'),
    window: createLogger('Window'),
    config: createLogger('Config'),
}

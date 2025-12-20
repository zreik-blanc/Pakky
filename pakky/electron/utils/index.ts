// Security utilities
export {
    PACKAGE_NAME_REGEX,
    ALLOWED_CONFIG_DIRS,
    SECURITY_LIMITS,
    isPathAllowed,
    isValidPackageName,
    isSafeUrl,
    scanShellCommands,
    extractShellCommands,
} from './security'
export type { SecurityScanResult } from './security'

// Rate limiter utilities
export { RateLimiter, ipcRateLimiter, strictRateLimiter } from './rate-limiter'

// Command allowlist utilities
export {
    COMMAND_CATEGORIES,
    getCommandCategory,
    isCommandAllowed,
} from './command-allowlist'

// AST parser utilities
export {
    parseShellCommand,
    extractCommandNames,
    hasSubshellOrSubstitution,
    hasPiping,
} from './bash-parser'
export type { ParsedCommand, CommandParseResult } from './bash-parser'


// Shell utilities
export {
    execAsync,
    execFileAsync,
    getHomebrewPath,
    getEnhancedPath,
    getEnhancedEnv,
} from './shell'

// Platform utilities
export { getPlatformName, getSystemInfo } from './platform'
export type { PlatformName } from './platform'

// Logger utilities
export { createLogger, logger } from './logger'

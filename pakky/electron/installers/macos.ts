import { spawn } from 'node:child_process'
import { execFileAsync, isValidPackageName, getHomebrewPath, getEnhancedEnv, logger, scanShellCommands } from '../utils'
import { DEFAULT_SECURITY_LEVEL, type SecurityLevelKey } from '../constants/security-levels'
import type { PackageInstallItem } from '../../src/lib/types'

/**
 * Shell escape a string for safe interpolation into shell commands
 * Wraps in single quotes and escapes any single quotes within
 */
function escapeShellArg(arg: string): string {
    // Escape single quotes and wrap in single quotes
    return `'${arg.replace(/'/g, "'\\''")}'`
}

// Constants for placeholder validation
const PLACEHOLDER_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/
const MAX_VALUE_LENGTH = 1000

/**
 * Installation state tracker
 */
export interface InstallationState {
    isRunning: boolean
    isCancelled: boolean
    currentProcess: ReturnType<typeof spawn> | null
}

/**
 * Progress callback type
 */
export type ProgressCallback = (status: string, error?: string) => void

/**
 * Log callback type
 */
export type LogCallback = (line: string, type: 'stdout' | 'stderr') => void

/**
 * Get list of installed Homebrew packages
 */
export async function getInstalledPackages(): Promise<{ formulae: string[]; casks: string[] }> {
    const result = { formulae: [] as string[], casks: [] as string[] }
    const brewPath = getHomebrewPath()

    if (!brewPath) {
        return result  // Homebrew not installed
    }

    try {
        const { stdout: formulaeOutput } = await execFileAsync(brewPath, ['list', '--formula'])
        result.formulae = formulaeOutput.trim().split('\n').filter(Boolean)
    } catch {
        // No formulae installed
    }

    try {
        const { stdout: casksOutput } = await execFileAsync(brewPath, ['list', '--cask'])
        result.casks = casksOutput.trim().split('\n').filter(Boolean)
    } catch {
        // No casks installed
    }

    return result
}

/**
 * Check if Homebrew is installed
 */
export async function isHomebrewInstalled(): Promise<boolean> {
    return getHomebrewPath() !== null
}

/**
 * Install Homebrew using the official install script
 */
export async function installHomebrew(): Promise<void> {
    logger.install.info('Installing Homebrew...')

    // Homebrew installation requires user interaction (password, sudo, etc.)
    // We need to open Terminal.app and run the install script there
    // This allows the user to see prompts and enter their password

    const installScript = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'

    // AppleScript to open Terminal and run the install command
    const appleScript = `
        tell application "Terminal"
            activate
            do script "${installScript}"
        end tell
    `

    return new Promise((resolve, reject) => {
        const osascriptProcess = spawn('osascript', ['-e', appleScript])

        osascriptProcess.on('close', (code) => {
            if (code === 0) {
                logger.install.info('Homebrew installation started in Terminal.app')
                // Note: This resolves when Terminal opens, not when installation completes
                // The user needs to complete the installation in Terminal
                resolve()
            } else {
                reject(new Error(`Failed to open Terminal for Homebrew installation (code: ${code})`))
            }
        })

        osascriptProcess.on('error', (err) => {
            reject(new Error(`Failed to start Homebrew installation: ${err.message}`))
        })
    })
}

/**
 * Install a single package via Homebrew
 */
export async function installPackage(
    pkg: PackageInstallItem,
    state: InstallationState,
    sendProgress: ProgressCallback,
    sendLog: LogCallback,
    userInputValues: Record<string, string> = {}
): Promise<boolean> {
    // Handle script type separately
    if (pkg.type === 'script') {
        return executeScript(pkg, state, sendProgress, sendLog, userInputValues)
    }

    return new Promise((resolve) => {
        // Security: Validate package name before installation
        if (!isValidPackageName(pkg.name)) {
            sendLog(`✗ Invalid package name: ${pkg.name}`, 'stderr')
            sendProgress('failed', 'Invalid package name')
            resolve(false)
            return
        }

        // Get the Homebrew path - needed for packaged apps
        const brewPath = getHomebrewPath()
        if (!brewPath) {
            sendLog(`✗ Homebrew not found. Please install Homebrew first.`, 'stderr')
            sendProgress('failed', 'Homebrew not installed')
            resolve(false)
            return
        }

        // Determine the brew command based on package type and action
        const isCask = pkg.type === 'cask'
        const command = pkg.action === 'reinstall' ? 'reinstall' : 'install'
        const args = isCask
            ? [command, '--cask', pkg.name]
            : [command, pkg.name]

        sendLog(`$ brew ${args.join(' ')}`, 'stdout')
        sendProgress('installing')

        // Security: Don't use shell:true since we've validated the package name
        // Use full brew path and enhanced env for packaged app compatibility
        const brewProcess = spawn(brewPath, args, {
            env: { ...getEnhancedEnv(), HOMEBREW_NO_AUTO_UPDATE: '1' },
        })

        // Track the current process for cancellation
        state.currentProcess = brewProcess

        brewProcess.stdout.on('data', (data: Buffer) => {
            const lines = data.toString().split('\n').filter(Boolean)
            lines.forEach(line => sendLog(line, 'stdout'))
        })

        brewProcess.stderr.on('data', (data: Buffer) => {
            const lines = data.toString().split('\n').filter(Boolean)
            lines.forEach(line => sendLog(line, 'stderr'))
        })

        brewProcess.on('close', (code) => {
            state.currentProcess = null

            if (state.isCancelled) {
                sendProgress('skipped', 'Installation cancelled')
                resolve(false)
            } else if (code === 0) {
                sendLog(`✓ Successfully installed ${pkg.name}`, 'stdout')
                sendProgress('success')
                resolve(true)
            } else {
                sendLog(`✗ Failed to install ${pkg.name} (exit code: ${code})`, 'stderr')
                sendProgress('failed', `Installation failed with exit code ${code}`)
                resolve(false)
            }
        })

        brewProcess.on('error', (error) => {
            state.currentProcess = null
            sendLog(`✗ Error installing ${pkg.name}: ${error.message}`, 'stderr')
            sendProgress('failed', error.message)
            resolve(false)
        })
    })
}

/**
 * Replace {{placeholder}} variables in a command with safely escaped user input values
 * Validates placeholder names and value lengths to prevent injection attacks
 */
function replaceCommandPlaceholders(
    command: string,
    userInputValues: Record<string, string>
): string {
    return command.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, (match, key) => {
        const trimmedKey = key.trim()

        // Validate placeholder name format
        if (!PLACEHOLDER_NAME_REGEX.test(trimmedKey)) {
            throw new Error(`Invalid placeholder name: ${trimmedKey}`)
        }

        const value = userInputValues[trimmedKey]
        if (value === undefined) return match

        // Enforce length limit to prevent buffer overflow attacks
        if (value.length > MAX_VALUE_LENGTH) {
            throw new Error(`Value for {{${trimmedKey}}} exceeds maximum length of ${MAX_VALUE_LENGTH}`)
        }

        // Check for control characters that could cause issues
        // eslint-disable-next-line no-control-regex
        if (/[\x00-\x1f\x7f]/.test(value)) {
            throw new Error(`Value for {{${trimmedKey}}} contains invalid control characters`)
        }

        // Shell-escape the value to prevent command injection
        return escapeShellArg(value)
    })
}

/**
 * Execute a script with security validation
 */
async function executeScript(
    pkg: PackageInstallItem,
    state: InstallationState,
    sendProgress: ProgressCallback,
    sendLog: LogCallback,
    userInputValues: Record<string, string> = {},
    securityLevel: SecurityLevelKey = DEFAULT_SECURITY_LEVEL
): Promise<boolean> {
    const commands = pkg.commands || []

    if (commands.length === 0) {
        sendLog(`✗ No commands defined for script: ${pkg.name}`, 'stderr')
        sendProgress('failed', 'No commands defined')
        return false
    }

    // CRITICAL: Validate commands before execution using security scanner
    const securityScan = scanShellCommands(commands, securityLevel)

    if (securityScan.hasDangerousContent) {
        const warnings = securityScan.dangerousCommands.slice(0, 3).map(c => c.slice(0, 50))
        sendLog(`✗ Security scan failed: dangerous content detected`, 'stderr')
        sendLog(`  Blocked commands: ${warnings.join(', ')}...`, 'stderr')
        sendProgress('failed', 'Script blocked by security scan')
        logger.install.warn(`Script "${pkg.name}" blocked - dangerous content detected`, {
            commands: securityScan.dangerousCommands
        })
        return false
    }

    if (securityScan.severity === 'critical' || securityScan.severity === 'high') {
        sendLog(`✗ Script contains ${securityScan.severity} severity commands`, 'stderr')
        if (securityScan.hasObfuscation) {
            sendLog(`  Obfuscation detected - this may indicate malicious intent`, 'stderr')
        }
        sendProgress('failed', `Blocked: ${securityScan.severity} risk level`)
        logger.install.warn(`Script "${pkg.name}" blocked - ${securityScan.severity} severity`, {
            obfuscated: securityScan.obfuscatedCommands,
            warnings: securityScan.warnings
        })
        return false
    }

    // Log any warnings but continue for medium/low severity
    if (securityScan.warnings.length > 0 && securityScan.severity !== 'none') {
        sendLog(`⚠ Security warnings for script: ${pkg.name}`, 'stderr')
        securityScan.warnings.slice(0, 3).forEach(w => sendLog(`  ${w}`, 'stderr'))
    }

    sendLog(`▶ Running script: ${pkg.name}`, 'stdout')
    sendProgress('installing')

    for (const rawCommand of commands) {
        if (state.isCancelled) {
            sendProgress('skipped', 'Script execution cancelled')
            return false
        }

        // Replace placeholders with user input values
        const command = replaceCommandPlaceholders(rawCommand, userInputValues)

        sendLog(`$ ${command}`, 'stdout')

        const success = await new Promise<boolean>((resolve) => {
            // Use shell to execute the command
            const shellProcess = spawn('sh', ['-c', command], {
                env: getEnhancedEnv(),
            })

            state.currentProcess = shellProcess

            shellProcess.stdout.on('data', (data: Buffer) => {
                const lines = data.toString().split('\n').filter(Boolean)
                lines.forEach(line => sendLog(line, 'stdout'))
            })

            shellProcess.stderr.on('data', (data: Buffer) => {
                const lines = data.toString().split('\n').filter(Boolean)
                lines.forEach(line => sendLog(line, 'stderr'))
            })

            shellProcess.on('close', (code) => {
                state.currentProcess = null
                if (code === 0) {
                    resolve(true)
                } else {
                    sendLog(`✗ Command failed with exit code: ${code}`, 'stderr')
                    resolve(false)
                }
            })

            shellProcess.on('error', (error) => {
                state.currentProcess = null
                sendLog(`✗ Error executing command: ${error.message}`, 'stderr')
                resolve(false)
            })
        })

        if (!success) {
            sendProgress('failed', 'Script execution failed')
            return false
        }
    }

    sendLog(`✓ Successfully completed script: ${pkg.name}`, 'stdout')
    sendProgress('success')
    return true
}

/**
 * Cancel a running installation
 */
export function cancelInstallation(state: InstallationState): void {
    state.isCancelled = true

    if (state.currentProcess) {
        const processToKill = state.currentProcess
        processToKill.kill('SIGTERM')

        // Security: Add SIGKILL fallback if process doesn't terminate
        setTimeout(() => {
            if (processToKill && !processToKill.killed) {
                logger.install.warn('Process did not terminate with SIGTERM, sending SIGKILL')
                processToKill.kill('SIGKILL')
            }
        }, 5000)
    }
}

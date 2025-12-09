import { spawn } from 'node:child_process'
import { execFileAsync, isValidPackageName, getHomebrewPath, getEnhancedEnv } from '../utils'
import type { PackageInstallItem } from '../../src/lib/types'

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
    console.log('Installing Homebrew...')

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
                console.log('Homebrew installation started in Terminal.app')
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
    sendLog: LogCallback
): Promise<boolean> {
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
                console.log('Process did not terminate with SIGTERM, sending SIGKILL')
                processToKill.kill('SIGKILL')
            }
        }, 5000)
    }
}

import { spawn } from 'node:child_process'
import { execFileAsync, isValidPackageName } from '../utils'
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

    try {
        const { stdout: formulaeOutput } = await execFileAsync('brew', ['list', '--formula'])
        result.formulae = formulaeOutput.trim().split('\n').filter(Boolean)
    } catch {
        // Homebrew not installed or no formulae
    }

    try {
        const { stdout: casksOutput } = await execFileAsync('brew', ['list', '--cask'])
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
    try {
        await execFileAsync('which', ['brew'])
        return true
    } catch {
        return false
    }
}

/**
 * Install Homebrew using the official install script
 */
export async function installHomebrew(): Promise<void> {
    console.log('Installing Homebrew...')

    return new Promise((resolve, reject) => {
        // /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        // We set NONINTERACTIVE=1 to avoid the "Press ENTER" prompt.
        const installProcess = spawn('/bin/bash', ['-c', 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'], {
            stdio: 'pipe' // We might want to stream this later, but for now just run it
        })

        installProcess.stdout.on('data', (data) => {
            console.log(`Brew Install (stdout): ${data}`)
        })

        installProcess.stderr.on('data', (data) => {
            console.error(`Brew Install (stderr): ${data}`)
        })

        installProcess.on('close', (code) => {
            if (code === 0) {
                console.log('Homebrew installed successfully')
                resolve()
            } else {
                reject(new Error(`Homebrew installation failed with code ${code}`))
            }
        })

        installProcess.on('error', (err) => {
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

        // Determine the brew command based on package type and action
        const isCask = pkg.type === 'cask'
        const command = pkg.action === 'reinstall' ? 'reinstall' : 'install'
        const args = isCask
            ? [command, '--cask', pkg.name]
            : [command, pkg.name]

        sendLog(`$ brew ${args.join(' ')}`, 'stdout')
        sendProgress('installing')

        // Security: Don't use shell:true since we've validated the package name
        const brewProcess = spawn('brew', args, {
            env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: '1' },
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

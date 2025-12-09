import path from 'node:path'
import os from 'node:os'

// Valid package name pattern (prevents command injection)
export const PACKAGE_NAME_REGEX = /^[a-z0-9][a-z0-9-_@/.]*$/i

// Allowed directories for config files (prevents path traversal)
export const ALLOWED_CONFIG_DIRS = [
    os.homedir(),
    path.join(os.homedir(), '.config'),
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'Desktop'),
    path.join(os.homedir(), 'Downloads'),
]

// Dangerous patterns in shell commands that could indicate malicious intent
// Based on OWASP Command Injection and PayloadsAllTheThings research
const DANGEROUS_PATTERNS = [
    // === Data Destruction ===
    /rm\s+(-[rRf]+\s+|--recursive\s+|--force\s+)*[\/~]/i,  // Recursive delete
    /rm\s+-[rRf]*\s+\*/i,                                    // Delete wildcards
    /mkfs\./i,                                               // Filesystem formatting
    /dd\s+if=/i,                                             // dd command (can destroy data)
    />\s*\/dev\/(sd|hd|nvme)/i,                             // Writing to disk devices
    
    // === Remote Code Execution ===
    /curl.*\|\s*(ba)?sh/i,                                   // Curl piped to shell
    /wget.*\|\s*(ba)?sh/i,                                   // Wget piped to shell
    /curl.*\|\s*python/i,                                    // Curl piped to python
    /wget.*\|\s*python/i,                                    // Wget piped to python
    /\|\s*(ba)?sh\s*$/i,                                     // Anything piped to shell
    /\|\s*zsh\s*$/i,                                         // Piped to zsh
    
    // === Command Substitution (can hide payloads) ===
    /\$\([^)]*\)/,                                           // $() command substitution
    /`[^`]+`/,                                               // Backtick command substitution
    
    // === Encoded/Obfuscated Payloads ===
    /base64\s+(-d|--decode)/i,                              // Base64 decode (hides payloads)
    /\\x[0-9a-f]{2}/i,                                      // Hex encoded characters
    /\$'\\x[0-9a-f]/i,                                      // ANSI-C quoting with hex
    /xxd\s+-r/i,                                             // Reverse hex dump
    /printf\s+.*\\x/i,                                       // Printf with hex
    
    // === Network Exfiltration ===
    /nc\s+(-[elp]|--listen)/i,                              // Netcat listener
    /ncat\s+(-[elp]|--listen)/i,                            // Ncat listener
    /socat\s/i,                                              // Socat (network relay)
    /curl.*(-d|--data).*@/i,                                // Curl posting file data
    /curl.*-X\s*POST.*@/i,                                  // Curl POST with file
    
    // === Privilege Escalation ===
    /chmod\s+[0-7]*[4-7][0-7][0-7]/i,                       // Setting setuid/setgid
    /chmod\s+[ugo]*\+s/i,                                   // Adding setuid/setgid
    /chown\s+root/i,                                         // Changing owner to root
    
    // === System Manipulation ===
    />\s*\/etc\//i,                                          // Writing to /etc
    />\s*~\/\.[a-z]*rc/i,                                   // Overwriting shell rc files
    />\s*~\/\.ssh\//i,                                       // Writing to .ssh
    />\s*\/usr\/(local\/)?bin\//i,                          // Writing to bin directories
    /crontab\s/i,                                            // Crontab manipulation
    /at\s+\d/i,                                              // at command (scheduled tasks)
    
    // === Known Attack Patterns ===
    /:()\s*{\s*:\s*\|\s*:\s*&\s*}\s*;/,                     // Fork bomb
    /eval\s*\(/i,                                            // Eval execution
    /\bexec\s*\(/i,                                          // Exec call
    
    // === Interpreter One-liners (often used to hide malicious code) ===
    /python[23]?\s+(-c|--command)\s+['"]/i,                 // Python one-liners
    /perl\s+-e\s+['"]/i,                                    // Perl one-liners
    /ruby\s+-e\s+['"]/i,                                    // Ruby one-liners
    /php\s+-r\s+['"]/i,                                     // PHP one-liners
    /node\s+-e\s+['"]/i,                                    // Node one-liners
    
    // === Obfuscation Techniques (from PayloadsAllTheThings) ===
    /\$\{IFS\}/i,                                            // IFS variable (space bypass)
    /\$IFS/i,                                                // IFS without braces
    /\{[a-z]+,[^}]+\}/i,                                    // Brace expansion {cat,/etc/passwd}
    /\\$@/,                                                  // $@ bypass
]

// Suspicious but not necessarily dangerous patterns
const SUSPICIOUS_PATTERNS = [
    /sudo\s+/i,                                              // Sudo usage
    /curl\s+/i,                                              // Downloading files
    /wget\s+/i,                                              // Downloading files
    /git\s+clone/i,                                          // Cloning repositories
    /npm\s+install\s+-g/i,                                  // Global npm installs
    /pip3?\s+install/i,                                     // Pip installs
    /brew\s+install/i,                                      // Homebrew installs (outside normal flow)
    /gem\s+install/i,                                       // Ruby gem installs
    /go\s+install/i,                                        // Go installs
    /cargo\s+install/i,                                     // Rust cargo installs
    /apt(-get)?\s+install/i,                               // Apt installs
    /yum\s+install/i,                                       // Yum installs
    /dnf\s+install/i,                                       // DNF installs
    /pacman\s+-S/i,                                         // Pacman installs
    /snap\s+install/i,                                      // Snap installs
    /flatpak\s+install/i,                                   // Flatpak installs
    /source\s+/i,                                           // Sourcing scripts
    /\.\s+\//,                                               // Dot-sourcing scripts
    /export\s+\w+=/i,                                       // Setting environment variables
    /alias\s+\w+=/i,                                        // Setting aliases
]

export interface SecurityScanResult {
    hasDangerousContent: boolean
    hasSuspiciousContent: boolean
    hasObfuscation: boolean
    dangerousCommands: string[]
    suspiciousCommands: string[]
    obfuscatedCommands: string[]
    warnings: string[]
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Detects obfuscation techniques commonly used to bypass security filters
 * Based on OWASP Command Injection and PayloadsAllTheThings bypass techniques
 */
function detectObfuscation(command: string): { isObfuscated: boolean; techniques: string[] } {
    const techniques: string[] = []
    
    // Character insertion (quotes to break up commands): w'h'o'am'i, w"h"o"a"mi
    if (/[a-z]'[a-z]'/i.test(command) || /[a-z]"[a-z]"/i.test(command)) {
        techniques.push('quote insertion')
    }
    
    // Backslash insertion: wh\oami
    if (/\\\w/i.test(command) && !/\\n|\\t|\\r|\\x/.test(command)) {
        techniques.push('backslash insertion')
    }
    
    // IFS variable usage: ${IFS} or $IFS to bypass space filtering
    if (/\$\{?IFS\}?/.test(command)) {
        techniques.push('IFS variable bypass')
    }
    
    // Brace expansion: {cat,/etc/passwd}
    if (/\{[a-z]+,[^}]+\}/i.test(command)) {
        techniques.push('brace expansion')
    }
    
    // Hex encoding: \x2f or $'\x2f'
    if (/\\x[0-9a-f]{2}/i.test(command)) {
        techniques.push('hex encoding')
    }
    
    // Octal encoding: $'\101' 
    if (/\$'\\[0-7]{1,3}'/.test(command)) {
        techniques.push('octal encoding')
    }
    
    // Unicode encoding: $'\u0041'
    if (/\$'\\u[0-9a-f]{4}'/i.test(command)) {
        techniques.push('unicode encoding')
    }
    
    // Base64 decode pipe: echo xxx | base64 -d
    if (/base64\s+(-d|--decode)/i.test(command)) {
        techniques.push('base64 encoding')
    }
    
    // Variable manipulation: ${var//pattern/}
    if (/\$\{[^}]+\/\/[^}]+\}/.test(command)) {
        techniques.push('variable manipulation')
    }
    
    // Wildcard abuse: /???/??t for /bin/cat
    if (/\/\?{2,}\//.test(command)) {
        techniques.push('wildcard obfuscation')
    }
    
    // Empty variable insertion: who$()ami, who$@ami
    if (/\$\(\)|\$@|\$\{\}/.test(command)) {
        techniques.push('empty variable insertion')
    }
    
    // Rev command to reverse strings
    if (/\|\s*rev\b/.test(command)) {
        techniques.push('string reversal')
    }
    
    return {
        isObfuscated: techniques.length > 0,
        techniques
    }
}

/**
 * Calculates severity based on scan results
 */
function calculateSeverity(result: Omit<SecurityScanResult, 'severity'>): SecurityScanResult['severity'] {
    if (result.dangerousCommands.length > 0 && result.hasObfuscation) {
        return 'critical'  // Dangerous + obfuscated = almost certainly malicious
    }
    if (result.dangerousCommands.length > 0) {
        return 'high'
    }
    if (result.hasObfuscation) {
        return 'high'  // Obfuscation alone is very suspicious
    }
    if (result.suspiciousCommands.length > 0) {
        return 'medium'
    }
    return 'none'
}

/**
 * Scans shell commands for potentially dangerous content
 * @param commands - Array of shell commands to scan
 * @returns Security scan result with findings
 */
export function scanShellCommands(commands: string[]): SecurityScanResult {
    const result: Omit<SecurityScanResult, 'severity'> & { severity?: SecurityScanResult['severity'] } = {
        hasDangerousContent: false,
        hasSuspiciousContent: false,
        hasObfuscation: false,
        dangerousCommands: [],
        suspiciousCommands: [],
        obfuscatedCommands: [],
        warnings: [],
    }

    for (const command of commands) {
        // Check for obfuscation first (strongest indicator of malicious intent)
        const obfuscationCheck = detectObfuscation(command)
        if (obfuscationCheck.isObfuscated) {
            result.hasObfuscation = true
            if (!result.obfuscatedCommands.includes(command)) {
                result.obfuscatedCommands.push(command)
            }
            result.warnings.push(`Obfuscation detected (${obfuscationCheck.techniques.join(', ')}): ${command.slice(0, 50)}...`)
        }

        // Check for dangerous patterns
        for (const pattern of DANGEROUS_PATTERNS) {
            if (pattern.test(command)) {
                result.hasDangerousContent = true
                if (!result.dangerousCommands.includes(command)) {
                    result.dangerousCommands.push(command)
                }
                break  // No need to check more patterns for this command
            }
        }

        // Check for suspicious patterns (only if not already flagged as dangerous)
        if (!result.dangerousCommands.includes(command)) {
            for (const pattern of SUSPICIOUS_PATTERNS) {
                if (pattern.test(command)) {
                    result.hasSuspiciousContent = true
                    if (!result.suspiciousCommands.includes(command)) {
                        result.suspiciousCommands.push(command)
                    }
                    break
                }
            }
        }
    }

    // Generate summary warnings
    if (result.hasObfuscation) {
        result.warnings.unshift('OBFUSCATION DETECTED: This config contains commands that appear to be intentionally obscured. This is a strong indicator of malicious intent.')
    }
    if (result.hasDangerousContent) {
        result.warnings.unshift('DANGEROUS: This configuration contains commands that could harm your system, steal data, or execute arbitrary code.')
    }
    if (result.hasSuspiciousContent && !result.hasDangerousContent) {
        result.warnings.unshift('CAUTION: This configuration will download or install additional software outside of the normal package manager flow.')
    }

    return {
        ...result,
        severity: calculateSeverity(result)
    }
}

/**
 * Extracts all shell commands from a PakkyConfig object
 * @param config - The config object to extract commands from
 * @returns Array of all shell commands found
 */
export function extractShellCommands(config: Record<string, unknown>): string[] {
    const commands: string[] = []

    function traverse(obj: unknown): void {
        if (Array.isArray(obj)) {
            for (const item of obj) {
                traverse(item)
            }
        } else if (obj && typeof obj === 'object') {
            const record = obj as Record<string, unknown>
            // Check for 'commands' arrays (post_install steps)
            if ('commands' in record && Array.isArray(record.commands)) {
                for (const cmd of record.commands) {
                    if (typeof cmd === 'string') {
                        commands.push(cmd)
                    }
                }
            }
            // Check for 'post_install' string arrays in packages
            if ('post_install' in record && Array.isArray(record.post_install)) {
                for (const cmd of record.post_install) {
                    if (typeof cmd === 'string') {
                        commands.push(cmd)
                    }
                }
            }
            // Recurse into nested objects
            for (const value of Object.values(record)) {
                traverse(value)
            }
        }
    }

    traverse(config)
    return commands
}

/**
 * Validates that a file path is within allowed directories
 * @param filePath - The path to validate
 * @returns true if the path is allowed, false otherwise
 */
export function isPathAllowed(filePath: string): boolean {
    const resolvedPath = path.resolve(filePath)
    // Check if path is within any allowed directory
    const isAllowed = ALLOWED_CONFIG_DIRS.some(dir => resolvedPath.startsWith(dir))
    // Also verify it's a .json file for config operations
    const isJsonFile = resolvedPath.endsWith('.json')
    return isAllowed && isJsonFile
}

/**
 * Validates package name to prevent command injection
 * @param name - Package name to validate
 * @returns true if valid, false otherwise
 */
export function isValidPackageName(name: string): boolean {
    return PACKAGE_NAME_REGEX.test(name) && name.length <= 128
}

/**
 * Validates URL for safe external opening
 * @param url - URL to validate
 * @returns true if safe to open, false otherwise
 */
export function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Command Allowlist
 * Categorized commands for security validation
 */

import type { CommandCategory } from '../constants/security-levels';

/**
 * Commands organized by security category
 */
export const COMMAND_CATEGORIES: Record<CommandCategory, string[]> = {
    // Always allowed - read-only, no network, no destructive side effects
    SAFE: [
        'echo', 'printf', 'cat', 'head', 'tail', 'less', 'more',
        'grep', 'awk', 'sed', 'sort', 'uniq', 'wc', 'cut', 'tr',
        'ls', 'pwd', 'whoami', 'date', 'cal', 'env', 'printenv',
        'basename', 'dirname', 'realpath', 'readlink',
        'test', '[', '[[', 'true', 'false',
        'seq', 'yes', 'sleep', 'wait',
        'xargs', 'tee', 'diff', 'comm', 'join',
        'type', 'which', 'whereis', 'whatis',
        'id', 'groups', 'hostname', 'uname',
        'man', 'info', 'help',
        'clear', 'reset', 'tput',
    ],

    // File operations - can modify but typically safe within user space
    FILESYSTEM: [
        'mkdir', 'touch', 'cp', 'mv', 'ln',
        'chmod', 'chown', 'chgrp',
        'find', 'locate', 'stat', 'file', 'du', 'df',
        'tar', 'gzip', 'gunzip', 'zip', 'unzip', 'bzip2', 'xz',
        'open', 'xdg-open',  // Open files/URLs with default app
    ],

    // Network access - can download/upload, requires more trust
    NETWORK: [
        'curl', 'wget', 'git', 'ssh', 'scp', 'rsync', 'sftp',
        'ping', 'traceroute', 'dig', 'nslookup', 'host',
        'gh', // GitHub CLI
    ],

    // Package managers - install software, modifies system
    PACKAGE_MANAGERS: [
        'brew', 'npm', 'npx', 'yarn', 'pnpm', 'bun',
        'pip', 'pip3', 'pipx', 'python', 'python3',
        'gem', 'bundle', 'bundler',
        'cargo', 'rustup',
        'go',
        'composer',
        'mas', // Mac App Store CLI
        'code', // VS Code CLI for extensions
    ],

    // System modifications - requires significant trust
    SYSTEM: [
        'sudo', 'doas',
        'apt', 'apt-get', 'dpkg',
        'yum', 'dnf', 'rpm',
        'pacman', 'yay', 'paru',
        'snap', 'flatpak',
        'defaults', 'launchctl', 'pmset', 'scutil', // macOS system
        'systemctl', 'service', // Linux services
        'killall', 'pkill', // Process management (moved from DANGEROUS)
    ],

    // Never allowed without explicit override - dangerous operations
    DANGEROUS: [
        'rm', 'rmdir', 'shred',
        'dd', 'mkfs', 'fdisk', 'parted',
        'nc', 'ncat', 'netcat', 'socat',
        'eval', 'exec',
        'su', 'passwd', 'chpasswd',
        'crontab', 'at',
        'kill', // kill is dangerous (can kill any PID)
        'reboot', 'shutdown', 'poweroff', 'halt',
        'iptables', 'nft', 'ufw',
    ],
};

/**
 * Get the category of a command
 */
export function getCommandCategory(command: string): CommandCategory | null {
    const normalizedCommand = command.toLowerCase().trim();

    for (const [category, commands] of Object.entries(COMMAND_CATEGORIES)) {
        if (commands.includes(normalizedCommand)) {
            return category as CommandCategory;
        }
    }

    return null; // Unknown command
}

/**
 * Check if a command is allowed for a given set of categories
 * @param command - The command to check
 * @param allowedCategories - Categories that are allowed
 * @param allowUnknown - Whether to allow unknown commands (defaults to false for security)
 */
export function isCommandAllowed(
    command: string,
    allowedCategories: CommandCategory[],
    allowUnknown: boolean = false
): boolean {
    const category = getCommandCategory(command);

    if (!category) {
        // Unknown commands are blocked by default
        // Only allow if explicitly configured via allowUnknown parameter
        return allowUnknown;
    }

    return allowedCategories.includes(category);
}

/**
 * Get all allowed commands for a set of categories
 */
export function getAllowedCommands(allowedCategories: CommandCategory[]): string[] {
    return allowedCategories.flatMap(cat => COMMAND_CATEGORIES[cat] || []);
}

/**
 * Get all blocked commands for a set of categories
 */
export function getBlockedCommands(allowedCategories: CommandCategory[]): string[] {
    const allCategories = Object.keys(COMMAND_CATEGORIES) as CommandCategory[];
    const blockedCategories = allCategories.filter(cat => !allowedCategories.includes(cat));
    return blockedCategories.flatMap(cat => COMMAND_CATEGORIES[cat] || []);
}

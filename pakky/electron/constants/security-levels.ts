/**
 * Security Level Constants
 * Tiered security presets for script validation
 */

export type SecurityLevelKey = 'STRICT' | 'STANDARD' | 'PERMISSIVE';

export interface SecurityLevel {
    name: string;
    description: string;
    allowedCategories: CommandCategory[];
    requiresASTValidation: boolean;
    blockObfuscation: boolean;
    warning?: string; // Warning message for risky security levels
}

export type CommandCategory =
    | 'SAFE'
    | 'FILESYSTEM'
    | 'NETWORK'
    | 'PACKAGE_MANAGERS'
    | 'SYSTEM'
    | 'DANGEROUS';

export const SECURITY_LEVELS: Record<SecurityLevelKey, SecurityLevel> = {
    STRICT: {
        name: 'Strict',
        description: 'Only safe commands allowed. No network or package installations in scripts.',
        allowedCategories: ['SAFE', 'FILESYSTEM'],
        requiresASTValidation: true,
        blockObfuscation: true
    },
    STANDARD: {
        name: 'Standard',
        description: 'Allows package managers and git in scripts. Recommended for trusted configs.',
        allowedCategories: ['SAFE', 'FILESYSTEM', 'NETWORK', 'PACKAGE_MANAGERS'],
        requiresASTValidation: true,
        blockObfuscation: true
    },
    PERMISSIVE: {
        name: 'Permissive',
        description: 'Allows most operations with warnings. Only for fully trusted configs.',
        allowedCategories: ['SAFE', 'FILESYSTEM', 'NETWORK', 'PACKAGE_MANAGERS', 'SYSTEM'],
        requiresASTValidation: false,
        blockObfuscation: false,
        warning: 'PERMISSIVE mode allows dangerous system operations including sudo commands. ' +
                 'Only use this with configurations you completely trust. ' +
                 'Malicious configs could compromise your system.'
    }
} as const;

export const DEFAULT_SECURITY_LEVEL: SecurityLevelKey = 'STRICT';

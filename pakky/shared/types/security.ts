/**
 * Security Types
 * Shared between electron (main process) and renderer
 */

import type { SecurityLevelKey } from './config';

/**
 * Parsed command from AST analysis
 */
export interface ParsedCommand {
    command: string;
    args: string[];
    raw: string;
}

/**
 * Result of security scan on shell commands
 */
export interface SecurityScanResult {
    hasDangerousContent: boolean;
    hasSuspiciousContent: boolean;
    hasObfuscation: boolean;
    dangerousCommands: string[];
    suspiciousCommands: string[];
    obfuscatedCommands: string[];
    warnings: string[];
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    // AST-based fields
    parsedCommands: ParsedCommand[];
    blockedCommands: string[];
    unknownCommands: string[];
    securityLevel: SecurityLevelKey;
    astParsingFailed: boolean;
    recommendations: string[];
}

/**
 * Result of loading a config file with security scan
 */
export interface ConfigLoadResult {
    config: import('./config').PakkyConfig;
    security: SecurityScanResult;
}

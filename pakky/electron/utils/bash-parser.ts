/**
 * Shell Command AST Parser
 * Wrapper around bash-parser for semantic command analysis
 */

import parse from 'bash-parser';
import { logger } from './logger';

export interface ParsedCommand {
    command: string;
    args: string[];
    text: string;
    isPiped: boolean;
    hasSubshell: boolean;
    hasRedirect: boolean;
}

export interface CommandParseResult {
    success: boolean;
    commands: ParsedCommand[];
    rawCommand: string;
    error?: string;
}

/**
 * Extract command name from a word node
 */
function extractWord(node: unknown): string {
    if (!node || typeof node !== 'object') return '';

    const wordNode = node as { text?: string; expansion?: unknown[] };

    if (wordNode.text) {
        return wordNode.text;
    }

    // Handle expansions (like variables)
    if (Array.isArray(wordNode.expansion)) {
        return wordNode.expansion.map(exp => {
            if (typeof exp === 'object' && exp !== null && 'parameter' in exp) {
                return `$${(exp as { parameter: string }).parameter}`;
            }
            return '';
        }).join('');
    }

    return '';
}

/**
 * Recursively extract all commands from an AST node
 */
function extractCommands(node: unknown, commands: ParsedCommand[], isPiped = false): void {
    if (!node || typeof node !== 'object') return;

    const astNode = node as {
        type?: string;
        name?: unknown;
        suffix?: unknown[];
        prefix?: unknown[];
        commands?: unknown[];
        left?: unknown;
        right?: unknown;
        list?: unknown[];
    };

    switch (astNode.type) {
        case 'Command': {
            const commandName = extractWord(astNode.name);
            const args: string[] = [];

            // Extract suffix (arguments)
            if (Array.isArray(astNode.suffix)) {
                for (const suffix of astNode.suffix) {
                    const suffixObj = suffix as { type?: string };
                    if (suffixObj.type === 'Word') {
                        args.push(extractWord(suffix));
                    }
                }
            }

            // Check for redirects
            const hasRedirect = Array.isArray(astNode.suffix) &&
                astNode.suffix.some(s => {
                    const sObj = s as { type?: string };
                    return sObj.type === 'Redirect';
                });

            if (commandName) {
                commands.push({
                    command: commandName,
                    args,
                    text: `${commandName} ${args.join(' ')}`.trim(),
                    isPiped,
                    hasSubshell: false,
                    hasRedirect,
                });
            }
            break;
        }

        case 'Pipeline': {
            if (Array.isArray(astNode.commands)) {
                astNode.commands.forEach((cmd, index) => {
                    extractCommands(cmd, commands, index > 0);
                });
            }
            break;
        }

        case 'LogicalExpression': {
            extractCommands(astNode.left, commands);
            extractCommands(astNode.right, commands);
            break;
        }

        case 'Subshell': {
            if (Array.isArray(astNode.list)) {
                for (const item of astNode.list) {
                    extractCommands(item, commands);
                    // Mark all extracted as having subshell
                    commands.forEach(cmd => cmd.hasSubshell = true);
                }
            }
            break;
        }

        case 'Script': {
            if (Array.isArray(astNode.commands)) {
                for (const cmd of astNode.commands) {
                    extractCommands(cmd, commands);
                }
            }
            break;
        }

        default: {
            // Traverse any array properties
            for (const value of Object.values(astNode)) {
                if (Array.isArray(value)) {
                    for (const item of value) {
                        extractCommands(item, commands);
                    }
                } else if (typeof value === 'object') {
                    extractCommands(value, commands);
                }
            }
        }
    }
}

/**
 * Parse a shell command string into structured command objects
 */
export function parseShellCommand(commandString: string): CommandParseResult {
    const result: CommandParseResult = {
        success: false,
        commands: [],
        rawCommand: commandString,
    };

    if (!commandString || typeof commandString !== 'string') {
        result.error = 'Empty or invalid command string';
        return result;
    }

    try {
        const ast = parse(commandString);
        extractCommands(ast, result.commands);
        result.success = true;
    } catch (error) {
        // Parsing failed - command might be invalid or use unsupported syntax
        result.error = error instanceof Error ? error.message : 'Parse error';
        logger.main.warn(`AST parsing failed for command: ${commandString.slice(0, 50)}...`);
    }

    return result;
}

/**
 * Extract just the command names from a shell command string
 */
export function extractCommandNames(commandString: string): string[] {
    const result = parseShellCommand(commandString);
    return result.commands.map(cmd => cmd.command);
}

/**
 * Check if a command contains subshell or command substitution
 */
export function hasSubshellOrSubstitution(commandString: string): boolean {
    // Quick regex check before AST parsing
    if (/\$\([^)]+\)|`[^`]+`/.test(commandString)) {
        return true;
    }

    const result = parseShellCommand(commandString);
    return result.commands.some(cmd => cmd.hasSubshell);
}

/**
 * Check if a command contains piping
 */
export function hasPiping(commandString: string): boolean {
    const result = parseShellCommand(commandString);
    return result.commands.some(cmd => cmd.isPiped);
}

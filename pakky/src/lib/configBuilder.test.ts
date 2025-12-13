import { describe, it, expect } from 'vitest'
import {
    buildPakkyConfig,
    generateTagSuggestions,
    getMacOSMinVersion,
    DEFAULT_BUILD_OPTIONS,
} from './configBuilder'
import type { PackageInstallItem } from './types'

// ============================================
// Test Helpers
// ============================================

function createMockPackage(overrides: Partial<PackageInstallItem> = {}): PackageInstallItem {
    return {
        id: 'formula:test',
        name: 'test',
        type: 'formula',
        position: 1,
        status: 'pending',
        description: 'Test package',
        logs: [],
        ...overrides,
    }
}

// ============================================
// Tests: getMacOSMinVersion
// ============================================

describe('getMacOSMinVersion', () => {
    it('extracts major.minor from full version', () => {
        expect(getMacOSMinVersion('14.2.1')).toBe('14.2')
    })

    it('handles major.minor only', () => {
        expect(getMacOSMinVersion('14.0')).toBe('14.0')
    })

    it('returns original if only major version', () => {
        expect(getMacOSMinVersion('14')).toBe('14')
    })

    it('handles complex version strings', () => {
        expect(getMacOSMinVersion('15.0.1.2')).toBe('15.0')
    })
})

// ============================================
// Tests: generateTagSuggestions
// ============================================

describe('generateTagSuggestions', () => {
    it('suggests web-dev for web packages', () => {
        const packages = [
            createMockPackage({ name: 'node' }),
            createMockPackage({ name: 'npm' }),
        ]
        const tags = generateTagSuggestions(packages)

        expect(tags).toContain('web-dev')
        expect(tags).toContain('javascript')
    })

    it('suggests devops for docker', () => {
        const packages = [createMockPackage({ name: 'docker' })]
        const tags = generateTagSuggestions(packages)

        expect(tags).toContain('devops')
        expect(tags).toContain('containerization')
    })

    it('returns empty array when no matches', () => {
        const packages = [createMockPackage({ name: 'obscure-package' })]
        const tags = generateTagSuggestions(packages)

        expect(tags).toEqual([])
    })

    it('handles multiple categories', () => {
        const packages = [
            createMockPackage({ name: 'node' }),
            createMockPackage({ name: 'python' }),
            createMockPackage({ name: 'docker' }),
        ]
        const tags = generateTagSuggestions(packages)

        expect(tags).toContain('javascript')
        expect(tags).toContain('python')
        expect(tags).toContain('devops')
    })

    it('returns sorted tags', () => {
        const packages = [
            createMockPackage({ name: 'node' }),
            createMockPackage({ name: 'docker' }),
        ]
        const tags = generateTagSuggestions(packages)

        // Tags should be alphabetically sorted
        const sorted = [...tags].sort()
        expect(tags).toEqual(sorted)
    })
})

// ============================================
// Tests: buildPakkyConfig
// ============================================

describe('buildPakkyConfig', () => {
    const defaultOptions = {
        name: 'Test Config',
        ...DEFAULT_BUILD_OPTIONS,
    }

    it('builds minimal config with just name', () => {
        const config = buildPakkyConfig([], defaultOptions)

        expect(config.name).toBe('Test Config')
        expect(config.version).toBe('1.0.0')
        expect(config.$schema).toBeDefined()
    })

    it('includes author when provided', () => {
        const config = buildPakkyConfig([], {
            ...defaultOptions,
            author: 'Test Author',
        })

        expect(config.author).toBe('Test Author')
    })

    it('includes description when provided', () => {
        const config = buildPakkyConfig([], {
            ...defaultOptions,
            description: 'Test description',
        })

        expect(config.description).toBe('Test description')
    })

    it('includes tags when provided', () => {
        const config = buildPakkyConfig([], {
            ...defaultOptions,
            tags: ['development', 'testing'],
        })

        expect(config.tags).toEqual(['development', 'testing'])
    })

    it('does not include empty tags array', () => {
        const config = buildPakkyConfig([], {
            ...defaultOptions,
            tags: [],
        })

        expect(config.tags).toBeUndefined()
    })

    it('builds macos.homebrew.formulae from formula packages', () => {
        const packages = [
            createMockPackage({ type: 'formula', name: 'git', position: 1 }),
            createMockPackage({ type: 'formula', name: 'node', position: 2 }),
        ]
        const config = buildPakkyConfig(packages, defaultOptions)

        expect(config.macos?.homebrew?.formulae).toHaveLength(2)
        expect(config.macos?.homebrew?.formulae?.[0]).toMatchObject({ name: 'git' })
        expect(config.macos?.homebrew?.formulae?.[1]).toMatchObject({ name: 'node' })
    })

    it('builds macos.homebrew.casks from cask packages', () => {
        const packages = [
            createMockPackage({ type: 'cask', name: 'firefox', position: 1 }),
        ]
        const config = buildPakkyConfig(packages, defaultOptions)

        expect(config.macos?.homebrew?.casks).toHaveLength(1)
        expect(config.macos?.homebrew?.casks?.[0]).toMatchObject({ name: 'firefox' })
    })

    it('builds scripts from script packages', () => {
        const packages = [
            createMockPackage({
                type: 'script',
                name: 'Setup',
                commands: ['echo "hello"'],
                description: 'Test script',
                position: 1,
            }),
        ]
        const config = buildPakkyConfig(packages, defaultOptions)

        expect(config.scripts).toHaveLength(1)
        expect(config.scripts?.[0]).toMatchObject({
            name: 'Setup',
            commands: ['echo "hello"'],
        })
    })

    it('preserves package order by position', () => {
        const packages = [
            createMockPackage({ type: 'formula', name: 'second', position: 2 }),
            createMockPackage({ type: 'formula', name: 'first', position: 1 }),
            createMockPackage({ type: 'formula', name: 'third', position: 3 }),
        ]
        const config = buildPakkyConfig(packages, defaultOptions)

        const names = config.macos?.homebrew?.formulae?.map(f =>
            typeof f === 'string' ? f : f.name
        )
        expect(names).toEqual(['first', 'second', 'third'])
    })

    it('includes descriptions when option enabled', () => {
        const packages = [
            createMockPackage({
                type: 'formula',
                name: 'git',
                description: 'Version control',
                position: 1,
            }),
        ]
        const config = buildPakkyConfig(packages, {
            ...defaultOptions,
            includeDescriptions: true,
        })

        const formula = config.macos?.homebrew?.formulae?.[0]
        expect(typeof formula).toBe('object')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((formula as any).description).toBe('Version control')
    })

    it('excludes descriptions when option disabled', () => {
        const packages = [
            createMockPackage({
                type: 'formula',
                name: 'git',
                description: 'Version control',
                position: 1,
            }),
        ]
        const config = buildPakkyConfig(packages, {
            ...defaultOptions,
            includeDescriptions: false,
        })

        const formula = config.macos?.homebrew?.formulae?.[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((formula as any).description).toBeUndefined()
    })

    it('includes metadata when option enabled', () => {
        const config = buildPakkyConfig([], {
            ...defaultOptions,
            includeMetadata: true,
            systemInfo: {
                platform: 'macos',
                version: '14.2.1',
                arch: 'arm64',
                homeDir: '/Users/test',
                hostname: 'test-mac',
            },
        })

        expect(config.metadata).toBeDefined()
        expect(config.metadata?.created_at).toBeDefined()
        expect(config.metadata?.pakky_version).toBeDefined()
        expect(config.metadata?.exported_from).toContain('macOS')
    })

    it('excludes metadata when option disabled', () => {
        const config = buildPakkyConfig([], {
            ...defaultOptions,
            includeMetadata: false,
        })

        expect(config.metadata).toBeUndefined()
    })

    it('includes settings', () => {
        const config = buildPakkyConfig([], {
            ...defaultOptions,
            settings: {
                continue_on_error: false,
                skip_already_installed: true,
            },
        })

        expect(config.settings).toEqual({
            continue_on_error: false,
            skip_already_installed: true,
        })
    })

    it('includes system requirements when enabled', () => {
        const packages = [createMockPackage({ type: 'formula', name: 'test', position: 1 })]
        const config = buildPakkyConfig(packages, {
            ...defaultOptions,
            includeSystemRequirements: true,
            systemRequirements: {
                minVersion: '14.0',
                architectures: ['arm64'],
            },
        })

        expect(config.macos?.requires).toEqual({
            min_version: '14.0',
            arch: ['arm64'],
        })
    })

    it('handles script prompt_for_input', () => {
        const packages = [
            createMockPackage({
                type: 'script',
                name: 'Configure',
                commands: ['echo {{name}}'],
                promptForInput: {
                    name: { message: 'Enter name' },
                },
                position: 1,
            }),
        ]
        const config = buildPakkyConfig(packages, defaultOptions)

        expect(config.scripts?.[0].prompt_for_input).toEqual({
            name: { message: 'Enter name' },
        })
    })
})

// ============================================
// ERROR CASES - What happens when things go wrong?
// ============================================

describe('error handling', () => {
    const defaultOptions = {
        name: 'Test Config',
        ...DEFAULT_BUILD_OPTIONS,
    }

    describe('getMacOSMinVersion with invalid inputs', () => {
        it('handles empty string', () => {
            const result = getMacOSMinVersion('')
            expect(result).toBe('')
        })

        it('handles single number', () => {
            const result = getMacOSMinVersion('14')
            expect(result).toBe('14')
        })

        it('handles non-numeric strings', () => {
            const result = getMacOSMinVersion('Sonoma')
            expect(result).toBe('Sonoma')
        })

        it('handles version with letters', () => {
            const result = getMacOSMinVersion('14.0-beta')
            expect(result).toBe('14.0-beta')
        })

        it('handles dots only', () => {
            const result = getMacOSMinVersion('..')
            expect(result).toBe('.')
        })
    })

    describe('generateTagSuggestions with invalid inputs', () => {
        it('handles empty packages array', () => {
            const result = generateTagSuggestions([])
            expect(result).toEqual([])
        })

        it('handles packages with empty names', () => {
            const packages = [createMockPackage({ name: '' })]
            const result = generateTagSuggestions(packages)
            expect(result).toEqual([])
        })

        it('handles packages with undefined names', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const packages = [{ ...createMockPackage(), name: undefined as any }]
            const result = generateTagSuggestions(packages)
            // Should not crash
            expect(Array.isArray(result)).toBe(true)
        })

        it('handles packages with special characters in names', () => {
            const packages = [createMockPackage({ name: '@node/core' })]
            const result = generateTagSuggestions(packages)
            // Should still match 'node' keyword
            expect(result).toContain('javascript')
        })

        it('handles very large number of packages', () => {
            const packages = Array.from({ length: 1000 }, (_, i) =>
                createMockPackage({ name: `pkg${i}` })
            )
            const result = generateTagSuggestions(packages)
            expect(Array.isArray(result)).toBe(true)
        })
    })

    describe('buildPakkyConfig with invalid inputs', () => {
        it('handles empty packages array', () => {
            const config = buildPakkyConfig([], defaultOptions)
            expect(config.macos).toBeUndefined()
            expect(config.scripts).toBeUndefined()
        })

        it('handles empty name option', () => {
            const config = buildPakkyConfig([], {
                ...defaultOptions,
                name: '',
            })
            expect(config.name).toBe('')
        })

        it('handles packages with undefined positions', () => {
            const packages = [
                createMockPackage({ type: 'formula', name: 'a', position: undefined }),
                createMockPackage({ type: 'formula', name: 'b', position: undefined }),
            ]
            const config = buildPakkyConfig(packages, defaultOptions)
            expect(config.macos?.homebrew?.formulae).toHaveLength(2)
        })

        it('handles packages with NaN positions', () => {
            const packages = [
                createMockPackage({ type: 'formula', name: 'a', position: NaN }),
            ]
            const config = buildPakkyConfig(packages, defaultOptions)
            // Should not crash
            expect(config.macos?.homebrew?.formulae).toHaveLength(1)
        })

        it('handles packages with negative positions', () => {
            const packages = [
                createMockPackage({ type: 'formula', name: 'a', position: -10 }),
                createMockPackage({ type: 'formula', name: 'b', position: -5 }),
            ]
            const config = buildPakkyConfig(packages, defaultOptions)
            expect(config.macos?.homebrew?.formulae).toHaveLength(2)
        })

        it('handles script with undefined commands', () => {
            const packages = [
                createMockPackage({
                    type: 'script',
                    name: 'test',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    commands: undefined as any,
                    position: 1,
                }),
            ]
            const config = buildPakkyConfig(packages, defaultOptions)
            // Should handle gracefully
            expect(config.scripts).toHaveLength(1)
        })

        it('handles script with empty commands array', () => {
            const packages = [
                createMockPackage({
                    type: 'script',
                    name: 'empty',
                    commands: [],
                    position: 1,
                }),
            ]
            const config = buildPakkyConfig(packages, defaultOptions)
            expect(config.scripts?.[0].commands).toEqual([])
        })

        it('handles undefined systemInfo', () => {
            const config = buildPakkyConfig([], {
                ...defaultOptions,
                includeMetadata: true,
                systemInfo: undefined,
            })
            expect(config.metadata?.exported_from).toBe('Unknown')
        })

        it('handles undefined settings', () => {
            const config = buildPakkyConfig([], {
                ...defaultOptions,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                settings: {} as any,
            })
            // Empty settings should not be included
            expect(config.settings).toBeUndefined()
        })

        it('handles very long package names', () => {
            const longName = 'a'.repeat(1000)
            const packages = [createMockPackage({ name: longName, position: 1 })]
            const config = buildPakkyConfig(packages, defaultOptions)

            const formula = config.macos?.homebrew?.formulae?.[0]
            expect(formula).toEqual(expect.objectContaining({ name: longName }))
        })

        it('handles special characters in description', () => {
            const packages = [
                createMockPackage({
                    name: 'test',
                    description: '<script>alert("xss")</script>',
                    position: 1,
                }),
            ]
            const config = buildPakkyConfig(packages, {
                ...defaultOptions,
                includeDescriptions: true,
            })
            const formula = config.macos?.homebrew?.formulae?.[0]
            expect(formula).toEqual(
                expect.objectContaining({ description: '<script>alert("xss")</script>' })
            )
        })

        it('handles all package types at once', () => {
            const packages = [
                createMockPackage({ type: 'formula', name: 'git', position: 1 }),
                createMockPackage({ type: 'cask', name: 'firefox', position: 2 }),
                createMockPackage({ type: 'script', name: 'setup', commands: [], position: 3 }),
                createMockPackage({ type: 'mas', name: 'Xcode', position: 4 }),
            ]
            const config = buildPakkyConfig(packages, defaultOptions)

            expect(config.macos?.homebrew?.formulae).toHaveLength(1)
            expect(config.macos?.homebrew?.casks).toHaveLength(1)
            expect(config.scripts).toHaveLength(1)
            // MAS apps aren't currently handled in buildPakkyConfig
        })
    })
})

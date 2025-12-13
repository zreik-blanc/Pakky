import { describe, it, expect } from 'vitest'
import {
    parseConfig,
    parsePreset,
    getPackageNamesPreview,
    countPresetPackages,
    hasPackages,
} from './configParser'
import type { PakkyConfig, Preset } from './types'

// ============================================
// Test Fixtures
// ============================================

const createMinimalConfig = (overrides: Partial<PakkyConfig> = {}): PakkyConfig => ({
    name: 'Test Config',
    version: '1.0.0',
    ...overrides,
})

const createConfigWithFormulae = (formulae: string[]): PakkyConfig => ({
    name: 'Test Config',
    version: '1.0.0',
    macos: {
        homebrew: {
            formulae,
        },
    },
})

const createConfigWithCasks = (casks: (string | { name: string; description?: string })[]): PakkyConfig => ({
    name: 'Test Config',
    version: '1.0.0',
    macos: {
        homebrew: {
            casks,
        },
    },
})

const createPreset = (overrides: Partial<Preset> = {}): Preset => ({
    id: 'test-preset',
    name: 'Test Preset',
    description: 'A test preset',
    icon: '🧪',
    ...overrides,
})

// ============================================
// Tests: parseConfig
// ============================================

describe('parseConfig', () => {
    it('returns empty packages for minimal config', () => {
        const config = createMinimalConfig()
        const result = parseConfig(config)

        expect(result.packages).toEqual([])
        expect(result.configName).toBe('Test Config')
    })

    it('parses formulae from string array', () => {
        const config = createConfigWithFormulae(['git', 'node', 'python'])
        const result = parseConfig(config)

        expect(result.packages).toHaveLength(3)
        expect(result.packages[0]).toMatchObject({
            name: 'git',
            type: 'formula',
            status: 'pending',
        })
    })

    it('parses formulae from PackageObject array', () => {
        const config: PakkyConfig = {
            name: 'Test',
            version: '1.0.0',
            macos: {
                homebrew: {
                    formulae: [
                        { name: 'git', description: 'Version control', required: true },
                        { name: 'node', version: '20.0.0' },
                    ],
                },
            },
        }
        const result = parseConfig(config)

        expect(result.packages).toHaveLength(2)
        expect(result.packages[0]).toMatchObject({
            name: 'git',
            description: 'Version control',
            required: true,
        })
        expect(result.packages[1]).toMatchObject({
            name: 'node',
            version: '20.0.0',
        })
    })

    it('parses casks from string array', () => {
        const config = createConfigWithCasks(['firefox', 'visual-studio-code'])
        const result = parseConfig(config)

        expect(result.packages).toHaveLength(2)
        expect(result.packages[0]).toMatchObject({
            name: 'firefox',
            type: 'cask',
        })
    })

    it('parses casks with extensions', () => {
        const config: PakkyConfig = {
            name: 'Test',
            version: '1.0.0',
            macos: {
                homebrew: {
                    casks: [
                        {
                            name: 'visual-studio-code',
                            extensions: ['eslint.eslint', 'prettier.prettier'],
                        },
                    ],
                },
            },
        }
        const result = parseConfig(config)

        expect(result.packages[0].extensions).toEqual(['eslint.eslint', 'prettier.prettier'])
    })

    it('parses scripts', () => {
        const config: PakkyConfig = {
            name: 'Test',
            version: '1.0.0',
            scripts: [
                {
                    name: 'Setup Git',
                    commands: ['git config --global user.name "Test"'],
                },
            ],
        }
        const result = parseConfig(config)

        expect(result.packages).toHaveLength(1)
        expect(result.packages[0]).toMatchObject({
            name: 'Setup Git',
            type: 'script',
            commands: ['git config --global user.name "Test"'],
        })
    })

    it('parses mixed formulae, casks, and scripts', () => {
        const config: PakkyConfig = {
            name: 'Full Config',
            version: '1.0.0',
            macos: {
                homebrew: {
                    formulae: ['git', 'node'],
                    casks: ['firefox'],
                },
            },
            scripts: [{ name: 'Setup', commands: ['echo "done"'] }],
        }
        const result = parseConfig(config)

        expect(result.packages).toHaveLength(4)
        expect(result.packages.filter(p => p.type === 'formula')).toHaveLength(2)
        expect(result.packages.filter(p => p.type === 'cask')).toHaveLength(1)
        expect(result.packages.filter(p => p.type === 'script')).toHaveLength(1)
    })

    it('assigns sequential positions to all packages', () => {
        const config = createConfigWithFormulae(['a', 'b', 'c'])
        const result = parseConfig(config)

        expect(result.packages[0].position).toBe(1)
        expect(result.packages[1].position).toBe(2)
        expect(result.packages[2].position).toBe(3)
    })

    it('includes settings from config', () => {
        const config: PakkyConfig = {
            name: 'Test',
            version: '1.0.0',
            settings: {
                continue_on_error: false,
                skip_already_installed: true,
            },
        }
        const result = parseConfig(config)

        expect(result.settings).toEqual({
            continue_on_error: false,
            skip_already_installed: true,
        })
    })

    it('includes config name and description', () => {
        const config: PakkyConfig = {
            name: 'My Config',
            version: '1.0.0',
            description: 'A test config',
        }
        const result = parseConfig(config)

        expect(result.configName).toBe('My Config')
        expect(result.configDescription).toBe('A test config')
    })
})

// ============================================
// Tests: parsePreset
// ============================================

describe('parsePreset', () => {
    it('parses preset with packages.formulae/casks format', () => {
        const preset = createPreset({
            packages: {
                formulae: ['git', 'node'],
                casks: ['firefox'],
            },
        })
        const result = parsePreset(preset)

        expect(result).toHaveLength(3)
        expect(result.filter(p => p.type === 'formula')).toHaveLength(2)
        expect(result.filter(p => p.type === 'cask')).toHaveLength(1)
    })

    it('parses preset with macos.homebrew format', () => {
        const preset = createPreset({
            macos: {
                homebrew: {
                    formulae: ['git'],
                    casks: ['firefox'],
                },
            },
        })
        const result = parsePreset(preset)

        expect(result).toHaveLength(2)
    })

    it('parses preset with scripts', () => {
        const preset = createPreset({
            scripts: [{ name: 'Setup', commands: ['echo "hello"'] }],
        })
        const result = parsePreset(preset)

        expect(result).toHaveLength(1)
        expect(result[0].type).toBe('script')
    })

    it('returns empty array for preset without packages', () => {
        const preset = createPreset()
        const result = parsePreset(preset)

        expect(result).toEqual([])
    })

    it('assigns sequential positions', () => {
        const preset = createPreset({
            packages: {
                formulae: ['a', 'b'],
                casks: ['c'],
            },
        })
        const result = parsePreset(preset)

        expect(result.map(p => p.position)).toEqual([1, 2, 3])
    })
})

// ============================================
// Tests: getPackageNamesPreview
// ============================================

describe('getPackageNamesPreview', () => {
    it('returns package names from preset', () => {
        const preset = createPreset({
            packages: {
                formulae: ['git', 'node'],
                casks: ['firefox'],
            },
        })
        const result = getPackageNamesPreview(preset)

        expect(result).toEqual(['git', 'node', 'firefox'])
    })

    it('limits to maxItems', () => {
        const preset = createPreset({
            packages: {
                formulae: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
            },
        })
        const result = getPackageNamesPreview(preset, 3)

        expect(result).toHaveLength(3)
        expect(result).toEqual(['a', 'b', 'c'])
    })

    it('extracts names from PackageObject items', () => {
        const preset = createPreset({
            packages: {
                formulae: [
                    { name: 'git', description: 'Version control' },
                    'node',
                ],
            },
        })
        const result = getPackageNamesPreview(preset)

        expect(result).toEqual(['git', 'node'])
    })

    it('returns empty array for preset without packages', () => {
        const preset = createPreset()
        const result = getPackageNamesPreview(preset)

        expect(result).toEqual([])
    })
})

// ============================================
// Tests: countPresetPackages
// ============================================

describe('countPresetPackages', () => {
    it('counts formulae and casks separately', () => {
        const preset = createPreset({
            packages: {
                formulae: ['git', 'node', 'python'],
                casks: ['firefox', 'chrome'],
            },
        })
        const result = countPresetPackages(preset)

        expect(result.formulae).toBe(3)
        expect(result.casks).toBe(2)
        expect(result.total).toBe(5)
    })

    it('returns zeros for preset without packages', () => {
        const preset = createPreset()
        const result = countPresetPackages(preset)

        expect(result).toEqual({ formulae: 0, casks: 0, total: 0 })
    })

    it('handles macos.homebrew format', () => {
        const preset = createPreset({
            macos: {
                homebrew: {
                    formulae: ['git'],
                    casks: ['firefox'],
                },
            },
        })
        const result = countPresetPackages(preset)

        expect(result.total).toBe(2)
    })
})

// ============================================
// Tests: hasPackages
// ============================================

describe('hasPackages', () => {
    it('returns false for empty config', () => {
        const config = createMinimalConfig()
        expect(hasPackages(config)).toBe(false)
    })

    it('returns true when formulae exist', () => {
        const config = createConfigWithFormulae(['git'])
        expect(hasPackages(config)).toBe(true)
    })

    it('returns true when casks exist', () => {
        const config = createConfigWithCasks(['firefox'])
        expect(hasPackages(config)).toBe(true)
    })

    it('returns true when scripts exist', () => {
        const config: PakkyConfig = {
            name: 'Test',
            version: '1.0.0',
            scripts: [{ name: 'Setup', commands: ['echo "hi"'] }],
        }
        expect(hasPackages(config)).toBe(true)
    })

    it('returns false when arrays are empty', () => {
        const config: PakkyConfig = {
            name: 'Test',
            version: '1.0.0',
            macos: {
                homebrew: {
                    formulae: [],
                    casks: [],
                },
            },
            scripts: [],
        }
        expect(hasPackages(config)).toBe(false)
    })
})

// ============================================
// ERROR CASES - What happens when things go wrong?
// ============================================

describe('error handling', () => {
    describe('parseConfig with invalid inputs', () => {
        it('handles config with undefined macos', () => {
            const config = createMinimalConfig({ macos: undefined })
            const result = parseConfig(config)

            expect(result.packages).toEqual([])
        })

        it('handles config with null homebrew', () => {
            const config: PakkyConfig = {
                name: 'Test',
                version: '1.0.0',
                macos: {
                    homebrew: undefined,
                },
            }
            const result = parseConfig(config)

            expect(result.packages).toEqual([])
        })

        it('handles config with undefined formulae', () => {
            const config: PakkyConfig = {
                name: 'Test',
                version: '1.0.0',
                macos: {
                    homebrew: {
                        formulae: undefined,
                        casks: ['firefox'],
                    },
                },
            }
            const result = parseConfig(config)

            expect(result.packages).toHaveLength(1)
            expect(result.packages[0].type).toBe('cask')
        })

        it('handles config with undefined scripts', () => {
            const config = createMinimalConfig({ scripts: undefined })
            const result = parseConfig(config)

            expect(result.packages).toEqual([])
        })

        it('handles empty string package names', () => {
            const config = createConfigWithFormulae(['', 'git', ''])
            const result = parseConfig(config)

            // Should still parse all, even empty ones
            expect(result.packages).toHaveLength(3)
        })

        it('handles package objects with missing names', () => {
            const config: PakkyConfig = {
                name: 'Test',
                version: '1.0.0',
                macos: {
                    homebrew: {
                        formulae: [
                            { name: '', description: 'No name' },
                        ],
                    },
                },
            }
            const result = parseConfig(config)

            expect(result.packages).toHaveLength(1)
            expect(result.packages[0].name).toBe('')
        })

        it('handles script with empty commands array', () => {
            const config: PakkyConfig = {
                name: 'Test',
                version: '1.0.0',
                scripts: [{ name: 'Empty Script', commands: [] }],
            }
            const result = parseConfig(config)

            expect(result.packages[0].commands).toEqual([])
        })

        it('handles very large number of packages', () => {
            const manyFormulae = Array.from({ length: 1000 }, (_, i) => `pkg${i}`)
            const config = createConfigWithFormulae(manyFormulae)
            const result = parseConfig(config)

            expect(result.packages).toHaveLength(1000)
            expect(result.packages[999].position).toBe(1000)
        })

        it('handles mixed valid and invalid package types', () => {
            const config: PakkyConfig = {
                name: 'Test',
                version: '1.0.0',
                macos: {
                    homebrew: {
                        formulae: ['git', { name: 'node' }],
                        casks: ['firefox', { name: 'chrome' }],
                    },
                },
            }
            const result = parseConfig(config)

            expect(result.packages).toHaveLength(4)
        })
    })

    describe('parsePreset with invalid inputs', () => {
        it('handles preset with undefined packages', () => {
            const preset = createPreset({ packages: undefined })
            const result = parsePreset(preset)

            expect(result).toEqual([])
        })

        it('handles preset with undefined macos', () => {
            const preset = createPreset({ macos: undefined })
            const result = parsePreset(preset)

            expect(result).toEqual([])
        })

        it('handles preset with both packages and macos defined', () => {
            // packages takes precedence over macos
            const preset = createPreset({
                packages: {
                    formulae: ['from-packages'],
                },
                macos: {
                    homebrew: {
                        formulae: ['from-macos'],
                    },
                },
            })
            const result = parsePreset(preset)

            // Should use packages.formulae, not macos.homebrew.formulae
            expect(result).toHaveLength(1)
            expect(result[0].name).toBe('from-packages')
        })

        it('handles preset with empty scripts array', () => {
            const preset = createPreset({ scripts: [] })
            const result = parsePreset(preset)

            expect(result).toEqual([])
        })
    })

    describe('getPackageNamesPreview with invalid inputs', () => {
        it('handles maxItems of 0', () => {
            const preset = createPreset({
                packages: { formulae: ['a', 'b', 'c'] },
            })
            const result = getPackageNamesPreview(preset, 0)

            expect(result).toEqual([])
        })

        it('handles maxItems larger than package count', () => {
            const preset = createPreset({
                packages: { formulae: ['a'] },
            })
            const result = getPackageNamesPreview(preset, 100)

            expect(result).toEqual(['a'])
        })

        it('handles negative maxItems', () => {
            const preset = createPreset({
                packages: { formulae: ['a', 'b', 'c'] },
            })
            const result = getPackageNamesPreview(preset, -5)

            // slice(-5) behavior
            expect(result).toEqual([])
        })
    })

    describe('countPresetPackages with invalid inputs', () => {
        it('handles preset with undefined packages.formulae', () => {
            const preset = createPreset({
                packages: {
                    formulae: undefined,
                    casks: ['firefox'],
                },
            })
            const result = countPresetPackages(preset)

            expect(result.formulae).toBe(0)
            expect(result.casks).toBe(1)
        })

        it('handles preset with undefined packages.casks', () => {
            const preset = createPreset({
                packages: {
                    formulae: ['git'],
                    casks: undefined,
                },
            })
            const result = countPresetPackages(preset)

            expect(result.formulae).toBe(1)
            expect(result.casks).toBe(0)
        })
    })

    describe('hasPackages with edge cases', () => {
        it('handles config with only macos but no homebrew', () => {
            const config: PakkyConfig = {
                name: 'Test',
                version: '1.0.0',
                macos: {},
            }
            expect(hasPackages(config)).toBe(false)
        })

        it('handles config with homebrew but undefined arrays', () => {
            const config: PakkyConfig = {
                name: 'Test',
                version: '1.0.0',
                macos: {
                    homebrew: {
                        formulae: undefined,
                        casks: undefined,
                    },
                },
            }
            expect(hasPackages(config)).toBe(false)
        })
    })
})

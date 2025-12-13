import { describe, it, expect, beforeEach } from 'vitest'
import { useQueueStore, selectPackages, selectPackageCount, selectHasPackages } from './queueStore'
import type { PackageInstallItem } from '../lib/types'
import { act } from '@testing-library/react'

// ============================================
// Test Helpers
// ============================================

function createMockPackage(overrides: Partial<PackageInstallItem> = {}): PackageInstallItem {
    return {
        id: 'formula:test-package',
        name: 'test-package',
        type: 'formula',
        position: 1,
        status: 'pending',
        description: 'Test package',
        logs: [],
        ...overrides,
    }
}

// Reset store before each test
function resetStore() {
    const { getState } = useQueueStore
    act(() => {
        getState().clearPackages()
        getState().clearImportedPackages()
        getState().clearLogs()
    })
}

// ============================================
// Tests
// ============================================

describe('useQueueStore', () => {
    beforeEach(() => {
        resetStore()
    })

    // ----------------------------------------
    // Initial State
    // ----------------------------------------
    describe('initial state', () => {
        it('starts with empty packages', () => {
            const state = useQueueStore.getState()
            expect(state.packages).toEqual([])
        })

        it('starts with empty imported packages', () => {
            const state = useQueueStore.getState()
            expect(state.importedPackages).toEqual([])
        })

        it('starts with hasImportedConfig as false', () => {
            const state = useQueueStore.getState()
            expect(state.hasImportedConfig).toBe(false)
        })

        it('starts with empty logs', () => {
            const state = useQueueStore.getState()
            expect(state.logs).toEqual({})
        })
    })

    // ----------------------------------------
    // Queue Management
    // ----------------------------------------
    describe('setPackages', () => {
        it('sets packages directly', () => {
            const packages = [createMockPackage()]

            act(() => {
                useQueueStore.getState().setPackages(packages)
            })

            expect(useQueueStore.getState().packages).toEqual(packages)
        })
    })

    describe('addPackage', () => {
        it('adds a package to the queue', () => {
            act(() => {
                useQueueStore.getState().addPackage({
                    type: 'formula',
                    name: 'git',
                })
            })

            const { packages } = useQueueStore.getState()
            expect(packages).toHaveLength(1)
            expect(packages[0].name).toBe('git')
        })

        it('does not add duplicate packages', () => {
            act(() => {
                useQueueStore.getState().addPackage({ type: 'formula', name: 'git' })
                useQueueStore.getState().addPackage({ type: 'formula', name: 'git' })
            })

            const { packages } = useQueueStore.getState()
            expect(packages).toHaveLength(1)
        })
    })

    describe('addPackages', () => {
        it('adds multiple packages', () => {
            const packagesToAdd = [
                createMockPackage({ id: 'formula:git', name: 'git' }),
                createMockPackage({ id: 'formula:node', name: 'node' }),
            ]

            act(() => {
                useQueueStore.getState().addPackages(packagesToAdd)
            })

            expect(useQueueStore.getState().packages).toHaveLength(2)
        })

        it('filters duplicates when merging', () => {
            const initial = [createMockPackage({ id: 'formula:git', name: 'git' })]
            const toAdd = [
                createMockPackage({ id: 'formula:git', name: 'git' }),
                createMockPackage({ id: 'formula:node', name: 'node' }),
            ]

            act(() => {
                useQueueStore.getState().setPackages(initial)
                useQueueStore.getState().addPackages(toAdd)
            })

            expect(useQueueStore.getState().packages).toHaveLength(2)
        })
    })

    describe('removePackage', () => {
        it('removes package by id', () => {
            const packages = [
                createMockPackage({ id: 'formula:git' }),
                createMockPackage({ id: 'formula:node', name: 'node' }),
            ]

            act(() => {
                useQueueStore.getState().setPackages(packages)
                useQueueStore.getState().removePackage('formula:git')
            })

            const state = useQueueStore.getState()
            expect(state.packages).toHaveLength(1)
            expect(state.packages[0].id).toBe('formula:node')
        })

        it('removes associated logs when removing package', () => {
            const packages = [createMockPackage({ id: 'formula:git' })]

            act(() => {
                useQueueStore.getState().setPackages(packages)
                useQueueStore.getState().addLog('formula:git', 'log line')
                useQueueStore.getState().removePackage('formula:git')
            })

            expect(useQueueStore.getState().logs).toEqual({})
        })
    })

    describe('clearPackages', () => {
        it('clears all packages', () => {
            act(() => {
                useQueueStore.getState().setPackages([createMockPackage()])
                useQueueStore.getState().clearPackages()
            })

            expect(useQueueStore.getState().packages).toEqual([])
        })

        it('resets hasImportedConfig', () => {
            act(() => {
                useQueueStore.getState().setHasImportedConfig(true)
                useQueueStore.getState().clearPackages()
            })

            expect(useQueueStore.getState().hasImportedConfig).toBe(false)
        })

        it('clears logs', () => {
            act(() => {
                useQueueStore.getState().addLog('formula:git', 'log')
                useQueueStore.getState().clearPackages()
            })

            expect(useQueueStore.getState().logs).toEqual({})
        })
    })

    describe('updatePackage', () => {
        it('updates a specific package', () => {
            const packages = [createMockPackage({ id: 'formula:git', status: 'pending' })]

            act(() => {
                useQueueStore.getState().setPackages(packages)
                useQueueStore.getState().updatePackage('formula:git', { status: 'installing' })
            })

            expect(useQueueStore.getState().packages[0].status).toBe('installing')
        })

        it('does not affect other packages', () => {
            const packages = [
                createMockPackage({ id: 'formula:git', status: 'pending' }),
                createMockPackage({ id: 'formula:node', name: 'node', status: 'pending' }),
            ]

            act(() => {
                useQueueStore.getState().setPackages(packages)
                useQueueStore.getState().updatePackage('formula:git', { status: 'success' })
            })

            expect(useQueueStore.getState().packages[1].status).toBe('pending')
        })
    })

    describe('reorderPackages', () => {
        it('reorders and updates positions', () => {
            const packages = [
                createMockPackage({ id: 'a', position: 1 }),
                createMockPackage({ id: 'b', position: 2 }),
            ]

            act(() => {
                // Reverse order
                useQueueStore.getState().reorderPackages([packages[1], packages[0]])
            })

            const state = useQueueStore.getState()
            expect(state.packages[0].id).toBe('b')
            expect(state.packages[0].position).toBe(1)
            expect(state.packages[1].id).toBe('a')
            expect(state.packages[1].position).toBe(2)
        })
    })

    // ----------------------------------------
    // Import Management
    // ----------------------------------------
    describe('setImportedPackages', () => {
        it('sets imported packages and hasImportedConfig', () => {
            const packages = [createMockPackage()]

            act(() => {
                useQueueStore.getState().setImportedPackages(packages)
            })

            const state = useQueueStore.getState()
            expect(state.importedPackages).toEqual(packages)
            expect(state.hasImportedConfig).toBe(true)
        })

        it('sets hasImportedConfig to false when empty', () => {
            act(() => {
                useQueueStore.getState().setImportedPackages([createMockPackage()])
                useQueueStore.getState().setImportedPackages([])
            })

            expect(useQueueStore.getState().hasImportedConfig).toBe(false)
        })
    })

    describe('clearImportedPackages', () => {
        it('clears imported packages', () => {
            act(() => {
                useQueueStore.getState().setImportedPackages([createMockPackage()])
                useQueueStore.getState().clearImportedPackages()
            })

            const state = useQueueStore.getState()
            expect(state.importedPackages).toEqual([])
            expect(state.hasImportedConfig).toBe(false)
        })
    })

    // ----------------------------------------
    // Log Management
    // ----------------------------------------
    describe('addLog', () => {
        it('adds log to package', () => {
            act(() => {
                useQueueStore.getState().addLog('formula:git', 'Installing...')
            })

            const { logs } = useQueueStore.getState()
            expect(logs['formula:git']).toEqual(['Installing...'])
        })

        it('appends to existing logs', () => {
            act(() => {
                useQueueStore.getState().addLog('formula:git', 'Line 1')
                useQueueStore.getState().addLog('formula:git', 'Line 2')
            })

            const { logs } = useQueueStore.getState()
            expect(logs['formula:git']).toEqual(['Line 1', 'Line 2'])
        })
    })

    describe('clearLogs', () => {
        it('clears logs for specific package', () => {
            act(() => {
                useQueueStore.getState().addLog('formula:git', 'log')
                useQueueStore.getState().addLog('formula:node', 'log')
                useQueueStore.getState().clearLogs('formula:git')
            })

            const { logs } = useQueueStore.getState()
            expect(logs['formula:git']).toBeUndefined()
            expect(logs['formula:node']).toEqual(['log'])
        })

        it('clears all logs when no packageId provided', () => {
            act(() => {
                useQueueStore.getState().addLog('formula:git', 'log')
                useQueueStore.getState().addLog('formula:node', 'log')
                useQueueStore.getState().clearLogs()
            })

            expect(useQueueStore.getState().logs).toEqual({})
        })
    })

    // ----------------------------------------
    // Selectors
    // ----------------------------------------
    describe('selectors', () => {
        it('selectPackages returns packages', () => {
            const packages = [createMockPackage()]
            act(() => {
                useQueueStore.getState().setPackages(packages)
            })

            expect(selectPackages(useQueueStore.getState())).toEqual(packages)
        })

        it('selectPackageCount returns correct count', () => {
            act(() => {
                useQueueStore.getState().setPackages([
                    createMockPackage({ id: 'a' }),
                    createMockPackage({ id: 'b' }),
                ])
            })

            expect(selectPackageCount(useQueueStore.getState())).toBe(2)
        })

        it('selectHasPackages returns true when packages exist', () => {
            act(() => {
                useQueueStore.getState().setPackages([createMockPackage()])
            })

            expect(selectHasPackages(useQueueStore.getState())).toBe(true)
        })

        it('selectHasPackages returns false when no packages', () => {
            expect(selectHasPackages(useQueueStore.getState())).toBe(false)
        })
    })

    // ----------------------------------------
    // Initialization
    // ----------------------------------------
    describe('initFromUserConfig', () => {
        it('initializes packages from user config', () => {
            const queue = [createMockPackage({ id: 'formula:saved' })]

            act(() => {
                useQueueStore.getState().initFromUserConfig(queue)
            })

            expect(useQueueStore.getState().packages).toHaveLength(1)
            expect(useQueueStore.getState().packages[0].id).toBe('formula:saved')
        })

        it('does nothing with empty queue', () => {
            act(() => {
                useQueueStore.getState().setPackages([createMockPackage()])
                useQueueStore.getState().initFromUserConfig([])
            })

            expect(useQueueStore.getState().packages).toHaveLength(1)
        })
    })

    // ----------------------------------------
    // ERROR CASES - What happens when things go wrong?
    // ----------------------------------------
    describe('error handling', () => {
        describe('setPackages with edge cases', () => {
            it('handles empty array', () => {
                act(() => {
                    useQueueStore.getState().setPackages([createMockPackage()])
                    useQueueStore.getState().setPackages([])
                })

                expect(useQueueStore.getState().packages).toEqual([])
            })

            it('handles packages with undefined fields', () => {
                const badPackage = {
                    ...createMockPackage(),
                    description: undefined,
                    logs: undefined,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any

                act(() => {
                    useQueueStore.getState().setPackages([badPackage])
                })

                expect(useQueueStore.getState().packages).toHaveLength(1)
            })
        })

        describe('addPackage with edge cases', () => {
            it('handles empty name', () => {
                act(() => {
                    useQueueStore.getState().addPackage({
                        type: 'formula',
                        name: '',
                    })
                })

                const { packages } = useQueueStore.getState()
                expect(packages).toHaveLength(1)
                expect(packages[0].name).toBe('')
            })

            it('handles whitespace-only name', () => {
                act(() => {
                    useQueueStore.getState().addPackage({
                        type: 'formula',
                        name: '   ',
                    })
                })

                expect(useQueueStore.getState().packages).toHaveLength(1)
            })
        })

        describe('removePackage with edge cases', () => {
            it('handles removing non-existent package', () => {
                act(() => {
                    useQueueStore.getState().setPackages([createMockPackage()])
                    useQueueStore.getState().removePackage('non-existent-id')
                })

                // Should not crash, should keep existing
                expect(useQueueStore.getState().packages).toHaveLength(1)
            })

            it('handles removing from empty queue', () => {
                act(() => {
                    useQueueStore.getState().removePackage('formula:git')
                })

                expect(useQueueStore.getState().packages).toEqual([])
            })

            it('handles empty id string', () => {
                act(() => {
                    useQueueStore.getState().setPackages([createMockPackage()])
                    useQueueStore.getState().removePackage('')
                })

                // Should not remove anything
                expect(useQueueStore.getState().packages).toHaveLength(1)
            })
        })

        describe('updatePackage with edge cases', () => {
            it('handles updating non-existent package', () => {
                act(() => {
                    useQueueStore.getState().setPackages([createMockPackage()])
                    useQueueStore.getState().updatePackage('non-existent', { status: 'success' })
                })

                // Should not crash
                expect(useQueueStore.getState().packages[0].status).toBe('pending')
            })

            it('handles empty updates object', () => {
                const original = createMockPackage({ id: 'a' })

                act(() => {
                    useQueueStore.getState().setPackages([original])
                    useQueueStore.getState().updatePackage('a', {})
                })

                expect(useQueueStore.getState().packages[0]).toMatchObject(original)
            })
        })

        describe('addPackages with edge cases', () => {
            it('handles empty array', () => {
                act(() => {
                    useQueueStore.getState().setPackages([createMockPackage()])
                    useQueueStore.getState().addPackages([])
                })

                expect(useQueueStore.getState().packages).toHaveLength(1)
            })
        })

        describe('reorderPackages with edge cases', () => {
            it('handles empty array', () => {
                act(() => {
                    useQueueStore.getState().setPackages([createMockPackage()])
                    useQueueStore.getState().reorderPackages([])
                })

                expect(useQueueStore.getState().packages).toEqual([])
            })

            it('handles single package', () => {
                const pkg = createMockPackage({ id: 'a' })

                act(() => {
                    useQueueStore.getState().reorderPackages([pkg])
                })

                expect(useQueueStore.getState().packages).toHaveLength(1)
                expect(useQueueStore.getState().packages[0].position).toBe(1)
            })
        })

        describe('addLog with edge cases', () => {
            it('handles empty log message', () => {
                act(() => {
                    useQueueStore.getState().addLog('formula:git', '')
                })

                expect(useQueueStore.getState().logs['formula:git']).toEqual([''])
            })

            it('handles very long log message', () => {
                const longMessage = 'a'.repeat(10000)

                act(() => {
                    useQueueStore.getState().addLog('formula:git', longMessage)
                })

                expect(useQueueStore.getState().logs['formula:git'][0]).toHaveLength(10000)
            })

            it('handles special characters in log', () => {
                const specialLog = '\\n\\t\\r\n\t\r<script>alert("xss")</script>'

                act(() => {
                    useQueueStore.getState().addLog('formula:git', specialLog)
                })

                expect(useQueueStore.getState().logs['formula:git']).toContain(specialLog)
            })
        })

        describe('clearLogs with edge cases', () => {
            it('handles clearing non-existent package logs', () => {
                act(() => {
                    useQueueStore.getState().addLog('formula:git', 'log')
                    useQueueStore.getState().clearLogs('non-existent')
                })

                // Should not crash, should keep existing logs
                expect(useQueueStore.getState().logs['formula:git']).toEqual(['log'])
            })
        })

        describe('initFromUserConfig with edge cases', () => {
            it('handles undefined queue', () => {
                act(() => {
                    useQueueStore.getState().setPackages([createMockPackage()])
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    useQueueStore.getState().initFromUserConfig(undefined as any)
                })

                // Should not crash, should keep existing (if undefined treated as empty)
                expect(useQueueStore.getState().packages).toHaveLength(1)
            })
        })

        describe('large-scale operations', () => {
            it('handles adding 1000 packages', () => {
                const manyPackages = Array.from({ length: 1000 }, (_, i) =>
                    createMockPackage({ id: `formula:pkg${i}`, name: `pkg${i}` })
                )

                act(() => {
                    useQueueStore.getState().addPackages(manyPackages)
                })

                expect(useQueueStore.getState().packages).toHaveLength(1000)
            })

            it('handles rapid state changes', () => {
                act(() => {
                    for (let i = 0; i < 100; i++) {
                        useQueueStore.getState().addPackage({ type: 'formula', name: `pkg${i}` })
                    }
                })

                expect(useQueueStore.getState().packages).toHaveLength(100)
            })
        })
    })
})

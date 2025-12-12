import { describe, it, expect, beforeEach } from 'vitest'
import { useInstallStore } from './installStore'
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

function resetStore() {
    act(() => {
        useInstallStore.getState().reset()
    })
}

// ============================================
// Tests
// ============================================

describe('useInstallStore', () => {
    beforeEach(() => {
        resetStore()
    })

    // ----------------------------------------
    // Initial State
    // ----------------------------------------
    describe('initial state', () => {
        it('starts with idle status', () => {
            const state = useInstallStore.getState()
            expect(state.progress.status).toBe('idle')
        })

        it('starts with empty packages', () => {
            const state = useInstallStore.getState()
            expect(state.progress.packages).toEqual([])
        })

        it('starts with zero counts', () => {
            const state = useInstallStore.getState()
            expect(state.progress.totalPackages).toBe(0)
            expect(state.progress.completedPackages).toBe(0)
            expect(state.progress.failedPackages).toBe(0)
            expect(state.progress.skippedPackages).toBe(0)
        })

        it('starts with no config', () => {
            const state = useInstallStore.getState()
            expect(state.config).toBeNull()
        })

        it('starts with empty userInputValues', () => {
            const state = useInstallStore.getState()
            expect(state.userInputValues).toEqual({})
        })
    })

    // ----------------------------------------
    // Config Management
    // ----------------------------------------
    describe('setConfig', () => {
        it('sets the config', () => {
            const config = { name: 'Test', version: '1.0.0' }

            act(() => {
                useInstallStore.getState().setConfig(config as any)
            })

            expect(useInstallStore.getState().config).toEqual(config)
        })

        it('can clear config with null', () => {
            act(() => {
                useInstallStore.getState().setConfig({ name: 'Test', version: '1.0.0' } as any)
                useInstallStore.getState().setConfig(null)
            })

            expect(useInstallStore.getState().config).toBeNull()
        })
    })

    // ----------------------------------------
    // Installation Status
    // ----------------------------------------
    describe('startInstallation', () => {
        it('sets status to installing', () => {
            act(() => {
                useInstallStore.getState().startInstallation()
            })

            expect(useInstallStore.getState().progress.status).toBe('installing')
        })

        it('resets counts to zero', () => {
            act(() => {
                // Set some counts first
                useInstallStore.getState().setPackages([
                    createMockPackage({ status: 'success' }),
                    createMockPackage({ id: 'b', status: 'failed' }),
                ])
                useInstallStore.getState().startInstallation()
            })

            const { progress } = useInstallStore.getState()
            expect(progress.completedPackages).toBe(0)
            expect(progress.failedPackages).toBe(0)
            expect(progress.skippedPackages).toBe(0)
        })
    })

    describe('cancelInstallation', () => {
        it('sets status to cancelled', () => {
            act(() => {
                useInstallStore.getState().startInstallation()
                useInstallStore.getState().cancelInstallation()
            })

            expect(useInstallStore.getState().progress.status).toBe('cancelled')
        })

        it('clears currentPackage', () => {
            act(() => {
                useInstallStore.getState().setCurrentPackage('formula:git')
                useInstallStore.getState().cancelInstallation()
            })

            expect(useInstallStore.getState().progress.currentPackage).toBeUndefined()
        })
    })

    describe('completeInstallation', () => {
        it('sets status to completed', () => {
            act(() => {
                useInstallStore.getState().startInstallation()
                useInstallStore.getState().completeInstallation()
            })

            expect(useInstallStore.getState().progress.status).toBe('completed')
        })

        it('clears currentPackage', () => {
            act(() => {
                useInstallStore.getState().setCurrentPackage('formula:git')
                useInstallStore.getState().completeInstallation()
            })

            expect(useInstallStore.getState().progress.currentPackage).toBeUndefined()
        })
    })

    // ----------------------------------------
    // Package Updates
    // ----------------------------------------
    describe('setPackages', () => {
        it('sets packages and updates totalPackages', () => {
            const packages = [
                createMockPackage({ id: 'a' }),
                createMockPackage({ id: 'b' }),
            ]

            act(() => {
                useInstallStore.getState().setPackages(packages)
            })

            const { progress } = useInstallStore.getState()
            expect(progress.packages).toHaveLength(2)
            expect(progress.totalPackages).toBe(2)
        })

        it('calculates counts from package statuses', () => {
            const packages = [
                createMockPackage({ id: 'a', status: 'success' }),
                createMockPackage({ id: 'b', status: 'already_installed' }),
                createMockPackage({ id: 'c', status: 'failed' }),
                createMockPackage({ id: 'd', status: 'skipped' }),
                createMockPackage({ id: 'e', status: 'pending' }),
            ]

            act(() => {
                useInstallStore.getState().setPackages(packages)
            })

            const { progress } = useInstallStore.getState()
            expect(progress.completedPackages).toBe(2) // success + already_installed
            expect(progress.failedPackages).toBe(1)
            expect(progress.skippedPackages).toBe(1)
        })
    })

    describe('updatePackageStatus', () => {
        beforeEach(() => {
            act(() => {
                useInstallStore.getState().setPackages([
                    createMockPackage({ id: 'formula:git', status: 'pending' }),
                ])
            })
        })

        it('updates package status', () => {
            act(() => {
                useInstallStore.getState().updatePackageStatus('formula:git', 'installing')
            })

            const pkg = useInstallStore.getState().progress.packages[0]
            expect(pkg.status).toBe('installing')
        })

        it('sets startTime when status is installing', () => {
            const before = Date.now()

            act(() => {
                useInstallStore.getState().updatePackageStatus('formula:git', 'installing')
            })

            const pkg = useInstallStore.getState().progress.packages[0]
            expect(pkg.startTime).toBeGreaterThanOrEqual(before)
        })

        it('sets endTime when status is terminal', () => {
            const before = Date.now()

            act(() => {
                useInstallStore.getState().updatePackageStatus('formula:git', 'success')
            })

            const pkg = useInstallStore.getState().progress.packages[0]
            expect(pkg.endTime).toBeGreaterThanOrEqual(before)
        })

        it('includes error when provided', () => {
            act(() => {
                useInstallStore.getState().updatePackageStatus('formula:git', 'failed', 'Package not found')
            })

            const pkg = useInstallStore.getState().progress.packages[0]
            expect(pkg.error).toBe('Package not found')
        })

        it('recalculates counts after status update', () => {
            act(() => {
                useInstallStore.getState().updatePackageStatus('formula:git', 'success')
            })

            expect(useInstallStore.getState().progress.completedPackages).toBe(1)
        })
    })

    describe('addPackageLog', () => {
        beforeEach(() => {
            act(() => {
                useInstallStore.getState().setPackages([
                    createMockPackage({ id: 'formula:git', logs: [] }),
                ])
            })
        })

        it('adds log to package', () => {
            act(() => {
                useInstallStore.getState().addPackageLog('formula:git', 'Installing...')
            })

            const pkg = useInstallStore.getState().progress.packages[0]
            expect(pkg.logs).toContain('Installing...')
        })

        it('appends to existing logs', () => {
            act(() => {
                useInstallStore.getState().addPackageLog('formula:git', 'Line 1')
                useInstallStore.getState().addPackageLog('formula:git', 'Line 2')
            })

            const pkg = useInstallStore.getState().progress.packages[0]
            expect(pkg.logs).toEqual(['Line 1', 'Line 2'])
        })

        it('trims logs when exceeding max', () => {
            // Add many logs (max is 500 per INSTALL.MAX_LOGS_PER_PACKAGE)
            act(() => {
                for (let i = 0; i < 550; i++) {
                    useInstallStore.getState().addPackageLog('formula:git', `Line ${i}`)
                }
            })

            const pkg = useInstallStore.getState().progress.packages[0]
            // Should have trimmed to max (500)
            expect(pkg.logs.length).toBeLessThanOrEqual(500)
            // Last log should be the most recent
            expect(pkg.logs[pkg.logs.length - 1]).toBe('Line 549')
        })
    })

    describe('setCurrentPackage', () => {
        it('sets current package', () => {
            act(() => {
                useInstallStore.getState().setCurrentPackage('formula:git')
            })

            expect(useInstallStore.getState().progress.currentPackage).toBe('formula:git')
        })

        it('can clear current package', () => {
            act(() => {
                useInstallStore.getState().setCurrentPackage('formula:git')
                useInstallStore.getState().setCurrentPackage(undefined)
            })

            expect(useInstallStore.getState().progress.currentPackage).toBeUndefined()
        })
    })

    // ----------------------------------------
    // User Input
    // ----------------------------------------
    describe('setUserInputValues', () => {
        it('sets all user input values', () => {
            act(() => {
                useInstallStore.getState().setUserInputValues({ email: 'test@test.com', name: 'Test' })
            })

            expect(useInstallStore.getState().userInputValues).toEqual({
                email: 'test@test.com',
                name: 'Test',
            })
        })
    })

    describe('setUserInputValue', () => {
        it('sets a single user input value', () => {
            act(() => {
                useInstallStore.getState().setUserInputValue('email', 'test@test.com')
            })

            expect(useInstallStore.getState().userInputValues.email).toBe('test@test.com')
        })

        it('preserves other values', () => {
            act(() => {
                useInstallStore.getState().setUserInputValues({ existing: 'value' })
                useInstallStore.getState().setUserInputValue('new', 'newvalue')
            })

            const { userInputValues } = useInstallStore.getState()
            expect(userInputValues.existing).toBe('value')
            expect(userInputValues.new).toBe('newvalue')
        })
    })

    // ----------------------------------------
    // Reset
    // ----------------------------------------
    describe('reset', () => {
        it('resets all state to initial values', () => {
            act(() => {
                // Set up some state
                useInstallStore.getState().setConfig({ name: 'Test', version: '1.0.0' } as any)
                useInstallStore.getState().setPackages([createMockPackage()])
                useInstallStore.getState().setUserInputValues({ key: 'value' })
                useInstallStore.getState().startInstallation()

                // Reset
                useInstallStore.getState().reset()
            })

            const state = useInstallStore.getState()
            expect(state.progress.status).toBe('idle')
            expect(state.progress.packages).toEqual([])
            expect(state.config).toBeNull()
            expect(state.userInputValues).toEqual({})
        })
    })

    // ----------------------------------------
    // ERROR CASES - What happens when things go wrong?
    // ----------------------------------------
    describe('error handling', () => {
        describe('setPackages with edge cases', () => {
            it('handles empty array', () => {
                act(() => {
                    useInstallStore.getState().setPackages([createMockPackage()])
                    useInstallStore.getState().setPackages([])
                })

                expect(useInstallStore.getState().progress.packages).toEqual([])
                expect(useInstallStore.getState().progress.totalPackages).toBe(0)
            })

            it('handles packages with undefined status', () => {
                const badPackage = { ...createMockPackage(), status: undefined as any }

                act(() => {
                    useInstallStore.getState().setPackages([badPackage])
                })

                expect(useInstallStore.getState().progress.packages).toHaveLength(1)
            })

            it('handles packages with invalid status', () => {
                const badPackage = { ...createMockPackage(), status: 'invalid_status' as any }

                act(() => {
                    useInstallStore.getState().setPackages([badPackage])
                })

                expect(useInstallStore.getState().progress.packages).toHaveLength(1)
            })
        })

        describe('updatePackageStatus with edge cases', () => {
            beforeEach(() => {
                act(() => {
                    useInstallStore.getState().setPackages([
                        createMockPackage({ id: 'formula:git', status: 'pending' }),
                    ])
                })
            })

            it('handles updating non-existent package', () => {
                act(() => {
                    useInstallStore.getState().updatePackageStatus('non-existent', 'success')
                })

                // Should not crash
                expect(useInstallStore.getState().progress.packages[0].status).toBe('pending')
            })

            it('handles empty package id', () => {
                act(() => {
                    useInstallStore.getState().updatePackageStatus('', 'success')
                })

                // Should not crash
                expect(useInstallStore.getState().progress.packages[0].status).toBe('pending')
            })

            it('handles undefined error message', () => {
                act(() => {
                    useInstallStore.getState().updatePackageStatus('formula:git', 'failed', undefined)
                })

                const pkg = useInstallStore.getState().progress.packages[0]
                expect(pkg.status).toBe('failed')
                expect(pkg.error).toBeUndefined()
            })

            it('handles empty error message', () => {
                act(() => {
                    useInstallStore.getState().updatePackageStatus('formula:git', 'failed', '')
                })

                const pkg = useInstallStore.getState().progress.packages[0]
                expect(pkg.error).toBe('')
            })
        })

        describe('addPackageLog with edge cases', () => {
            beforeEach(() => {
                act(() => {
                    useInstallStore.getState().setPackages([
                        createMockPackage({ id: 'formula:git', logs: [] }),
                    ])
                })
            })

            it('handles adding log to non-existent package', () => {
                act(() => {
                    useInstallStore.getState().addPackageLog('non-existent', 'log message')
                })

                // Should not crash
                expect(useInstallStore.getState().progress.packages[0].logs).toEqual([])
            })

            it('handles empty log message', () => {
                act(() => {
                    useInstallStore.getState().addPackageLog('formula:git', '')
                })

                expect(useInstallStore.getState().progress.packages[0].logs).toEqual([''])
            })

            it('handles very long log message', () => {
                const longLog = 'a'.repeat(10000)

                act(() => {
                    useInstallStore.getState().addPackageLog('formula:git', longLog)
                })

                expect(useInstallStore.getState().progress.packages[0].logs[0]).toHaveLength(10000)
            })

            it('handles special characters in log', () => {
                const specialLog = '<script>alert("xss")</script>\n\t\r'

                act(() => {
                    useInstallStore.getState().addPackageLog('formula:git', specialLog)
                })

                expect(useInstallStore.getState().progress.packages[0].logs).toContain(specialLog)
            })
        })

        describe('setUserInputValue with edge cases', () => {
            it('handles empty key', () => {
                act(() => {
                    useInstallStore.getState().setUserInputValue('', 'value')
                })

                expect(useInstallStore.getState().userInputValues['']).toBe('value')
            })

            it('handles empty value', () => {
                act(() => {
                    useInstallStore.getState().setUserInputValue('key', '')
                })

                expect(useInstallStore.getState().userInputValues.key).toBe('')
            })

            it('handles special characters in key', () => {
                act(() => {
                    useInstallStore.getState().setUserInputValue('key.with.dots', 'value')
                })

                expect(useInstallStore.getState().userInputValues['key.with.dots']).toBe('value')
            })

            it('handles overwriting existing value', () => {
                act(() => {
                    useInstallStore.getState().setUserInputValue('key', 'old')
                    useInstallStore.getState().setUserInputValue('key', 'new')
                })

                expect(useInstallStore.getState().userInputValues.key).toBe('new')
            })
        })

        describe('setUserInputValues with edge cases', () => {
            it('handles empty object', () => {
                act(() => {
                    useInstallStore.getState().setUserInputValues({ existing: 'value' })
                    useInstallStore.getState().setUserInputValues({})
                })

                // Empty object replaces existing
                expect(useInstallStore.getState().userInputValues).toEqual({})
            })
        })

        describe('workflow edge cases', () => {
            it('handles starting installation twice', () => {
                act(() => {
                    useInstallStore.getState().startInstallation()
                    useInstallStore.getState().startInstallation()
                })

                expect(useInstallStore.getState().progress.status).toBe('installing')
            })

            it('handles cancelling when not installing', () => {
                act(() => {
                    useInstallStore.getState().cancelInstallation()
                })

                expect(useInstallStore.getState().progress.status).toBe('cancelled')
            })

            it('handles completing when not installing', () => {
                act(() => {
                    useInstallStore.getState().completeInstallation()
                })

                expect(useInstallStore.getState().progress.status).toBe('completed')
            })

            it('handles reset during installation', () => {
                act(() => {
                    useInstallStore.getState().setPackages([createMockPackage()])
                    useInstallStore.getState().startInstallation()
                    useInstallStore.getState().reset()
                })

                expect(useInstallStore.getState().progress.status).toBe('idle')
                expect(useInstallStore.getState().progress.packages).toEqual([])
            })
        })

        describe('large-scale operations', () => {
            it('handles 1000 packages', () => {
                const manyPackages = Array.from({ length: 1000 }, (_, i) =>
                    createMockPackage({ id: `formula:pkg${i}`, name: `pkg${i}` })
                )

                act(() => {
                    useInstallStore.getState().setPackages(manyPackages)
                })

                expect(useInstallStore.getState().progress.packages).toHaveLength(1000)
                expect(useInstallStore.getState().progress.totalPackages).toBe(1000)
            })

            it('handles rapid status updates', () => {
                act(() => {
                    useInstallStore.getState().setPackages([
                        createMockPackage({ id: 'formula:git' }),
                    ])

                    for (let i = 0; i < 100; i++) {
                        useInstallStore.getState().updatePackageStatus('formula:git', 'installing')
                        useInstallStore.getState().updatePackageStatus('formula:git', 'pending')
                    }
                    useInstallStore.getState().updatePackageStatus('formula:git', 'success')
                })

                expect(useInstallStore.getState().progress.packages[0].status).toBe('success')
            })
        })
    })
})

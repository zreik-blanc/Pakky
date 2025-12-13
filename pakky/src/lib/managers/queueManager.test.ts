import { describe, it, expect, beforeEach } from 'vitest'
import { QueueManager, type CreatePackageParams } from './queueManager'
import type { PackageInstallItem } from '../types'

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

function createMockParams(overrides: Partial<CreatePackageParams> = {}): CreatePackageParams {
    return {
        type: 'formula',
        name: 'test-package',
        ...overrides,
    }
}

// ============================================
// Tests
// ============================================

describe('QueueManager', () => {
    // ----------------------------------------
    // ID Generation
    // ----------------------------------------
    describe('generateId', () => {
        it('generates id in type:name format for formulae', () => {
            const id = QueueManager.generateId('formula', 'git')
            expect(id).toBe('formula:git')
        })

        it('generates id in type:name format for casks', () => {
            const id = QueueManager.generateId('cask', 'Visual Studio Code')
            expect(id).toBe('cask:visual-studio-code')
        })

        it('generates unique ids for scripts with timestamp', () => {
            const id1 = QueueManager.generateId('script', 'setup')
            const id2 = QueueManager.generateId('script', 'setup')

            expect(id1).toMatch(/^script:setup-\d+-[a-z0-9]+$/)
            expect(id2).toMatch(/^script:setup-\d+-[a-z0-9]+$/)
            expect(id1).not.toBe(id2)
        })

        it('normalizes whitespace in names', () => {
            const id = QueueManager.generateId('formula', '  git  hub  ')
            // Multiple spaces become single hyphen due to regex replace
            expect(id).toBe('formula:git-hub')
        })

        it('converts names to lowercase', () => {
            const id = QueueManager.generateId('cask', 'Firefox')
            expect(id).toBe('cask:firefox')
        })
    })

    // ----------------------------------------
    // Item Creation
    // ----------------------------------------
    describe('createItem', () => {
        it('creates a formula with correct defaults', () => {
            const item = QueueManager.createItem({
                type: 'formula',
                name: 'git',
            })

            expect(item).toMatchObject({
                id: 'formula:git',
                name: 'git',
                type: 'formula',
                status: 'pending',
                description: 'CLI tool',
                logs: [],
            })
        })

        it('creates a cask with correct defaults', () => {
            const item = QueueManager.createItem({
                type: 'cask',
                name: 'firefox',
            })

            expect(item.description).toBe('Application')
        })

        it('creates a script with correct defaults', () => {
            const item = QueueManager.createItem({
                type: 'script',
                name: 'setup',
            })

            expect(item.description).toBe('Custom script')
        })

        it('creates a mas app with correct defaults', () => {
            const item = QueueManager.createItem({
                type: 'mas',
                name: 'Xcode',
            })

            expect(item.description).toBe('Mac App Store app')
        })

        it('respects provided description', () => {
            const item = QueueManager.createItem({
                type: 'formula',
                name: 'git',
                description: 'Version control system',
            })

            expect(item.description).toBe('Version control system')
        })

        it('sets status to already_installed when installed flag is true', () => {
            const item = QueueManager.createItem({
                type: 'formula',
                name: 'git',
                installed: true,
            })

            expect(item.status).toBe('already_installed')
        })

        it('includes optional properties when provided', () => {
            const item = QueueManager.createItem({
                type: 'cask',
                name: 'vscode',
                version: '1.85.0',
                required: true,
                postInstall: ['echo "done"'],
                extensions: ['eslint'],
            })

            expect(item.version).toBe('1.85.0')
            expect(item.required).toBe(true)
            expect(item.postInstall).toEqual(['echo "done"'])
            expect(item.extensions).toEqual(['eslint'])
        })
    })

    // ----------------------------------------
    // Duplicate Detection
    // ----------------------------------------
    describe('isDuplicate', () => {
        it('returns true when package with same id exists', () => {
            const packages = [createMockPackage({ id: 'formula:git' })]
            expect(QueueManager.isDuplicate(packages, 'formula:git')).toBe(true)
        })

        it('returns false when package with id does not exist', () => {
            const packages = [createMockPackage({ id: 'formula:git' })]
            expect(QueueManager.isDuplicate(packages, 'formula:node')).toBe(false)
        })

        it('returns false for empty array', () => {
            expect(QueueManager.isDuplicate([], 'formula:git')).toBe(false)
        })
    })

    describe('isDuplicateByTypeAndName', () => {
        it('returns true when package with same type and name exists', () => {
            const packages = [createMockPackage({ type: 'formula', name: 'git' })]
            expect(QueueManager.isDuplicateByTypeAndName(packages, 'formula', 'git')).toBe(true)
        })

        it('is case-insensitive', () => {
            const packages = [createMockPackage({ type: 'formula', name: 'Git' })]
            expect(QueueManager.isDuplicateByTypeAndName(packages, 'formula', 'GIT')).toBe(true)
        })

        it('trims whitespace', () => {
            const packages = [createMockPackage({ type: 'formula', name: 'git' })]
            expect(QueueManager.isDuplicateByTypeAndName(packages, 'formula', '  git  ')).toBe(true)
        })

        it('returns false for different types with same name', () => {
            const packages = [createMockPackage({ type: 'formula', name: 'node' })]
            expect(QueueManager.isDuplicateByTypeAndName(packages, 'cask', 'node')).toBe(false)
        })
    })

    // ----------------------------------------
    // Queue Operations
    // ----------------------------------------
    describe('reindex', () => {
        it('assigns sequential positions starting from 1', () => {
            const packages = [
                createMockPackage({ id: 'a', position: undefined }),
                createMockPackage({ id: 'b', position: undefined }),
                createMockPackage({ id: 'c', position: undefined }),
            ]

            const result = QueueManager.reindex(packages)

            expect(result[0].position).toBe(1)
            expect(result[1].position).toBe(2)
            expect(result[2].position).toBe(3)
        })

        it('sorts by existing positions before reindexing', () => {
            const packages = [
                createMockPackage({ id: 'a', position: 30 }),
                createMockPackage({ id: 'b', position: 10 }),
                createMockPackage({ id: 'c', position: 20 }),
            ]

            const result = QueueManager.reindex(packages)

            // Sorts by position ascending: b(10), c(20), a(30) -> positions 1, 2, 3
            expect(result[0].id).toBe('b')
            expect(result[1].id).toBe('c')
            expect(result[2].id).toBe('a')
            expect(result.map(p => p.position)).toEqual([1, 2, 3])
        })

        it('handles empty array', () => {
            const result = QueueManager.reindex([])
            expect(result).toEqual([])
        })

        it('maintains order when positions are undefined', () => {
            const packages = [
                createMockPackage({ id: 'first', position: undefined }),
                createMockPackage({ id: 'second', position: undefined }),
            ]

            const result = QueueManager.reindex(packages)

            expect(result[0].id).toBe('first')
            expect(result[1].id).toBe('second')
        })
    })

    describe('add', () => {
        it('adds a package to an empty queue', () => {
            const result = QueueManager.add([], createMockParams({ name: 'git' }))

            expect(result.added).toHaveLength(1)
            expect(result.added[0].name).toBe('git')
            expect(result.added[0].position).toBe(1)
            expect(result.duplicates).toHaveLength(0)
        })

        it('adds a package with correct position after existing packages', () => {
            const existing = [
                createMockPackage({ position: 1 }),
                createMockPackage({ position: 2, id: 'formula:node', name: 'node' }),
            ]

            const result = QueueManager.add(existing, createMockParams({ name: 'curl' }))

            expect(result.added[0].position).toBe(3)
        })

        it('rejects duplicate non-script packages', () => {
            const existing = [createMockPackage({ type: 'formula', name: 'git' })]

            const result = QueueManager.add(existing, createMockParams({ type: 'formula', name: 'git' }))

            expect(result.added).toHaveLength(0)
            expect(result.duplicates).toContain('formula:git')
        })

        it('allows duplicate scripts', () => {
            const existing = [createMockPackage({ type: 'script', name: 'setup', id: 'script:setup-123' })]

            const result = QueueManager.add(existing, createMockParams({ type: 'script', name: 'setup' }))

            expect(result.added).toHaveLength(1)
            expect(result.duplicates).toHaveLength(0)
        })
    })

    describe('addMultiple', () => {
        it('adds multiple packages with correct positions', () => {
            const toAdd = [
                createMockPackage({ id: 'formula:git', name: 'git', position: 1 }),
                createMockPackage({ id: 'formula:node', name: 'node', position: 2 }),
            ]

            const result = QueueManager.addMultiple([], toAdd)

            expect(result.added).toHaveLength(2)
            expect(result.added[0].position).toBe(1)
            expect(result.added[1].position).toBe(2)
        })

        it('continues position from existing queue', () => {
            const existing = [createMockPackage({ position: 1 })]
            const toAdd = [
                createMockPackage({ id: 'formula:git', name: 'git', position: 1 }),
            ]

            const result = QueueManager.addMultiple(existing, toAdd)

            expect(result.added[0].position).toBe(2)
        })

        it('filters out duplicates', () => {
            const existing = [createMockPackage({ id: 'formula:git' })]
            const toAdd = [
                createMockPackage({ id: 'formula:git', name: 'git' }),
                createMockPackage({ id: 'formula:node', name: 'node' }),
            ]

            const result = QueueManager.addMultiple(existing, toAdd)

            expect(result.added).toHaveLength(1)
            expect(result.added[0].id).toBe('formula:node')
            expect(result.duplicates).toContain('formula:git')
        })

        it('filters duplicates within the toAdd array itself', () => {
            const toAdd = [
                createMockPackage({ id: 'formula:git', name: 'git' }),
                createMockPackage({ id: 'formula:git', name: 'git' }),
            ]

            const result = QueueManager.addMultiple([], toAdd)

            expect(result.added).toHaveLength(1)
            expect(result.duplicates).toContain('formula:git')
        })
    })

    describe('remove', () => {
        it('removes package by id', () => {
            const packages = [
                createMockPackage({ id: 'formula:git', position: 1 }),
                createMockPackage({ id: 'formula:node', position: 2 }),
            ]

            const result = QueueManager.remove(packages, 'formula:git')

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('formula:node')
        })

        it('reindexes positions after removal', () => {
            const packages = [
                createMockPackage({ id: 'a', position: 1 }),
                createMockPackage({ id: 'b', position: 2 }),
                createMockPackage({ id: 'c', position: 3 }),
            ]

            const result = QueueManager.remove(packages, 'b')

            expect(result[0].position).toBe(1)
            expect(result[1].position).toBe(2)
        })

        it('returns unchanged array if id not found', () => {
            const packages = [createMockPackage({ id: 'formula:git' })]

            const result = QueueManager.remove(packages, 'nonexistent')

            expect(result).toHaveLength(1)
        })
    })

    describe('move', () => {
        let packages: PackageInstallItem[]

        beforeEach(() => {
            packages = [
                createMockPackage({ id: 'a', name: 'a', position: 1 }),
                createMockPackage({ id: 'b', name: 'b', position: 2 }),
                createMockPackage({ id: 'c', name: 'c', position: 3 }),
            ]
        })

        it('moves package to a new position', () => {
            // Moving 'c' from position 3 to position 1
            const result = QueueManager.move(packages, 'c', 1)

            // After move and reindex, c is first
            expect(result[0].id).toBe('c')
            expect(result[1].id).toBe('a')
            expect(result[2].id).toBe('b')
        })

        it('reindexes after moving', () => {
            const result = QueueManager.move(packages, 'c', 1)

            expect(result.map(p => p.position)).toEqual([1, 2, 3])
        })

        it('clamps position to valid range (too low)', () => {
            // Position 0 clamps to 1, so 'c' should move to first position
            const result = QueueManager.move(packages, 'c', 0)

            expect(result[0].id).toBe('c')
        })

        it('clamps position to valid range (too high)', () => {
            // Position 100 clamps to 3 (array length), so 'a' stays at last
            const result = QueueManager.move(packages, 'a', 100)

            expect(result[2].id).toBe('a')
        })

        it('returns unchanged if package not found', () => {
            const result = QueueManager.move(packages, 'nonexistent', 1)

            expect(result).toEqual(packages)
        })

        it('returns unchanged if moving to same position', () => {
            const result = QueueManager.move(packages, 'b', 2)

            expect(result[1].id).toBe('b')
        })
    })

    describe('merge', () => {
        it('returns existing when incoming is empty', () => {
            const existing = [createMockPackage()]

            const result = QueueManager.merge(existing, [])

            expect(result).toBe(existing)
        })

        it('returns incoming when existing is empty', () => {
            const incoming = [createMockPackage()]

            const result = QueueManager.merge([], incoming)

            expect(result).toEqual(incoming)
        })

        it('appends incoming after existing', () => {
            const existing = [createMockPackage({ id: 'a', position: 1 })]
            const incoming = [createMockPackage({ id: 'b', position: 1 })]

            const result = QueueManager.merge(existing, incoming)

            expect(result).toHaveLength(2)
            expect(result[0].id).toBe('a')
            expect(result[1].id).toBe('b')
        })

        it('adjusts incoming positions based on existing max', () => {
            const existing = [
                createMockPackage({ id: 'a', position: 1 }),
                createMockPackage({ id: 'b', position: 2 }),
            ]
            const incoming = [
                createMockPackage({ id: 'c', position: 1 }),
                createMockPackage({ id: 'd', position: 2 }),
            ]

            const result = QueueManager.merge(existing, incoming)

            expect(result[2].position).toBe(3) // 1 + 2 (max existing)
            expect(result[3].position).toBe(4) // 2 + 2
        })

        it('filters duplicate packages from incoming', () => {
            const existing = [createMockPackage({ id: 'formula:git' })]
            const incoming = [
                createMockPackage({ id: 'formula:git' }),
                createMockPackage({ id: 'formula:node' }),
            ]

            const result = QueueManager.merge(existing, incoming)

            expect(result).toHaveLength(2)
            expect(result[1].id).toBe('formula:node')
        })

        it('returns existing when all incoming are duplicates', () => {
            const existing = [createMockPackage({ id: 'formula:git' })]
            const incoming = [createMockPackage({ id: 'formula:git' })]

            const result = QueueManager.merge(existing, incoming)

            expect(result).toEqual(existing)
        })
    })

    // ----------------------------------------
    // ERROR CASES - What happens when things go wrong?
    // ----------------------------------------
    describe('error handling', () => {
        describe('generateId with invalid inputs', () => {
            it('handles empty string name', () => {
                const id = QueueManager.generateId('formula', '')
                expect(id).toBe('formula:')
            })

            it('handles name with only whitespace', () => {
                const id = QueueManager.generateId('formula', '   ')
                expect(id).toBe('formula:')
            })

            it('handles special characters in name', () => {
                const id = QueueManager.generateId('formula', '@scope/package')
                expect(id).toBe('formula:@scope/package')
            })

            it('handles unicode characters', () => {
                const id = QueueManager.generateId('formula', 'パッケージ')
                expect(id).toBe('formula:パッケージ')
            })

            it('handles very long names', () => {
                const longName = 'a'.repeat(1000)
                const id = QueueManager.generateId('formula', longName)
                expect(id).toBe(`formula:${longName}`)
            })
        })

        describe('createItem with edge cases', () => {
            it('handles empty name', () => {
                const item = QueueManager.createItem({
                    type: 'formula',
                    name: '',
                })
                expect(item.name).toBe('')
                expect(item.id).toBe('formula:')
            })

            it('handles name with leading/trailing whitespace', () => {
                const item = QueueManager.createItem({
                    type: 'formula',
                    name: '  git  ',
                })
                expect(item.name).toBe('git')
            })

            it('handles unknown package type gracefully', () => {
                // TypeScript would normally prevent this, but runtime might not
                const item = QueueManager.createItem({
                    type: 'unknown' as any,
                    name: 'test',
                })
                // Should use default description
                expect(item.description).toBe('CLI tool')
            })
        })

        describe('isDuplicate with edge cases', () => {
            it('handles undefined id gracefully', () => {
                const packages = [createMockPackage()]
                // This should not crash
                const result = QueueManager.isDuplicate(packages, undefined as any)
                expect(typeof result).toBe('boolean')
            })

            it('handles packages with missing ids', () => {
                const packages = [{ ...createMockPackage(), id: undefined as any }]
                const result = QueueManager.isDuplicate(packages, 'formula:git')
                expect(result).toBe(false)
            })
        })

        describe('isDuplicateByTypeAndName with edge cases', () => {
            it('handles empty name', () => {
                const packages = [createMockPackage({ name: '' })]
                const result = QueueManager.isDuplicateByTypeAndName(packages, 'formula', '')
                expect(result).toBe(true)
            })

            it('handles packages with undefined names', () => {
                const packages = [{ ...createMockPackage(), name: undefined as any }]
                // Should not crash
                expect(() =>
                    QueueManager.isDuplicateByTypeAndName(packages, 'formula', 'git')
                ).not.toThrow()
            })
        })

        describe('reindex with edge cases', () => {
            it('handles packages with negative positions', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: -5 }),
                    createMockPackage({ id: 'b', position: -10 }),
                ]
                const result = QueueManager.reindex(packages)

                // Should still reindex to 1, 2
                expect(result.map(p => p.position)).toEqual([1, 2])
            })

            it('handles packages with same positions', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: 1 }),
                    createMockPackage({ id: 'b', position: 1 }),
                    createMockPackage({ id: 'c', position: 1 }),
                ]
                const result = QueueManager.reindex(packages)

                // All should get unique positions
                expect(result.map(p => p.position)).toEqual([1, 2, 3])
            })

            it('handles very large position numbers', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: Number.MAX_SAFE_INTEGER }),
                    createMockPackage({ id: 'b', position: 1 }),
                ]
                const result = QueueManager.reindex(packages)

                expect(result.map(p => p.position)).toEqual([1, 2])
            })
        })

        describe('add with edge cases', () => {
            it('handles adding to very large queue', () => {
                const largeQueue = Array.from({ length: 1000 }, (_, i) =>
                    createMockPackage({ id: `formula:pkg${i}`, name: `pkg${i}`, position: i + 1 })
                )

                const result = QueueManager.add(largeQueue, createMockParams({ name: 'newpkg' }))

                expect(result.added[0].position).toBe(1001)
            })

            it('handles params with undefined values', () => {
                const result = QueueManager.add([], {
                    type: 'formula',
                    name: 'git',
                    description: undefined,
                    version: undefined,
                })

                expect(result.added).toHaveLength(1)
                expect(result.added[0].description).toBe('CLI tool') // default
            })
        })

        describe('remove with edge cases', () => {
            it('handles empty id', () => {
                const packages = [createMockPackage()]
                const result = QueueManager.remove(packages, '')

                expect(result).toHaveLength(1) // Nothing removed
            })

            it('handles removing from empty array', () => {
                const result = QueueManager.remove([], 'formula:git')

                expect(result).toEqual([])
            })
        })

        describe('move with edge cases', () => {
            it('handles negative position', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: 1 }),
                    createMockPackage({ id: 'b', position: 2 }),
                ]

                const result = QueueManager.move(packages, 'b', -5)

                // Should clamp to position 1
                expect(result[0].id).toBe('b')
            })

            it('handles moving in single-item array', () => {
                const packages = [createMockPackage({ id: 'a', position: 1 })]

                const result = QueueManager.move(packages, 'a', 5)

                expect(result[0].id).toBe('a')
                expect(result[0].position).toBe(1)
            })

            it('handles moving from empty array', () => {
                const result = QueueManager.move([], 'nonexistent', 1)

                expect(result).toEqual([])
            })
        })

        describe('merge with edge cases', () => {
            it('handles both arrays empty', () => {
                const result = QueueManager.merge([], [])

                expect(result).toEqual([])
            })

            it('handles packages with undefined positions', () => {
                const existing = [createMockPackage({ id: 'a', position: undefined })]
                const incoming = [createMockPackage({ id: 'b', position: undefined })]

                const result = QueueManager.merge(existing, incoming)

                // Should not crash
                expect(result).toHaveLength(2)
            })

            it('handles packages with NaN positions', () => {
                const existing = [createMockPackage({ id: 'a', position: NaN })]
                const incoming = [createMockPackage({ id: 'b', position: 1 })]

                // Should not crash
                const result = QueueManager.merge(existing, incoming)
                expect(result.length).toBeGreaterThan(0)
            })
        })

        describe('addMultiple with edge cases', () => {
            it('handles empty toAdd array', () => {
                const existing = [createMockPackage()]
                const result = QueueManager.addMultiple(existing, [])

                expect(result.added).toHaveLength(0)
                expect(result.duplicates).toHaveLength(0)
            })

            it('handles all duplicates', () => {
                const existing = [createMockPackage({ id: 'formula:git' })]
                const toAdd = [
                    createMockPackage({ id: 'formula:git' }),
                    createMockPackage({ id: 'formula:git' }),
                ]

                const result = QueueManager.addMultiple(existing, toAdd)

                expect(result.added).toHaveLength(0)
                expect(result.duplicates).toContain('formula:git')
            })
        })

        // ========================================
        // SECURITY TESTS - Prototype Pollution & Injection
        // ========================================
        describe('security - prototype pollution', () => {
            it('handles __proto__ in package name', () => {
                const result = QueueManager.add([], createMockParams({ name: '__proto__' }))
                expect(result.duplicates).toHaveLength(0)
                expect(result.added[0].name).toBe('__proto__')
            })

            it('handles constructor in package name', () => {
                const result = QueueManager.add([], createMockParams({ name: 'constructor' }))
                expect(result.added[0].name).toBe('constructor')
            })

            it('handles prototype in package name', () => {
                const result = QueueManager.add([], createMockParams({ name: 'prototype' }))
                expect(result.added[0].name).toBe('prototype')
            })

            it('does not pollute Object prototype', () => {
                const maliciousName = '__proto__'
                QueueManager.add([], createMockParams({ name: maliciousName }))

                // Verify prototype was not polluted
                expect(({} as any).malicious).toBeUndefined()
            })
        })

        describe('security - injection attacks', () => {
            it('handles shell command injection attempts', () => {
                const malicious = '; rm -rf /'
                const result = QueueManager.add([], createMockParams({ name: malicious }))
                expect(result.added[0].name).toBe(malicious)
            })

            it('handles SQL injection patterns', () => {
                const sqlInjection = "'; DROP TABLE packages; --"
                const result = QueueManager.add([], createMockParams({ name: sqlInjection }))
                expect(result.added[0].name).toBe(sqlInjection)
            })

            it('handles XSS payloads', () => {
                const xss = '<script>alert("xss")</script>'
                const result = QueueManager.add([], createMockParams({ name: xss }))
                expect(result.added[0].name).toBe(xss)
            })

            it('handles template literal injection', () => {
                const template = '${process.env.SECRET}'
                const result = QueueManager.add([], createMockParams({ name: template }))
                expect(result.added[0].name).toBe(template)
            })

            it('handles null byte injection', () => {
                const nullByte = 'package\x00hidden'
                const result = QueueManager.add([], createMockParams({ name: nullByte }))
                expect(result.added[0].name).toBe(nullByte)
            })
        })

        // ========================================
        // BOUNDARY VALUE TESTS
        // ========================================
        describe('boundary values', () => {
            it('handles position of 0', () => {
                const packages = [createMockPackage({ id: 'a', position: 0 })]
                const result = QueueManager.reindex(packages)
                expect(result[0].position).toBe(1)
            })

            it('handles position of -1', () => {
                const packages = [createMockPackage({ id: 'a', position: -1 })]
                const result = QueueManager.reindex(packages)
                expect(result[0].position).toBe(1)
            })

            it('handles position of Infinity', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: Infinity }),
                    createMockPackage({ id: 'b', position: 1 }),
                ]
                const result = QueueManager.reindex(packages)
                // Infinity should sort to end
                expect(result[1].id).toBe('a')
            })

            it('handles position of -Infinity', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: -Infinity }),
                    createMockPackage({ id: 'b', position: 1 }),
                ]
                const result = QueueManager.reindex(packages)
                // -Infinity should sort to beginning
                expect(result[0].id).toBe('a')
            })

            it('handles position of MAX_SAFE_INTEGER', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: Number.MAX_SAFE_INTEGER }),
                ]
                const result = QueueManager.reindex(packages)
                expect(result[0].position).toBe(1)
            })

            it('handles position of MIN_SAFE_INTEGER', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: Number.MIN_SAFE_INTEGER }),
                ]
                const result = QueueManager.reindex(packages)
                expect(result[0].position).toBe(1)
            })

            it('handles move to position 0', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: 1 }),
                    createMockPackage({ id: 'b', position: 2 }),
                ]
                const result = QueueManager.move(packages, 'b', 0)
                expect(result[0].id).toBe('b')
            })

            it('handles move to position MAX_SAFE_INTEGER', () => {
                const packages = [
                    createMockPackage({ id: 'a', position: 1 }),
                    createMockPackage({ id: 'b', position: 2 }),
                ]
                const result = QueueManager.move(packages, 'a', Number.MAX_SAFE_INTEGER)
                expect(result[1].id).toBe('a')
            })
        })

        // ========================================
        // ENCODING & UNICODE TESTS
        // ========================================
        describe('encoding and unicode', () => {
            it('handles emoji in package name', () => {
                const emoji = '🚀-package-📦'
                const result = QueueManager.add([], createMockParams({ name: emoji }))
                expect(result.added[0].name).toBe(emoji)
            })

            it('handles RTL text (Arabic)', () => {
                const arabic = 'مرحبا'
                const result = QueueManager.add([], createMockParams({ name: arabic }))
                expect(result.added[0].name).toBe(arabic)
            })

            it('handles mixed RTL/LTR text', () => {
                const mixed = 'hello-مرحبا-world'
                const result = QueueManager.add([], createMockParams({ name: mixed }))
                expect(result.added[0].name).toBe(mixed)
            })

            it('handles zero-width characters', () => {
                const zeroWidth = 'pack\u200Bage'  // zero-width space
                const result = QueueManager.add([], createMockParams({ name: zeroWidth }))
                expect(result.added[0].name).toBe(zeroWidth)
            })

            it('handles combining characters', () => {
                const combining = 'e\u0301'  // é as e + combining acute accent
                const result = QueueManager.add([], createMockParams({ name: combining }))
                expect(result.added[0].name.length).toBe(2)  // length is 2, not 1
            })

            it('handles surrogate pairs', () => {
                const surrogate = '𝒜𝒷'  // Mathematical script characters
                const result = QueueManager.add([], createMockParams({ name: surrogate }))
                expect(result.added[0].name).toBe(surrogate)
            })

            it('handles newlines and tabs in name', () => {
                const withNewline = 'package\n\t\rname'
                const result = QueueManager.add([], createMockParams({ name: withNewline }))
                expect(result.added[0].name).toBe(withNewline)
            })

            it('handles backslash escapes', () => {
                const backslash = 'path\\to\\package'
                const result = QueueManager.add([], createMockParams({ name: backslash }))
                expect(result.added[0].name).toBe(backslash)
            })
        })

        // ========================================
        // TYPE COERCION TESTS
        // Note: TypeScript enforces types at compile time.
        // These tests document that invalid runtime types will throw.
        // ========================================
        describe('type coercion issues', () => {
            it('throws on number as name (TypeScript would prevent)', () => {
                expect(() =>
                    QueueManager.add([], createMockParams({ name: 123 as any }))
                ).toThrow()
            })

            it('throws on boolean as name', () => {
                expect(() =>
                    QueueManager.add([], createMockParams({ name: true as any }))
                ).toThrow()
            })

            it('throws on array as name', () => {
                expect(() =>
                    QueueManager.add([], createMockParams({ name: ['a', 'b'] as any }))
                ).toThrow()
            })

            it('throws on object as name', () => {
                expect(() =>
                    QueueManager.add([], createMockParams({ name: { foo: 'bar' } as any }))
                ).toThrow()
            })

            it('throws on null as name', () => {
                expect(() =>
                    QueueManager.add([], createMockParams({ name: null as any }))
                ).toThrow()
            })

            it('throws on function as name', () => {
                expect(() =>
                    QueueManager.add([], createMockParams({ name: (() => 'test') as any }))
                ).toThrow()
            })

            it('throws on Symbol as type', () => {
                // Symbols cannot be converted to strings
                expect(() => {
                    QueueManager.generateId(Symbol('test') as any, 'name')
                }).toThrow()
            })
        })

        // ========================================
        // OBJECT MUTATION TESTS
        // ========================================
        describe('object immutability', () => {
            it('does not mutate input packages array', () => {
                const original = [createMockPackage({ id: 'a', position: 1 })]
                const originalCopy = JSON.stringify(original)

                QueueManager.add(original, createMockParams({ name: 'new' }))

                expect(JSON.stringify(original)).toBe(originalCopy)
            })

            it('does not mutate packages in array on reindex', () => {
                const pkg = createMockPackage({ id: 'a', position: 5 })
                const original = [pkg]

                QueueManager.reindex(original)

                // Original package should be unchanged
                expect(pkg.position).toBe(5)
            })

            it('does not mutate packages on move', () => {
                const pkg1 = createMockPackage({ id: 'a', position: 1 })
                const pkg2 = createMockPackage({ id: 'b', position: 2 })
                const original = [pkg1, pkg2]

                QueueManager.move(original, 'b', 1)

                expect(pkg1.position).toBe(1)
                expect(pkg2.position).toBe(2)
            })
        })

        // ========================================
        // STRESS TESTS
        // ========================================
        describe('stress tests', () => {
            it('handles 10000 packages', () => {
                const hugeQueue = Array.from({ length: 10000 }, (_, i) =>
                    createMockPackage({ id: `formula:pkg${i}`, name: `pkg${i}`, position: i + 1 })
                )

                const result = QueueManager.add(hugeQueue, createMockParams({ name: 'newpkg' }))
                expect(result.added[0].position).toBe(10001)
            })

            it('handles deeply nested duplicate checks', () => {
                const queue = Array.from({ length: 100 }, (_, i) =>
                    createMockPackage({ id: `formula:pkg${i}` })
                )

                // Check for duplicate that doesn't exist
                const result = QueueManager.isDuplicate(queue, 'formula:nonexistent')
                expect(result).toBe(false)
            })

            it('handles many sequential adds', () => {
                let queue: PackageInstallItem[] = []

                for (let i = 0; i < 100; i++) {
                    const result = QueueManager.add(queue, createMockParams({ name: `pkg${i}` }))
                    queue = [...queue, ...result.added]
                }

                expect(queue).toHaveLength(100)
                expect(queue[99].position).toBe(100)
            })
        })
    })
})

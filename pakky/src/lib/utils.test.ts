import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
    it('merges class names', () => {
        const result = cn('foo', 'bar')
        expect(result).toBe('foo bar')
    })

    it('handles conditional classes', () => {
        const isActive = true
        const result = cn('base', isActive && 'active')
        expect(result).toBe('base active')
    })

    it('handles false conditions', () => {
        const isActive = false
        const result = cn('base', isActive && 'active')
        expect(result).toBe('base')
    })

    it('merges tailwind classes correctly', () => {
        // twMerge should handle conflicting tailwind classes
        const result = cn('p-4', 'p-2')
        expect(result).toBe('p-2')
    })

    it('handles arrays', () => {
        const result = cn(['foo', 'bar'])
        expect(result).toBe('foo bar')
    })

    it('handles objects', () => {
        const result = cn({ foo: true, bar: false, baz: true })
        expect(result).toBe('foo baz')
    })

    it('handles mixed inputs', () => {
        const result = cn('base', { active: true }, ['extra'])
        expect(result).toBe('base active extra')
    })

    it('handles empty inputs', () => {
        const result = cn()
        expect(result).toBe('')
    })
})

// ============================================
// ERROR CASES - What happens when things go wrong?
// ============================================

describe('cn error handling', () => {
    it('handles null values', () => {
        const result = cn('base', null, 'extra')
        expect(result).toBe('base extra')
    })

    it('handles undefined values', () => {
        const result = cn('base', undefined, 'extra')
        expect(result).toBe('base extra')
    })

    it('handles empty string values', () => {
        const result = cn('', 'base', '')
        expect(result).toBe('base')
    })

    it('handles number 0 (falsy)', () => {
        const result = cn('base', 0 as any)
        expect(result).toBe('base')
    })

    it('handles nested empty arrays', () => {
        const result = cn('base', [], ['nested'])
        expect(result).toBe('base nested')
    })

    it('handles all falsy values', () => {
        const result = cn(false, null, undefined, 0 as any, '')
        expect(result).toBe('')
    })

    it('handles object with all false values', () => {
        const result = cn({ foo: false, bar: false })
        expect(result).toBe('')
    })

    it('handles deeply nested arrays', () => {
        const result = cn([['a', 'b'], ['c']])
        expect(result).toBe('a b c')
    })

    it('handles very long class names', () => {
        const longClass = 'class-' + 'a'.repeat(1000)
        const result = cn(longClass)
        expect(result).toHaveLength(1006)
    })

    it('handles special characters in class names', () => {
        const result = cn('hover:bg-red-500', 'focus:ring-2', '[&>*]:p-4')
        expect(result).toBe('hover:bg-red-500 focus:ring-2 [&>*]:p-4')
    })

    it('handles duplicate class names', () => {
        const result = cn('foo', 'foo', 'foo')
        // clsx typically keeps duplicates, twMerge handles conflicts
        expect(result).toContain('foo')
    })

    it('handles classes starting with numbers', () => {
        const result = cn('2xl:block', 'md:hidden')
        expect(result).toBe('2xl:block md:hidden')
    })

    // ========================================
    // SECURITY TESTS
    // ========================================
    it('handles XSS in class names (does not execute)', () => {
        const xss = '<script>alert(1)</script>'
        const result = cn(xss)
        expect(result).toBe(xss)
    })

    it('handles HTML entities in class names', () => {
        const result = cn('&lt;div&gt;')
        expect(result).toBe('&lt;div&gt;')
    })

    it('handles CSS injection attempts', () => {
        const result = cn('expression(alert(1))')
        expect(result).toBe('expression(alert(1))')
    })

    it('handles javascript: pseudo-protocol', () => {
        const result = cn('javascript:void(0)')
        expect(result).toBe('javascript:void(0)')
    })

    // ========================================
    // ENCODING TESTS  
    // ========================================
    it('handles emoji as class names', () => {
        const result = cn('🔥', '📦')
        expect(result).toBe('🔥 📦')
    })

    it('handles unicode characters', () => {
        const result = cn('クラス', '类名')
        expect(result).toBe('クラス 类名')
    })

    it('handles zero-width spaces', () => {
        const zeroWidth = 'class\u200Bname'
        const result = cn(zeroWidth)
        expect(result).toBe(zeroWidth)
    })

    it('handles combining diacritical marks', () => {
        const combining = 'cafe\u0301'  // café with combining accent
        const result = cn(combining)
        expect(result).toBe(combining)
    })

    it('handles surrogate pairs', () => {
        const surrogate = '𝕔𝕝𝕒𝕤𝕤'  // Mathematical double-struck
        const result = cn(surrogate)
        expect(result).toBe(surrogate)
    })

    // ========================================
    // TAILWIND SPECIFIC EDGE CASES
    // ========================================
    it('handles conflicting responsive variants', () => {
        const result = cn('sm:p-4', 'sm:p-2', 'md:p-4')
        // twMerge should keep last sm: and md:
        expect(result).toContain('md:p-4')
    })

    it('handles conflicting state variants', () => {
        const result = cn('hover:bg-blue-500', 'hover:bg-red-500')
        // Should keep the last one
        expect(result).toBe('hover:bg-red-500')
    })

    it('handles conflicting dark mode variants', () => {
        const result = cn('dark:bg-black', 'dark:bg-white')
        expect(result).toBe('dark:bg-white')
    })

    it('handles arbitrary values', () => {
        const result = cn('p-[13px]', 'p-4')
        // Custom value should be overridden by standard
        expect(result).toContain('p-4')
    })

    it('handles negative values', () => {
        const result = cn('-m-4', '-m-2')
        expect(result).toBe('-m-2')
    })

    it('handles important modifier', () => {
        const result = cn('!p-4', 'p-2')
        // !important classes
        expect(result).toContain('!p-4')
    })

    // ========================================
    // TYPE COERCION EDGE CASES
    // ========================================
    it('handles NaN', () => {
        const result = cn('base', NaN as any)
        expect(result).not.toContain('NaN')
    })

    it('handles Infinity (clsx includes it as string)', () => {
        const result = cn('base', Infinity as any)
        // clsx converts Infinity to string 'Infinity'
        expect(result).toContain('base')
    })

    it('handles BigInt', () => {
        const result = cn('base', BigInt(123) as any)
        expect(result).toBeDefined()
    })

    it('handles Symbol (should not crash)', () => {
        expect(() => cn('base', Symbol('test') as any)).not.toThrow()
    })

    it('handles Date object', () => {
        const result = cn('base', new Date() as any)
        expect(result).toBeDefined()
    })

    it('handles RegExp', () => {
        const result = cn('base', /test/ as any)
        expect(result).toBeDefined()
    })

    it('handles Error object', () => {
        const result = cn('base', new Error('test') as any)
        expect(result).toBeDefined()
    })

    // ========================================
    // STRESS TESTS
    // ========================================
    it('handles 100 class names', () => {
        const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`)
        const result = cn(...classes)
        expect(result.split(' ')).toHaveLength(100)
    })

    it('handles 1000 character class name', () => {
        const longClass = 'a'.repeat(1000)
        const result = cn(longClass)
        expect(result).toHaveLength(1000)
    })

    it('handles deeply nested conditionals', () => {
        const a = true
        const b = false
        const c = true
        const result = cn(
            'base',
            a && 'a',
            b && 'b',
            c && (a ? 'c-a' : 'c-b'),
            { complex: a && c, other: b || !c }
        )
        expect(result).toContain('base')
        expect(result).toContain('a')
        expect(result).toContain('c-a')
        expect(result).toContain('complex')
    })
})

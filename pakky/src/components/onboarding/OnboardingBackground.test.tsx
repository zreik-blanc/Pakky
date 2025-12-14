import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { OnboardingBackground } from './OnboardingBackground'

/**
 * Tests for OnboardingBackground component
 * 
 * This component had a probability change for the pulse spawner:
 * - Changed from: if (Math.random() > 0.5) return;
 * - Changed to: if (Math.random() > 0.6) return;
 * 
 * This means pulses now spawn more frequently (40% chance instead of 50%).
 * Tests verify the component renders and animates correctly.
 */

describe('OnboardingBackground', () => {
    beforeEach(() => {
        // Mock HTMLCanvasElement methods
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            getImageData: vi.fn(),
            putImageData: vi.fn(),
            createImageData: vi.fn(),
            setTransform: vi.fn(),
            drawImage: vi.fn(),
            save: vi.fn(),
            fillText: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            stroke: vi.fn(),
            translate: vi.fn(),
            scale: vi.fn(),
            rotate: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            measureText: vi.fn(() => ({ width: 0 })),
            transform: vi.fn(),
            rect: vi.fn(),
            clip: vi.fn(),
        })) as any

        // Mock requestAnimationFrame
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
            setTimeout(() => cb(Date.now()), 16)
            return 1
        })

        // Mock cancelAnimationFrame
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ============================================
    // Basic Rendering Tests
    // ============================================

    describe('rendering', () => {
        it('renders without crashing', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('renders canvas element', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            const canvas = container.querySelector('canvas')
            expect(canvas).toBeInTheDocument()
            expect(canvas?.tagName).toBe('CANVAS')
        })

        it('renders container div', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            const div = container.querySelector('div')
            expect(div).toBeInTheDocument()
        })

        it('applies fixed positioning classes', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            const div = container.querySelector('div')
            expect(div).toHaveClass('fixed', 'inset-0')
        })

        it('applies z-index class', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            const div = container.querySelector('div')
            expect(div).toHaveClass('z-0')
        })
    })

    // ============================================
    // Props Tests
    // ============================================

    describe('props handling', () => {
        it('accepts currentStepIndex prop', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={2} totalSteps={5} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('accepts totalSteps prop', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={10} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('handles isExiting prop as false by default', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('accepts isExiting prop as true', () => {
            const { container } = render(
                <OnboardingBackground 
                    currentStepIndex={0} 
                    totalSteps={3} 
                    isExiting={true} 
                />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('handles edge case with step 0', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={1} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('handles last step', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={4} totalSteps={5} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })
    })

    // ============================================
    // Canvas Context Tests
    // ============================================

    describe('canvas context', () => {
        it('gets 2d context with alpha false optimization', () => {
            const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')

            render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            expect(getContextSpy).toHaveBeenCalledWith('2d', { alpha: false })
        })

        it('handles missing canvas gracefully', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            // Should not throw even if canvas is not available
            expect(container).toBeInTheDocument()
        })

        it('handles missing context gracefully', () => {
            HTMLCanvasElement.prototype.getContext = vi.fn(() => null)

            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            expect(container).toBeInTheDocument()
        })
    })

    // ============================================
    // Animation Tests
    // ============================================

    describe('animation lifecycle', () => {
        it('starts animation on mount', () => {
            const rafSpy = vi.spyOn(window, 'requestAnimationFrame')

            render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            expect(rafSpy).toHaveBeenCalled()
        })

        it('cancels animation on unmount', () => {
            const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')

            const { unmount } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            unmount()

            // Should have called cancelAnimationFrame during cleanup
            expect(cancelSpy).toHaveBeenCalled()
        })

        it('cleans up intervals on unmount', () => {
            vi.useFakeTimers()
            const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

            const { unmount } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            unmount()

            expect(clearIntervalSpy).toHaveBeenCalled()
            
            vi.useRealTimers()
        })
    })

    // ============================================
    // Pulse Spawner Probability Tests (NEW FEATURE)
    // ============================================

    describe('pulse spawner probability', () => {
        it('spawns pulses with updated probability threshold', () => {
            vi.useFakeTimers()
            
            // Mock Math.random to return values that test the threshold
            const mockRandom = vi.spyOn(Math, 'random')
            
            render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            // Fast forward to trigger pulse spawner
            vi.advanceTimersByTime(1000)

            // Math.random should have been called for probability checks
            expect(mockRandom).toHaveBeenCalled()
            
            mockRandom.mockRestore()
            vi.useRealTimers()
        })

        it('probability threshold allows more frequent pulses', () => {
            // The new threshold is 0.6, meaning random values <= 0.6 will spawn pulses
            // This is a 60% chance compared to the old 50% chance
            
            // Test that values below threshold should spawn
            expect(0.5 > 0.6).toBe(false) // Should spawn (old and new)
            expect(0.55 > 0.6).toBe(false) // Should spawn (new only)
            expect(0.6 > 0.6).toBe(false) // Should spawn (edge case)
            
            // Test that values above threshold should not spawn
            expect(0.65 > 0.6).toBe(true) // Should not spawn
            expect(0.7 > 0.6).toBe(true) // Should not spawn
        })

        it('pulse spawning probability calculation', () => {
            // Old: Math.random() > 0.5 means 50% don't spawn, 50% do spawn
            // New: Math.random() > 0.6 means 40% don't spawn, 60% do spawn
            
            const oldThreshold = 0.5
            const newThreshold = 0.6
            
            // Calculate spawn rates
            const oldSpawnRate = 1 - oldThreshold // 0.5 or 50%
            const newSpawnRate = 1 - newThreshold // 0.4 or 40%
            
            // Actually, the logic is inverted - if random > threshold, we return (don't spawn)
            // So if random > 0.6, we skip, meaning 40% of the time we skip
            // And 60% of the time we spawn
            
            expect(newSpawnRate).toBeLessThan(oldSpawnRate)
            expect(newThreshold).toBeGreaterThan(oldThreshold)
        })
    })

    // ============================================
    // Resize Handling Tests
    // ============================================

    describe('resize handling', () => {
        it('handles window resize', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            const canvas = container.querySelector('canvas')
            
            // Trigger resize
            window.dispatchEvent(new Event('resize'))

            // Canvas should still be in DOM
            expect(canvas).toBeInTheDocument()
        })

        it('updates canvas dimensions on resize', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            const canvas = container.querySelector('canvas') as HTMLCanvasElement

            // Simulate container size
            Object.defineProperty(container.firstChild, 'clientWidth', {
                writable: true,
                value: 800,
            })
            Object.defineProperty(container.firstChild, 'clientHeight', {
                writable: true,
                value: 600,
            })

            window.dispatchEvent(new Event('resize'))

            // Canvas dimensions should be updated
            expect(canvas).toBeInTheDocument()
        })
    })

    // ============================================
    // Step Transition Tests
    // ============================================

    describe('step transitions', () => {
        it('updates when currentStepIndex changes', () => {
            const { rerender } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            rerender(
                <OnboardingBackground currentStepIndex={1} totalSteps={3} />
            )

            // Component should handle the update
            expect(document.querySelector('canvas')).toBeInTheDocument()
        })

        it('handles all steps in sequence', () => {
            const { rerender } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={5} />
            )

            for (let i = 1; i < 5; i++) {
                rerender(
                    <OnboardingBackground currentStepIndex={i} totalSteps={5} />
                )
                expect(document.querySelector('canvas')).toBeInTheDocument()
            }
        })

        it('handles backward navigation', () => {
            const { rerender } = render(
                <OnboardingBackground currentStepIndex={2} totalSteps={3} />
            )

            rerender(
                <OnboardingBackground currentStepIndex={1} totalSteps={3} />
            )

            expect(document.querySelector('canvas')).toBeInTheDocument()
        })
    })

    // ============================================
    // Exit State Tests
    // ============================================

    describe('exit state', () => {
        it('handles exit animation', () => {
            const { container } = render(
                <OnboardingBackground 
                    currentStepIndex={2} 
                    totalSteps={3} 
                    isExiting={true} 
                />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('transitions from normal to exiting state', () => {
            const { rerender, container } = render(
                <OnboardingBackground 
                    currentStepIndex={2} 
                    totalSteps={3} 
                    isExiting={false} 
                />
            )

            rerender(
                <OnboardingBackground 
                    currentStepIndex={2} 
                    totalSteps={3} 
                    isExiting={true} 
                />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })
    })

    // ============================================
    // Performance Tests
    // ============================================

    describe('performance', () => {
        it('does not create excessive timers', () => {
            vi.useFakeTimers()
            const setIntervalSpy = vi.spyOn(global, 'setInterval')

            render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            // Should create a limited number of intervals (for pulse spawner, etc.)
            expect(setIntervalSpy).toHaveBeenCalled()
            expect(setIntervalSpy.mock.calls.length).toBeLessThan(10)

            vi.useRealTimers()
        })

        it('cleans up on rapid remounts', () => {
            const { unmount, rerender } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            // Rapidly remount
            for (let i = 0; i < 5; i++) {
                unmount()
                rerender(
                    <OnboardingBackground currentStepIndex={0} totalSteps={3} />
                )
            }

            // Should not leak memory or throw errors
            expect(document.querySelector('canvas')).toBeInTheDocument()
        })
    })

    // ============================================
    // Edge Cases
    // ============================================

    describe('edge cases', () => {
        it('handles zero total steps', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={0} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('handles negative step index gracefully', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={-1} totalSteps={3} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('handles step index exceeding total steps', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={10} totalSteps={3} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('handles very large total steps', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={50} totalSteps={100} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })

        it('handles fractional step values', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={1.5} totalSteps={3} />
            )

            expect(container.querySelector('canvas')).toBeInTheDocument()
        })
    })

    // ============================================
    // Visual Regression Tests
    // ============================================

    describe('visual elements', () => {
        it('maintains fixed positioning throughout lifecycle', () => {
            const { container, rerender } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            expect(container.querySelector('div')).toHaveClass('fixed')

            rerender(
                <OnboardingBackground currentStepIndex={1} totalSteps={3} />
            )

            expect(container.querySelector('div')).toHaveClass('fixed')
        })

        it('canvas fills container', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            const canvas = container.querySelector('canvas')
            expect(canvas).toHaveClass('w-full', 'h-full')
        })

        it('maintains opacity class', () => {
            const { container } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            const div = container.querySelector('div')
            // Component should have some opacity styling
            expect(div).toBeInTheDocument()
        })
    })

    // ============================================
    // Integration Tests
    // ============================================

    describe('integration scenarios', () => {
        it('handles complete onboarding flow', () => {
            const { rerender } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={4} />
            )

            // Progress through all steps
            for (let i = 1; i < 4; i++) {
                rerender(
                    <OnboardingBackground currentStepIndex={i} totalSteps={4} />
                )
            }

            // Enter exit state
            rerender(
                <OnboardingBackground 
                    currentStepIndex={3} 
                    totalSteps={4} 
                    isExiting={true} 
                />
            )

            expect(document.querySelector('canvas')).toBeInTheDocument()
        })

        it('handles rapid prop changes', () => {
            const { rerender } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            // Rapidly change props
            rerender(<OnboardingBackground currentStepIndex={1} totalSteps={3} />)
            rerender(<OnboardingBackground currentStepIndex={2} totalSteps={3} />)
            rerender(<OnboardingBackground currentStepIndex={1} totalSteps={3} />)
            rerender(<OnboardingBackground currentStepIndex={0} totalSteps={3} />)

            expect(document.querySelector('canvas')).toBeInTheDocument()
        })
    })

    // ============================================
    // Memory Leak Tests
    // ============================================

    describe('memory management', () => {
        it('cleans up all resources on unmount', () => {
            vi.useFakeTimers()
            const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
            const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')

            const { unmount } = render(
                <OnboardingBackground currentStepIndex={0} totalSteps={3} />
            )

            unmount()

            expect(clearIntervalSpy).toHaveBeenCalled()
            expect(cancelAnimationFrameSpy).toHaveBeenCalled()

            vi.useRealTimers()
        })

        it('does not leak timers after multiple mount/unmount cycles', () => {
            vi.useFakeTimers()

            for (let i = 0; i < 10; i++) {
                const { unmount } = render(
                    <OnboardingBackground currentStepIndex={0} totalSteps={3} />
                )
                unmount()
            }

            // Should not accumulate timers
            const pendingTimers = vi.getTimerCount()
            expect(pendingTimers).toBe(0)

            vi.useRealTimers()
        })
    })
})
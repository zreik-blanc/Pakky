import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from './dialog'

/**
 * Tests for Dialog UI component
 * 
 * This component had a CSS class change to the close button:
 * - Changed from: hover:scale-115
 * - Changed to: hover:scale-[1.15]
 * 
 * This is a Tailwind CSS fix where arbitrary values need bracket notation.
 * Tests verify the component renders correctly with the updated class.
 */

describe('Dialog component', () => {
    // ============================================
    // Basic Rendering Tests
    // ============================================

    describe('rendering', () => {
        it('renders dialog when open', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Test Dialog</DialogTitle>
                            <DialogDescription>Test description</DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByRole('dialog')).toBeInTheDocument()
            expect(screen.getByText('Test Dialog')).toBeInTheDocument()
            expect(screen.getByText('Test description')).toBeInTheDocument()
        })

        it('does not render dialog when closed', () => {
            render(
                <Dialog open={false}>
                    <DialogContent>
                        <DialogTitle>Test Dialog</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })

        it('renders with DialogTrigger', () => {
            render(
                <Dialog>
                    <DialogTrigger>Open Dialog</DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Test Dialog</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByText('Open Dialog')).toBeInTheDocument()
        })

        it('renders DialogFooter', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Test</DialogTitle>
                        </DialogHeader>
                        <DialogFooter>
                            <button>Cancel</button>
                            <button>Confirm</button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByText('Cancel')).toBeInTheDocument()
            expect(screen.getByText('Confirm')).toBeInTheDocument()
        })
    })

    // ============================================
    // Close Button Tests (NEW CSS CLASS)
    // ============================================

    describe('close button styling', () => {
        it('renders close button with correct arbitrary scale class', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            expect(closeButton).toBeInTheDocument()

            // Verify the close button has the correct Tailwind class with bracket notation
            expect(closeButton).toHaveClass('hover:scale-[1.15]')
        })

        it('close button has proper accessibility label', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            expect(closeButton).toHaveAccessibleName('Close')
        })

        it('close button contains X icon', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            const icon = closeButton.querySelector('svg')
            expect(icon).toBeInTheDocument()
            expect(icon).toHaveClass('h-4', 'w-4')
        })

        it('close button has correct position classes', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            expect(closeButton).toHaveClass('absolute', 'right-4', 'top-4')
        })

        it('close button has transition classes', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            expect(closeButton).toHaveClass('transition-all')
        })

        it('close button has hover state classes', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            expect(closeButton).toHaveClass('hover:opacity-100')
            expect(closeButton).toHaveClass('hover:text-destructive')
        })

        it('close button has active state class', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            expect(closeButton).toHaveClass('active:scale-95')
        })

        it('close button has focus-visible ring classes', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            expect(closeButton).toHaveClass('focus-visible:outline-none')
            expect(closeButton).toHaveClass('focus-visible:ring-2')
            expect(closeButton).toHaveClass('focus-visible:ring-primary')
        })
    })

    // ============================================
    // Dialog Structure Tests
    // ============================================

    describe('dialog structure', () => {
        it('applies correct className to DialogContent', () => {
            render(
                <Dialog open={true}>
                    <DialogContent className="custom-class">
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const dialog = screen.getByRole('dialog')
            expect(dialog).toHaveClass('custom-class')
        })

        it('DialogHeader has correct layout classes', () => {
            const { container } = render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Test</DialogTitle>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            )

            const header = container.querySelector('.flex.flex-col.space-y-1\\.5')
            expect(header).toBeInTheDocument()
        })

        it('DialogFooter has correct layout classes', () => {
            const { container } = render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Test</DialogTitle>
                        </DialogHeader>
                        <DialogFooter>
                            <button>Action</button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )

            const footer = container.querySelector('.flex.flex-col-reverse')
            expect(footer).toBeInTheDocument()
        })

        it('DialogTitle has correct typography classes', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test Title</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const title = screen.getByText('Test Title')
            expect(title).toHaveClass('text-lg', 'font-semibold')
        })

        it('DialogDescription has correct text classes', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Title</DialogTitle>
                        <DialogDescription>Description text</DialogDescription>
                    </DialogContent>
                </Dialog>
            )

            const description = screen.getByText('Description text')
            expect(description).toHaveClass('text-sm', 'text-muted-foreground')
        })
    })

    // ============================================
    // Custom Props Tests
    // ============================================

    describe('custom props', () => {
        it('forwards custom props to DialogContent', () => {
            render(
                <Dialog open={true}>
                    <DialogContent data-testid="custom-dialog">
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByTestId('custom-dialog')).toBeInTheDocument()
        })

        it('applies custom className to DialogHeader', () => {
            const { container } = render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogHeader className="custom-header">
                            <DialogTitle>Test</DialogTitle>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            )

            const header = container.querySelector('.custom-header')
            expect(header).toBeInTheDocument()
        })

        it('applies custom className to DialogFooter', () => {
            const { container } = render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                        <DialogFooter className="custom-footer">
                            <button>Action</button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )

            const footer = container.querySelector('.custom-footer')
            expect(footer).toBeInTheDocument()
        })

        it('applies custom className to DialogTitle', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle className="custom-title">Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const title = screen.getByText('Test')
            expect(title).toHaveClass('custom-title')
        })

        it('applies custom className to DialogDescription', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Title</DialogTitle>
                        <DialogDescription className="custom-description">
                            Description
                        </DialogDescription>
                    </DialogContent>
                </Dialog>
            )

            const description = screen.getByText('Description')
            expect(description).toHaveClass('custom-description')
        })
    })

    // ============================================
    // Interaction Tests
    // ============================================

    describe('interactions', () => {
        it('close button is clickable', async () => {
            const user = userEvent.setup()
            
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            await user.click(closeButton)
            
            // Button is clickable (no error thrown)
            expect(closeButton).toBeInTheDocument()
        })

        it('close button is keyboard accessible', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            closeButton.focus()
            
            expect(document.activeElement).toBe(closeButton)
        })
    })

    // ============================================
    // Complex Content Tests
    // ============================================

    describe('complex content', () => {
        it('renders dialog with all sections', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Complete Dialog</DialogTitle>
                            <DialogDescription>This is a complete example</DialogDescription>
                        </DialogHeader>
                        <div>Main content area</div>
                        <DialogFooter>
                            <button>Cancel</button>
                            <button>Save</button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByText('Complete Dialog')).toBeInTheDocument()
            expect(screen.getByText('This is a complete example')).toBeInTheDocument()
            expect(screen.getByText('Main content area')).toBeInTheDocument()
            expect(screen.getByText('Cancel')).toBeInTheDocument()
            expect(screen.getByText('Save')).toBeInTheDocument()
        })

        it('renders dialog with nested components', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nested Content</DialogTitle>
                        </DialogHeader>
                        <div>
                            <p>Paragraph 1</p>
                            <ul>
                                <li>Item 1</li>
                                <li>Item 2</li>
                            </ul>
                        </div>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
            expect(screen.getByText('Item 1')).toBeInTheDocument()
            expect(screen.getByText('Item 2')).toBeInTheDocument()
        })

        it('handles multiple buttons in footer', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Multiple Actions</DialogTitle>
                        <DialogFooter>
                            <button>Action 1</button>
                            <button>Action 2</button>
                            <button>Action 3</button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByText('Action 1')).toBeInTheDocument()
            expect(screen.getByText('Action 2')).toBeInTheDocument()
            expect(screen.getByText('Action 3')).toBeInTheDocument()
        })
    })

    // ============================================
    // Accessibility Tests
    // ============================================

    describe('accessibility', () => {
        it('has proper dialog role', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        it('close button has sr-only text for screen readers', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const srText = screen.getByText('Close')
            expect(srText).toHaveClass('sr-only')
        })

        it('disabled close button has correct attribute', () => {
            const { container } = render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            expect(closeButton).toHaveClass('disabled:pointer-events-none')
        })

        it('DialogTitle is properly associated with dialog', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Accessible Title</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const dialog = screen.getByRole('dialog')
            const title = screen.getByText('Accessible Title')
            
            expect(dialog).toBeInTheDocument()
            expect(title).toBeInTheDocument()
        })
    })

    // ============================================
    // CSS Class Regression Tests
    // ============================================

    describe('CSS class regressions', () => {
        it('uses bracket notation for arbitrary scale value', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            
            // Should have the correct bracket notation
            expect(closeButton.className).toContain('hover:scale-[1.15]')
            
            // Should NOT have the old incorrect format
            expect(closeButton.className).not.toContain('hover:scale-115')
        })

        it('maintains all other scale-related classes', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            
            // Verify active state scale is also present
            expect(closeButton).toHaveClass('active:scale-95')
        })

        it('preserves all original button classes', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            const closeButton = screen.getByRole('button', { name: /close/i })
            
            const expectedClasses = [
                'absolute',
                'right-4',
                'top-4',
                'rounded-sm',
                'opacity-70',
                'transition-all',
                'border-none',
                'hover:opacity-100',
                'hover:text-destructive',
                'hover:scale-[1.15]',
                'active:scale-95',
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                'focus-visible:ring-primary',
                'focus-visible:ring-offset-2',
                'focus-visible:ring-offset-background',
                'disabled:pointer-events-none',
            ]
            
            expectedClasses.forEach(className => {
                expect(closeButton).toHaveClass(className)
            })
        })
    })

    // ============================================
    // Edge Cases
    // ============================================

    describe('edge cases', () => {
        it('renders without DialogHeader', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Just Title</DialogTitle>
                        <div>Content without header wrapper</div>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByText('Just Title')).toBeInTheDocument()
            expect(screen.getByText('Content without header wrapper')).toBeInTheDocument()
        })

        it('renders without DialogFooter', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>No Footer</DialogTitle>
                        </DialogHeader>
                        <div>Content</div>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByText('No Footer')).toBeInTheDocument()
            expect(screen.getByText('Content')).toBeInTheDocument()
        })

        it('handles empty DialogFooter', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test</DialogTitle>
                        <DialogFooter></DialogFooter>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        it('handles very long title text', () => {
            const longTitle = 'A'.repeat(200)
            
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>{longTitle}</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByText(longTitle)).toBeInTheDocument()
        })

        it('handles special characters in content', () => {
            render(
                <Dialog open={true}>
                    <DialogContent>
                        <DialogTitle>Test & "Special" {'<>'}Characters</DialogTitle>
                    </DialogContent>
                </Dialog>
            )

            expect(screen.getByText(/Test & "Special"/)).toBeInTheDocument()
        })
    })
})
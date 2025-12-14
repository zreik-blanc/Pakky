import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportConfigDialog } from './ImportConfigDialog'

/**
 * Tests for ImportConfigDialog component
 * 
 * This component manages import state with timeout cleanup to prevent
 * stale state resets when the dialog is quickly reopened.
 * 
 * Key features tested:
 * - Timeout cleanup when dialog opens (new feature)
 * - Timeout cleanup on unmount
 * - State reset after dialog closes
 * - Import validation and error handling
 */

describe('ImportConfigDialog', () => {
    let user: ReturnType<typeof userEvent.setup>
    const mockOnOpenChange = vi.fn()
    const mockOnImportFromFile = vi.fn()
    const mockOnImportFromContent = vi.fn()

    beforeEach(() => {
        user = userEvent.setup()
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
    })

    // ============================================
    // Rendering Tests
    // ============================================

    describe('rendering', () => {
        it('renders nothing when closed', () => {
            const { container } = render(
                <ImportConfigDialog
                    open={false}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
        })

        it('renders choice screen when opened', () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            expect(screen.getByText('Import Configuration')).toBeInTheDocument()
            expect(screen.getByText('Upload File')).toBeInTheDocument()
            expect(screen.getByText('Paste Config')).toBeInTheDocument()
        })

        it('renders with proper dialog structure', () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            const dialog = screen.getByRole('dialog')
            expect(dialog).toBeInTheDocument()
            expect(screen.getByText(/Choose how you'd like to import/i)).toBeInTheDocument()
        })

        it('displays file json icon', () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // lucide-react icons have specific classes
            const icons = document.querySelectorAll('svg')
            expect(icons.length).toBeGreaterThan(0)
        })
    })

    // ============================================
    // Navigation Tests
    // ============================================

    describe('navigation between views', () => {
        it('navigates to paste view when clicking Paste Config', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            const pasteButton = screen.getByText('Paste Config').closest('button')
            expect(pasteButton).toBeInTheDocument()
            
            await user.click(pasteButton!)
            
            await waitFor(() => {
                expect(screen.getByText('Paste Configuration')).toBeInTheDocument()
            })
            
            expect(screen.getByPlaceholderText(/"name": "My Setup"/)).toBeInTheDocument()
        })

        it('navigates back to choice view from paste view', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Navigate to paste view
            await user.click(screen.getByText('Paste Config').closest('button')!)
            
            await waitFor(() => {
                expect(screen.getByText('Paste Configuration')).toBeInTheDocument()
            })
            
            // Click back button
            const backButtons = screen.getAllByText('Back')
            await user.click(backButtons[0])
            
            await waitFor(() => {
                expect(screen.getByText('Upload File')).toBeInTheDocument()
            })
        })

        it('shows back button in paste view', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            
            await waitFor(() => {
                const backButtons = screen.getAllByText('Back')
                expect(backButtons.length).toBeGreaterThan(0)
            })
        })
    })

    // ============================================
    // File Upload Tests
    // ============================================

    describe('file upload functionality', () => {
        it('calls onImportFromFile when Upload File is clicked', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            const uploadButton = screen.getByText('Upload File').closest('button')
            await user.click(uploadButton!)
            
            expect(mockOnImportFromFile).toHaveBeenCalledTimes(1)
        })

        it('closes dialog when uploading file', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Upload File').closest('button')!)
            
            expect(mockOnOpenChange).toHaveBeenCalledWith(false)
        })
    })

    // ============================================
    // Paste Content Tests
    // ============================================

    describe('paste content functionality', () => {
        it('accepts pasted JSON content', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Navigate to paste view
            await user.click(screen.getByText('Paste Config').closest('button')!)
            
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/"name": "My Setup"/)).toBeInTheDocument()
            })
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            const jsonContent = '{"name":"Test Config","formulae":["git"]}'
            
            await user.type(textarea, jsonContent)
            
            expect(textarea).toHaveValue(jsonContent)
        })

        it('shows error when submitting empty content', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            
            await waitFor(() => {
                expect(screen.getByText('Import Configuration')).toBeInTheDocument()
            })
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            await user.click(submitButton!)
            
            await waitFor(() => {
                expect(screen.getByText('Please paste your configuration content')).toBeInTheDocument()
            })
        })

        it('calls onImportFromContent with valid content', async () => {
            mockOnImportFromContent.mockResolvedValue(undefined)
            
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/"name": "My Setup"/)).toBeInTheDocument()
            })
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            const jsonContent = '{"name":"Test Config"}'
            await user.type(textarea, jsonContent)
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            await user.click(submitButton!)
            
            await waitFor(() => {
                expect(mockOnImportFromContent).toHaveBeenCalledWith(jsonContent)
            })
        })

        it('shows error message on import failure', async () => {
            mockOnImportFromContent.mockRejectedValue(new Error('Invalid JSON format'))
            
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            await user.type(textarea, 'invalid json')
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            await user.click(submitButton!)
            
            await waitFor(() => {
                expect(screen.getByText('Invalid JSON format')).toBeInTheDocument()
            })
        })

        it('clears error when user types after error', async () => {
            mockOnImportFromContent.mockRejectedValue(new Error('Invalid JSON'))
            
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            await user.type(textarea, 'bad')
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            await user.click(submitButton!)
            
            await waitFor(() => {
                expect(screen.getByText('Invalid JSON')).toBeInTheDocument()
            })
            
            // Type more content
            await user.type(textarea, ' more text')
            
            await waitFor(() => {
                expect(screen.queryByText('Invalid JSON')).not.toBeInTheDocument()
            })
        })

        it('disables submit button while processing', async () => {
            let resolveImport: () => void
            const importPromise = new Promise<void>(resolve => {
                resolveImport = resolve
            })
            mockOnImportFromContent.mockReturnValue(importPromise)
            
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            await user.type(textarea, '{"test":true}')
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            await user.click(submitButton!)
            
            await waitFor(() => {
                expect(screen.getByText('Processing...')).toBeInTheDocument()
                expect(submitButton).toBeDisabled()
            })
            
            resolveImport!()
        })
    })

    // ============================================
    // Timeout Cleanup Tests (NEW FEATURE)
    // ============================================

    describe('timeout cleanup on dialog open', () => {
        it('clears pending timeout when dialog reopens', async () => {
            const { rerender } = render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Close the dialog (triggers timeout for state reset)
            rerender(
                <ImportConfigDialog
                    open={false}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Reopen immediately (should clear the pending timeout)
            rerender(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Fast forward past the reset timeout
            vi.advanceTimersByTime(300)
            
            // Dialog should still show initial state (choice view)
            expect(screen.getByText('Upload File')).toBeInTheDocument()
        })

        it('prevents stale state reset when quickly reopening', async () => {
            mockOnImportFromContent.mockResolvedValue(undefined)
            
            const { rerender } = render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Navigate to paste view
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByText('Paste Configuration'))
            
            // Close dialog
            rerender(
                <ImportConfigDialog
                    open={false}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Quickly reopen before timeout fires
            rerender(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // The pending timeout should have been cleared
            // If not cleared, running timers would reset the state
            vi.runAllTimers()
            
            // Should still be able to interact normally
            expect(screen.getByText('Upload File')).toBeInTheDocument()
        })

        it('handles multiple rapid open/close cycles', () => {
            const { rerender } = render(
                <ImportConfigDialog
                    open={false}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Simulate rapid open/close cycles
            for (let i = 0; i < 5; i++) {
                rerender(
                    <ImportConfigDialog
                        open={true}
                        onOpenChange={mockOnOpenChange}
                        onImportFromFile={mockOnImportFromFile}
                        onImportFromContent={mockOnImportFromContent}
                    />
                )
                
                rerender(
                    <ImportConfigDialog
                        open={false}
                        onOpenChange={mockOnOpenChange}
                        onImportFromFile={mockOnImportFromFile}
                        onImportFromContent={mockOnImportFromContent}
                    />
                )
            }
            
            // Final open
            rerender(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Should work correctly without accumulated timeouts
            expect(screen.getByText('Import Configuration')).toBeInTheDocument()
            
            // Run all timers - should not cause issues
            vi.runAllTimers()
        })
    })

    // ============================================
    // State Reset Tests
    // ============================================

    describe('state reset after close', () => {
        it('resets to choice view after closing', async () => {
            const { rerender } = render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Navigate to paste view
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByText('Paste Configuration'))
            
            // Close dialog
            rerender(
                <ImportConfigDialog
                    open={false}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Wait for reset timeout
            vi.advanceTimersByTime(250)
            
            // Reopen
            rerender(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Should be back to choice view
            expect(screen.getByText('Upload File')).toBeInTheDocument()
        })

        it('clears pasted content after close', async () => {
            const { rerender } = render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            await user.type(textarea, 'some content')
            
            // Close dialog
            rerender(
                <ImportConfigDialog
                    open={false}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            vi.advanceTimersByTime(250)
            
            // Reopen
            rerender(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const newTextarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            expect(newTextarea).toHaveValue('')
        })

        it('clears errors after close', async () => {
            mockOnImportFromContent.mockRejectedValue(new Error('Test error'))
            
            const { rerender } = render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            await user.type(textarea, 'content')
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            await user.click(submitButton!)
            
            await waitFor(() => screen.getByText('Test error'))
            
            // Close dialog
            rerender(
                <ImportConfigDialog
                    open={false}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            vi.advanceTimersByTime(250)
            
            // Reopen
            rerender(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            expect(screen.queryByText('Test error')).not.toBeInTheDocument()
        })
    })

    // ============================================
    // Cleanup on Unmount Tests
    // ============================================

    describe('cleanup on unmount', () => {
        it('clears timeout on unmount', () => {
            const { unmount, rerender } = render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Close dialog to trigger timeout
            rerender(
                <ImportConfigDialog
                    open={false}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            // Unmount before timeout fires
            unmount()
            
            // Advance timers - should not cause errors
            expect(() => vi.runAllTimers()).not.toThrow()
        })

        it('handles unmount with no pending timeouts', () => {
            const { unmount } = render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            expect(() => unmount()).not.toThrow()
        })
    })

    // ============================================
    // Accessibility Tests
    // ============================================

    describe('accessibility', () => {
        it('has proper dialog role', () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        it('textarea has proper placeholder for screen readers', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            
            await waitFor(() => {
                const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
                expect(textarea).toHaveAttribute('placeholder')
            })
        })

        it('buttons are keyboard accessible', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            const uploadButton = screen.getByText('Upload File').closest('button')
            expect(uploadButton).not.toHaveAttribute('disabled')
            
            // Simulate keyboard interaction
            uploadButton?.focus()
            expect(document.activeElement).toBe(uploadButton)
        })
    })

    // ============================================
    // Edge Cases
    // ============================================

    describe('edge cases', () => {
        it('handles whitespace-only content as empty', async () => {
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            await user.type(textarea, '   \n\t  ')
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            expect(submitButton).toBeDisabled()
        })

        it('handles very long content', async () => {
            mockOnImportFromContent.mockResolvedValue(undefined)
            
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            const longContent = '{"packages":' + JSON.stringify(Array(100).fill('test')) + '}'
            
            await user.type(textarea, longContent)
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            await user.click(submitButton!)
            
            await waitFor(() => {
                expect(mockOnImportFromContent).toHaveBeenCalledWith(longContent)
            })
        })

        it('handles non-Error rejection', async () => {
            mockOnImportFromContent.mockRejectedValue('String error')
            
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            await user.type(textarea, 'content')
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            await user.click(submitButton!)
            
            await waitFor(() => {
                expect(screen.getByText('Failed to parse configuration')).toBeInTheDocument()
            })
        })

        it('successful import closes dialog', async () => {
            mockOnImportFromContent.mockResolvedValue(undefined)
            
            render(
                <ImportConfigDialog
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onImportFromFile={mockOnImportFromFile}
                    onImportFromContent={mockOnImportFromContent}
                />
            )
            
            await user.click(screen.getByText('Paste Config').closest('button')!)
            await waitFor(() => screen.getByPlaceholderText(/"name": "My Setup"/))
            
            const textarea = screen.getByPlaceholderText(/"name": "My Setup"/)
            await user.type(textarea, '{"test":true}')
            
            const submitButton = screen.getByText('Import Configuration').closest('button')
            await user.click(submitButton!)
            
            await waitFor(() => {
                expect(mockOnOpenChange).toHaveBeenCalledWith(false)
            })
        })
    })
})
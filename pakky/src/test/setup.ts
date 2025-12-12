/**
 * Vitest Global Setup
 * 
 * This file runs before each test file and sets up:
 * - Testing Library matchers
 * - Electron IPC mocks
 * - Window/DOM mocks as needed
 */

import '@testing-library/jest-dom/vitest'
import { vi, beforeEach, afterEach } from 'vitest'

// ============================================
// Electron IPC Mocks
// ============================================

/**
 * Mock window.electronAPI for renderer tests
 * Individual tests can override specific methods as needed
 */
const mockElectronAPI = {
    // Install API
    installAPI: {
        getInstalled: vi.fn().mockResolvedValue({ formulae: [], casks: [] }),
        checkHomebrew: vi.fn().mockResolvedValue(true),
        installHomebrew: vi.fn().mockResolvedValue(true),
        startInstallation: vi.fn().mockResolvedValue({ success: true }),
        cancelInstallation: vi.fn().mockResolvedValue({ cancelled: true }),
        onProgress: vi.fn().mockReturnValue(() => { }),
        onLog: vi.fn().mockReturnValue(() => { }),
    },

    // Config API
    configAPI: {
        loadConfig: vi.fn().mockResolvedValue(null),
        saveConfig: vi.fn().mockResolvedValue({ success: true }),
        importConfig: vi.fn().mockResolvedValue(null),
        exportConfig: vi.fn().mockResolvedValue({ success: true }),
    },

    // Presets API
    presetsAPI: {
        getBuiltInPresets: vi.fn().mockResolvedValue([]),
        loadPreset: vi.fn().mockResolvedValue(null),
    },

    // User Config API
    userConfigAPI: {
        load: vi.fn().mockResolvedValue({}),
        save: vi.fn().mockResolvedValue(undefined),
    },

    // Search API
    searchAPI: {
        searchFormulae: vi.fn().mockResolvedValue([]),
        searchCasks: vi.fn().mockResolvedValue([]),
    },

    // Window API
    windowAPI: {
        setOnboardingSize: vi.fn(),
        setNormalSize: vi.fn(),
        minimize: vi.fn(),
        maximize: vi.fn(),
        close: vi.fn(),
    },

    // System API
    systemAPI: {
        getPlatform: vi.fn().mockReturnValue('darwin'),
        getVersion: vi.fn().mockReturnValue('1.0.0'),
    },

    // Shell API
    shellAPI: {
        openExternal: vi.fn().mockResolvedValue(undefined),
        openPath: vi.fn().mockResolvedValue(undefined),
    },
}

// Attach mocks to window
Object.defineProperty(window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true,
})

// Export for use in tests
export { mockElectronAPI }

// ============================================
// Global Test Hooks
// ============================================

beforeEach(() => {
    // Clear all mock history before each test
    vi.clearAllMocks()
})

afterEach(() => {
    // Cleanup after each test
})

// ============================================
// Console Mocks (optional - uncomment to silence)
// ============================================

// Uncomment to suppress console during tests
// vi.spyOn(console, 'log').mockImplementation(() => {})
// vi.spyOn(console, 'warn').mockImplementation(() => {})
// vi.spyOn(console, 'error').mockImplementation(() => {})

// ============================================
// Custom Matchers (if needed later)
// ============================================

// Example: Add custom matchers here
// expect.extend({
//   toBeInQueue(received, packageName) {
//     const pass = received.packages.some(p => p.name === packageName)
//     return {
//       pass,
//       message: () => `expected queue ${pass ? 'not ' : ''}to contain ${packageName}`,
//     }
//   },
// })

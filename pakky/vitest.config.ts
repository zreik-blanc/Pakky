/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
    test: {
        // Use happy-dom for faster tests (can switch to jsdom if needed)
        environment: 'happy-dom',
        // Setup files run before each test file
        setupFiles: ['./src/test/setup.ts'],
        // Include patterns - co-located tests next to source files
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        // Exclude patterns
        exclude: ['node_modules', 'dist', 'dist-electron', 'build'],
        // Global test timeout
        testTimeout: 10000,
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
            include: [
                'src/lib/**/*.ts',
                'src/stores/**/*.ts',
                'src/hooks/**/*.ts',
            ],
            exclude: [
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/test/**/*',
                '**/*.d.ts',
                'src/lib/constants/**', // Constants don't need testing
                'src/lib/types.ts', // Type definitions
                'src/lib/animations/**', // Animation variants/components
            ],
            // Start at 40%, increase over time
            thresholds: {
                statements: 40,
                branches: 40,
                functions: 40,
                lines: 40,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, './shared'),
        },
    },
})

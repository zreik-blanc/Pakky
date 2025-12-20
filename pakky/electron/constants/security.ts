/**
 * Content Security Policy Constants
 * CSP headers for development and production
 *
 * Note: 'unsafe-inline' for scripts is allowed in dev mode to support Vite HMR.
 * 'unsafe-eval' was removed to prevent dynamic code execution vulnerabilities.
 * WebSocket is restricted to the specific Vite dev server port.
 */

export const CSP = {
    // Dev mode: Allow Vite HMR via specific WebSocket port, no unsafe-eval
    DEV: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws://localhost:5173",
    // Production: Strict CSP, no inline scripts
    PROD: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:",
} as const;

/**
 * Simple in-memory rate limiter for IPC handlers
 * Prevents DoS attacks from malicious renderer processes
 */

interface RateLimitConfig {
    maxRequests: number;  // Maximum requests allowed in the window
    windowMs: number;     // Time window in milliseconds
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig = { maxRequests: 100, windowMs: 1000 }) {
        this.config = config;

        // Cleanup old entries periodically
        setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Check if a request should be allowed
     * @param key - Unique identifier for the rate limit bucket (e.g., sender ID + channel)
     * @returns true if the request should be allowed, false if rate limited
     */
    allow(key: string): boolean {
        const now = Date.now();
        const entry = this.limits.get(key);

        if (!entry || now > entry.resetTime) {
            // First request or window has expired
            this.limits.set(key, {
                count: 1,
                resetTime: now + this.config.windowMs
            });
            return true;
        }

        if (entry.count >= this.config.maxRequests) {
            // Rate limit exceeded
            return false;
        }

        // Increment count
        entry.count++;
        return true;
    }

    /**
     * Get remaining requests for a key
     */
    remaining(key: string): number {
        const entry = this.limits.get(key);
        if (!entry || Date.now() > entry.resetTime) {
            return this.config.maxRequests;
        }
        return Math.max(0, this.config.maxRequests - entry.count);
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }
}

// Default rate limiter instance for IPC handlers
// Allows 100 requests per second per channel
export const ipcRateLimiter = new RateLimiter({
    maxRequests: 100,
    windowMs: 1000
});

// Stricter rate limiter for sensitive operations
// Allows 10 requests per second
export const strictRateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 1000
});

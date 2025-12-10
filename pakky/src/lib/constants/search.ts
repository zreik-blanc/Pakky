/**
 * Search Configuration Constants
 * Package search behavior settings
 */

export const SEARCH = {
    /** Minimum characters to trigger search */
    MIN_QUERY_LENGTH: 2,
    /** Maximum characters allowed in search */
    MAX_QUERY_LENGTH: 100,
    /** Debounce delay for search input (ms) */
    DEBOUNCE_MS: 300,
    /** Maximum search results to show */
    MAX_RESULTS: 15,
    /** Maximum results per category (formula/cask) */
    MAX_RESULTS_PER_CATEGORY: 10,
} as const;

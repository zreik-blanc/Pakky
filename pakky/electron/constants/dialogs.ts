/**
 * Dialog Constants
 * Configuration for file dialogs
 */

export const DIALOGS = {
    CONFIG_SELECT: {
        TITLE: 'Select Pakky Configuration',
        FILTERS: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    },
    CONFIG_SAVE: {
        TITLE: 'Save Pakky Configuration',
        DEFAULT_PATH: 'pakky-config.json',
        FILTERS: [
            { name: 'JSON Files', extensions: ['json'] },
        ],
    },
};

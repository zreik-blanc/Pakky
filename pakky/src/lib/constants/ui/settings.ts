/**
 * Settings Page UI Strings
 */

export const SETTINGS = {
    TITLE: 'Settings',
    DESCRIPTION: 'Manage your preferences',
    PROFILE_TITLE: 'Profile',
    PROFILE_DESCRIPTION: 'Your personal information',
    NAME_LABEL: 'Name',
    SAVING: 'Saving...',
    PLATFORM_LABEL: 'Platform',
    ARCH_LABEL: 'Architecture',
    HOSTNAME_LABEL: 'Hostname',
    FIRST_LAUNCH_LABEL: 'First Launch',
    ABOUT_TITLE: 'About',
    ABOUT_DESCRIPTION: 'Application information',
    VERSION_LABEL: 'Version',
    PACKAGE_MANAGER_LABEL: 'Package Manager',
    DANGER_ZONE_TITLE: 'Danger Zone',
    DANGER_ZONE_DESCRIPTION: 'Irreversible actions',
    RESET_TITLE: 'Reset Configuration',
    RESET_DESCRIPTION: 'Clear all settings and restart onboarding',
    RESET_BUTTON: 'Reset',
    RESETTING_BUTTON: 'Resetting...',
    QUIT_TITLE: 'Quit Application',
    QUIT_DESCRIPTION: 'Close Pakky completely',
    RESET_DIALOG_TITLE: 'Reset Configuration',
    RESET_DIALOG_DESCRIPTION: 'This action cannot be undone.',
    RESET_WARNING: 'Are you sure you want to reset your configuration? This will:',
    RESET_WARNING_ITEMS: [
        'Clear all your settings',
        'Remove your profile information',
        'Restart the onboarding process'
    ] as const,
} as const;

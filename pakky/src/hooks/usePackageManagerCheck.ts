import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { installAPI } from '@/lib/electron';
import { UI_STRINGS } from '@/lib/constants';

interface UsePackageManagerCheckProps {
    platform: string | undefined;
}

/**
 * Package manager configuration per OS
 * Extensible for future Windows (winget/chocolatey) and Linux (apt/dnf) support
 */
const PACKAGE_MANAGER_CONFIG = {
    macos: {
        name: 'Homebrew',
        check: () => installAPI.checkHomebrew(),
        install: () => installAPI.installHomebrew(),
        errorMessage: UI_STRINGS.HOME.HOMEBREW_INSTALL_ERROR,
    },
    // Future: Add Windows and Linux package managers
    // windows: {
    //     name: 'Winget',
    //     check: () => installAPI.checkWinget(),
    //     install: () => installAPI.installWinget(),
    //     errorMessage: 'Failed to set up Winget',
    // },
    // linux: {
    //     name: 'apt/dnf',
    //     check: () => Promise.resolve(true), // Usually pre-installed
    //     install: () => Promise.resolve(),
    //     errorMessage: 'Package manager not found',
    // },
} as const;

type SupportedPlatform = keyof typeof PACKAGE_MANAGER_CONFIG;

/**
 * Hook to check if the platform's package manager is installed and handle its installation.
 * Currently supports macOS (Homebrew), extensible for Windows (Winget) and Linux (apt/dnf).
 */
export function usePackageManagerCheck({ platform }: UsePackageManagerCheckProps) {
    const [isMissing, setIsMissing] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    // Check for package manager on mount
    useEffect(() => {
        const config = platform ? PACKAGE_MANAGER_CONFIG[platform as SupportedPlatform] : null;

        if (config) {
            config.check().then(isInstalled => {
                setIsMissing(!isInstalled);
            });
        }
    }, [platform]);

    const handleInstall = async () => {
        const config = platform ? PACKAGE_MANAGER_CONFIG[platform as SupportedPlatform] : null;
        if (!config) return;

        setIsInstalling(true);
        try {
            await config.install();
            setIsMissing(false);
        } catch (error) {
            console.error(`Failed to install ${config.name}:`, error);
            toast.error(config.errorMessage);
        } finally {
            setIsInstalling(false);
        }
    };

    const packageManagerName = platform
        ? PACKAGE_MANAGER_CONFIG[platform as SupportedPlatform]?.name
        : undefined;

    return {
        // Generic names for future compatibility
        isMissing,
        isInstalling,
        handleInstall,
        packageManagerName,
        // Legacy aliases for backward compatibility (can remove later)
        isHomebrewMissing: isMissing,
        isInstallingHomebrew: isInstalling,
        handleInstallHomebrew: handleInstall,
    };
}

// Legacy export alias for backward compatibility
export const useHomebrewCheck = usePackageManagerCheck;

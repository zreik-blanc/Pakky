import { useState, useEffect } from 'react';
import { installAPI } from '@/lib/electron';
import { UI_STRINGS } from '@/lib/strings';

interface UseHomebrewCheckProps {
    platform: string | undefined;
}

/**
 * Hook to check if Homebrew is installed and handle its installation.
 */
export function useHomebrewCheck({ platform }: UseHomebrewCheckProps) {
    const [isHomebrewMissing, setIsHomebrewMissing] = useState(false);
    const [isInstallingHomebrew, setIsInstallingHomebrew] = useState(false);

    // Check for Homebrew on mount
    useEffect(() => {
        if (platform === 'macos') {
            installAPI.checkHomebrew().then(isInstalled => {
                setIsHomebrewMissing(!isInstalled);
            });
        }
    }, [platform]);

    const handleInstallHomebrew = async () => {
        setIsInstallingHomebrew(true);
        try {
            await installAPI.installHomebrew();
            setIsHomebrewMissing(false);
        } catch (error) {
            console.error('Failed to install Homebrew:', error);
            alert(UI_STRINGS.HOME.HOMEBREW_INSTALL_ERROR);
        } finally {
            setIsInstallingHomebrew(false);
        }
    };

    return {
        isHomebrewMissing,
        isInstallingHomebrew,
        handleInstallHomebrew,
    };
}

import { useState, useEffect } from 'react';
import { systemAPI, userConfigAPI, windowAPI } from '@/lib/electron';
import type { Platform, SystemInfo, UserConfig } from '@/lib/types';

export function useAppInitialization() {
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [showMainApp, setShowMainApp] = useState(false);
    const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
    const [configError, setConfigError] = useState<string | null>(null);

    useEffect(() => {
        const initApp = async () => {
            try {
                // 1. Get System Info
                const info = await systemAPI.getSystemInfo();
                const sysInfo = {
                    platform: info.platform as Platform,
                    arch: info.arch,
                    version: info.version,
                    homeDir: info.homeDir,
                    hostname: info.hostname,
                };
                setSystemInfo(sysInfo);

                // 2. Check User Config (Onboarding Status)
                const storedConfig = await userConfigAPI.read();
                if (storedConfig) {
                    setUserConfig(storedConfig);
                }

                if (!storedConfig) {
                    // First launch - keep small window for onboarding
                    setIsOnboarding(true);
                } else {
                    // Returning user - window already started at normal size

                    // Show main app immediately (no animation needed)
                    setShowMainApp(true);

                    // Update last seen
                    await userConfigAPI.save({
                        userName: storedConfig.userName,
                        systemInfo: sysInfo,
                        queue: storedConfig.queue
                    });
                }
            } catch (error: unknown) {
                console.error('Failed to initialize app:', error);

                if (error instanceof Error && error.message.includes('CONFIG_CORRUPTED')) {
                    setConfigError('corrupted');
                    setIsLoading(false);
                    return;
                }

                // Fallback for development if everything fails
                setSystemInfo({
                    platform: 'macos',
                    arch: 'arm64',
                    version: '14.0',
                    homeDir: '/Users/dev',
                    hostname: 'dev-machine',
                });
            } finally {
                setIsLoading(false);
            }
        };

        initApp();
    }, []);

    const handleOnboardingComplete = async () => {
        try {
            // Resize window to normal app size with animation
            await windowAPI.setNormalSize();
        } catch (error) {
            console.error('[App] Failed to resize window:', error);
        }
        // Short delay to let resize animation start before React re-render
        setTimeout(() => {
            setIsOnboarding(false);
            // Trigger fade-in animation for main app
            setTimeout(() => setShowMainApp(true), 50);
        }, 100);
    };

    return {
        systemInfo,
        isLoading,
        isOnboarding,
        showMainApp,
        configError,
        handleOnboardingComplete,
        userConfig,
    };
}

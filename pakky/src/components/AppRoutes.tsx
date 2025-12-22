import { lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import type { SystemInfo, UserConfig } from '@/lib/types';
import { spinnerTransition } from '@/lib/animations';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/Home'));
const PresetsPage = lazy(() => import('@/pages/Presets'));
const SettingsPage = lazy(() => import('@/pages/Settings'));

// Loading fallback component
function PageLoader() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={spinnerTransition}
                >
                    <Loader2 className="w-8 h-8 text-primary" />
                </motion.div>
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        </div>
    );
}

interface AppRoutesProps {
    currentPage: 'home' | 'presets' | 'settings';
    systemInfo: SystemInfo | null;
    userConfig: UserConfig | null;
    onNavigate: (page: 'home' | 'presets' | 'settings') => void;
}

export function AppRoutes({
    currentPage,
    systemInfo,
    userConfig,
    onNavigate,
}: AppRoutesProps) {
    if (currentPage === 'settings') {
        return (
            <Suspense fallback={<PageLoader />}>
                <SettingsPage />
            </Suspense>
        );
    }

    if (currentPage === 'presets') {
        return (
            <Suspense fallback={<PageLoader />}>
                <PresetsPage onNavigateHome={() => onNavigate('home')} />
            </Suspense>
        );
    }

    // Default to home
    return (
        <Suspense fallback={<PageLoader />}>
            <HomePage
                systemInfo={systemInfo}
                userConfig={userConfig}
                onNavigateToPresets={() => onNavigate('presets')}
            />
        </Suspense>
    );
}

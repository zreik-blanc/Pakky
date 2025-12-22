import { motion, AnimatePresence } from 'motion/react';
import OnboardingPage from '@/pages/Onboarding';
import type { SystemInfo } from '@/lib/types';

interface OnboardingOverlayProps {
    isOnboarding: boolean;
    systemInfo: SystemInfo | null;
    onComplete: () => void;
}

/**
 * Onboarding overlay that renders on top of the main app during first launch.
 * Fades out when onboarding is complete, allowing the main app to show through.
 */
export function OnboardingOverlay({
    isOnboarding,
    systemInfo,
    onComplete,
}: OnboardingOverlayProps) {
    return (
        <AnimatePresence>
            {isOnboarding && (
                <>
                    {/* Onboarding Background - Fades out independently */}
                    <motion.div
                        key="onboarding-bg"
                        className="fixed inset-0 z-50 bg-background"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    />
                    {/* Onboarding Content - Stays visible during exit for logo morph */}
                    <motion.div
                        key="onboarding-content"
                        className="fixed inset-0 z-50 pointer-events-none"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="w-full h-full pointer-events-auto">
                            <OnboardingPage
                                systemInfo={systemInfo}
                                onComplete={onComplete}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

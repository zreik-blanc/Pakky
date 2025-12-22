import { motion } from 'motion/react';
import { UI_STRINGS } from '@/lib/constants';
import { spinnerTransition, pulseTransition } from '@/lib/animations';

/**
 * Full-screen loading spinner shown during app initialization
 */
export function LoadingScreen() {
    return (
        <div className="h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <motion.div
                    className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={spinnerTransition}
                />
                <motion.p
                    className="text-muted-foreground"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={pulseTransition}
                >
                    {UI_STRINGS.COMMON.LOADING_APP}
                </motion.p>
            </div>
        </div>
    );
}

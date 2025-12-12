import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, FileWarning, RefreshCw, Power } from 'lucide-react';
import { systemAPI, userConfigAPI } from '@/lib/electron';
import { fadeIn, scaleIn, pulseTransition, spinnerTransition } from '@/lib/animations';

export function ConfigCorruptionAlert() {
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        setIsResetting(true);
        try {
            await userConfigAPI.reset();
            // Reload the window to clear state and restart flow
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset config:', error);
            setIsResetting(false);
        }
    };

    const handleQuit = async () => {
        await systemAPI.quitApp();
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
        >
            <motion.div
                className="bg-card w-full max-w-lg border border-destructive/20 rounded-2xl shadow-2xl overflow-hidden"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <div className="bg-destructive/10 p-6 flex flex-col items-center gap-4 border-b border-destructive/10">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                        <motion.div
                            animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1, 0.95] }}
                            transition={pulseTransition}
                        >
                            <FileWarning className="w-8 h-8 text-destructive" />
                        </motion.div>
                    </div>
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-destructive">Configuration Corrupted</h2>
                        <p className="text-muted-foreground text-sm">
                            We encountered a critical error while reading your configuration file.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg flex gap-3 text-sm text-muted-foreground">
                        <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                        <p>
                            To prevent data loss or crashes, Pakky cannot continue with the current configuration.
                            You can reset the application to its default state. A backup of your corrupted file will be saved.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleQuit}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors font-medium text-muted-foreground hover:text-foreground"
                        >
                            <Power className="w-4 h-4" />
                            Quit App
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={isResetting}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium shadow-sm active:scale-[0.98]"
                        >
                            {isResetting ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={spinnerTransition}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </motion.div>
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            {isResetting ? 'Resetting...' : 'Reset & Restart'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

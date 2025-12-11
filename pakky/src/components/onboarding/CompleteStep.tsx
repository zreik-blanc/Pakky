import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Package } from 'lucide-react';

interface CompleteStepProps {
    isExiting?: boolean;
    onMorphComplete?: () => void;
}

export function CompleteStep({ isExiting = false, onMorphComplete }: CompleteStepProps) {
    const [showLogo, setShowLogo] = useState(false);
    const hasCalledComplete = useRef(false);

    // Start the morph animation after a brief delay
    useEffect(() => {
        const morphTimer = setTimeout(() => {
            setShowLogo(true);
        }, 800); // Wait 800ms before morphing

        return () => clearTimeout(morphTimer);
    }, []);

    // Notify parent when morph is complete (only once)
    useEffect(() => {
        if (showLogo && onMorphComplete && !hasCalledComplete.current) {
            hasCalledComplete.current = true;
            const completeTimer = setTimeout(() => {
                onMorphComplete();
            }, 600); // Wait for morph animation to complete
            return () => clearTimeout(completeTimer);
        }
    }, [showLogo, onMorphComplete]);

    return (
        <div
            className="text-center space-y-8"
        >
            {/* Animated icon container */}
            <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
                {/* Success glow - only visible before morph */}
                <AnimatePresence>
                    {!showLogo && !isExiting && (
                        <motion.div
                            className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    )}
                </AnimatePresence>

                {/* Morph container with shared layoutId */}
                <motion.div
                    layoutId="pakky-logo"
                    className="relative flex items-center justify-center"
                    style={{
                        width: showLogo ? 40 : 112,
                        height: showLogo ? 40 : 112,
                    }}
                    transition={{
                        layout: {
                            type: 'tween',
                            ease: [0.32, 0.72, 0, 1],
                            duration: 0.8
                        }
                    }}
                >
                    {/* Checkmark circle - morphs into logo bg */}
                    <motion.div
                        className="absolute inset-0 rounded-lg flex items-center justify-center ring-1"
                        initial={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderRadius: '9999px',
                        }}
                        animate={{
                            backgroundColor: showLogo
                                ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.1)'
                                : 'rgba(34, 197, 94, 0.1)',
                            borderRadius: showLogo ? '8px' : '9999px',
                            boxShadow: showLogo
                                ? '0 0 0 1px rgba(var(--primary-rgb, 59, 130, 246), 0.2)'
                                : '0 0 0 2px rgba(34, 197, 94, 0.4), 0 25px 50px -12px rgba(34, 197, 94, 0.2)',
                        }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />

                    {/* Checkmark icon - fades out */}
                    <AnimatePresence mode="wait">
                        {!showLogo ? (
                            <motion.div
                                key="checkmark"
                                initial={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-14 h-14 text-green-500 drop-shadow-lg" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="logo"
                                initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <Package className="w-5 h-5 text-primary" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Text content - fades out after morph */}
            <motion.div
                className="space-y-3"
                animate={{
                    opacity: showLogo || isExiting ? 0 : 1,
                    y: showLogo || isExiting ? -20 : 0,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <h2 className="text-3xl font-bold tracking-tight text-green-500">
                    All set!
                </h2>
                <p className="text-muted-foreground text-base">
                    Taking you to Pakky...
                </p>
            </motion.div>

            {/* Loading dots - fade out immediately when morphing */}
            <motion.div
                className="flex justify-center"
                animate={{
                    opacity: showLogo || isExiting ? 0 : 1,
                }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-green-500"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

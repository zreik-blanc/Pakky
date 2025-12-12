import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { floatTransition, smoothSpring } from '@/lib/animations';

interface OnboardingBackgroundProps {
    currentStepIndex: number;
    totalSteps: number;
    isExiting?: boolean;
}

export function OnboardingBackground({ currentStepIndex, totalSteps, isExiting = false }: OnboardingBackgroundProps) {
    return (
        <>
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: isExiting ? 0 : 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                {/* Animated background orbs */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <AnimatePresence>
                        {!isExiting && (
                            <>
                                <motion.div
                                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ ...floatTransition, duration: 8 }}
                                    exit={{ opacity: 0 }}
                                />
                                <motion.div
                                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[80px]"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ ...floatTransition, duration: 10, delay: 2 }}
                                    exit={{ opacity: 0 }}
                                />
                            </>
                        )}
                    </AnimatePresence>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 -z-10">
                    <AnimatePresence>
                        {!isExiting && [...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full bg-primary/20"
                                style={{
                                    width: `${4 + (i % 3) * 2}px`,
                                    height: `${4 + (i % 3) * 2}px`,
                                    left: `${15 + i * 10}%`,
                                    top: `${25 + (i % 4) * 15}%`,
                                }}
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                    ...floatTransition,
                                    duration: 6 + i * 0.8,
                                    delay: i * 0.7,
                                }}
                                exit={{ opacity: 0 }}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Progress dots - Detached from fading background to allow independent animation */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                {[...Array(totalSteps - 1)].map((_, i) => {
                    const isCompleteStep = currentStepIndex === totalSteps - 1;
                    return (
                        <motion.div
                            key={i}
                            className={cn(
                                "rounded-full",
                                i <= currentStepIndex
                                    ? "bg-primary shadow-sm shadow-primary/50"
                                    : "bg-muted/50"
                            )}
                            animate={{
                                width: i <= currentStepIndex ? 10 : 8,
                                height: i <= currentStepIndex ? 10 : 8,
                                opacity: isExiting ? 0 : (isCompleteStep ? [1, 0.4, 1] : 1),
                            }}
                            transition={{
                                ...smoothSpring,
                                opacity: isExiting ? {
                                    duration: 0.8,
                                    ease: "easeOut"
                                } : (isCompleteStep ? {
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.2
                                } : { duration: 0 })
                            }}
                        />
                    );
                })}
            </div>
        </>
    );
}

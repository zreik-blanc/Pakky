import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SystemInfo } from '@/lib/types';
import { userConfigAPI } from '@/lib/electron';
import { fadeInUp, pageTransition } from '@/lib/animations';
import {
    WelcomeStep,
    NameStep,
    SystemStep,
    CompleteStep,
    OnboardingBackground
} from '@/components/onboarding';

interface OnboardingPageProps {
    systemInfo: SystemInfo | null;
    onComplete: () => void;
}

type Step = 'welcome' | 'name' | 'system' | 'complete';

export default function OnboardingPage({ systemInfo, onComplete }: OnboardingPageProps) {
    const [step, setStep] = useState<Step>('welcome');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const transitionToStep = useCallback((nextStep: Step) => {
        if (isTransitioning) return;
        setIsTransitioning(true);

        // Wait for exit animation before changing step
        setTimeout(() => {
            setStep(nextStep);
            setIsTransitioning(false);
        }, 300);
    }, [isTransitioning]);

    const handleNext = () => {
        if (step === 'welcome') transitionToStep('name');
        else if (step === 'name') transitionToStep('system');
        else if (step === 'system') handleComplete();
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            await userConfigAPI.save({
                userName: name.trim() || 'User',
                systemInfo: systemInfo || undefined,
            });
            transitionToStep('complete');
            // The morph animation in CompleteStep will call onMorphComplete
            // which triggers the actual transition to the main app
        } catch (error) {
            console.error('Failed to save user config:', error);
            setIsSubmitting(false);
        }
    };

    const handleMorphComplete = () => {
        setIsExiting(true);
        // Trigger exit immediately to sync "Travel" (Unmount) with "Fade" (isExiting)
        onComplete();
    };

    const steps: Step[] = ['welcome', 'name', 'system', 'complete'];
    const currentStepIndex = steps.indexOf(step);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <OnboardingBackground
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                isExiting={isExiting}
            />

            {/* Main content with Motion animations */}
            <div className="max-w-md w-full">
                <AnimatePresence mode="wait">
                    {step === 'welcome' && !isTransitioning && (
                        <motion.div
                            key="welcome"
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <WelcomeStep onNext={handleNext} isTransitioning={isTransitioning} />
                        </motion.div>
                    )}

                    {step === 'name' && !isTransitioning && (
                        <motion.div
                            key="name"
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <NameStep
                                name={name}
                                onNameChange={setName}
                                onNext={handleNext}
                                isTransitioning={isTransitioning}
                            />
                        </motion.div>
                    )}

                    {step === 'system' && !isTransitioning && (
                        <motion.div
                            key="system"
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <SystemStep
                                name={name}
                                systemInfo={systemInfo}
                                onNext={handleNext}
                                isSubmitting={isSubmitting}
                                isTransitioning={isTransitioning}
                            />
                        </motion.div>
                    )}

                    {step === 'complete' && !isTransitioning && (
                        <motion.div
                            key="complete"
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={pageTransition}
                        >
                            <CompleteStep isExiting={isExiting} onMorphComplete={handleMorphComplete} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

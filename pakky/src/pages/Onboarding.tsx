import { useState, useEffect, useCallback } from 'react';
import type { SystemInfo } from '@/lib/types';
import { userConfigAPI } from '@/lib/electron';
import { cn } from '@/lib/utils';
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
    const [showContent, setShowContent] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Smooth content appearance
    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 150);
        return () => clearTimeout(timer);
    }, [step]);

    const transitionToStep = useCallback((nextStep: Step) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setShowContent(false);

        setTimeout(() => {
            setStep(nextStep);
            setIsTransitioning(false);
        }, 400);
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
        // Wait for fade-out animation to complete before calling onComplete
        setTimeout(onComplete, 300);
    };

    const steps: Step[] = ['welcome', 'name', 'system', 'complete'];
    const currentStepIndex = steps.indexOf(step);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-8 relative overflow-hidden">
            <OnboardingBackground
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                isExiting={isExiting}
            />

            {/* Main content */}
            <div
                className={cn(
                    "max-w-md w-full transition-all duration-500 ease-out",
                    showContent
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-6 scale-[0.98]"
                )}
            >
                {step === 'welcome' && (
                    <WelcomeStep onNext={handleNext} isTransitioning={isTransitioning} />
                )}

                {step === 'name' && (
                    <NameStep
                        name={name}
                        onNameChange={setName}
                        onNext={handleNext}
                        isTransitioning={isTransitioning}
                    />
                )}

                {step === 'system' && (
                    <SystemStep
                        name={name}
                        systemInfo={systemInfo}
                        onNext={handleNext}
                        isSubmitting={isSubmitting}
                        isTransitioning={isTransitioning}
                    />
                )}

                {step === 'complete' && <CompleteStep isExiting={isExiting} onMorphComplete={handleMorphComplete} />}
            </div>
        </div>
    );
}

import { cn } from '@/lib/utils';

interface OnboardingBackgroundProps {
    currentStepIndex: number;
    totalSteps: number;
    isExiting?: boolean;
}

export function OnboardingBackground({ currentStepIndex, totalSteps, isExiting = false }: OnboardingBackgroundProps) {
    return (
        <div
            className={cn(
                "transition-opacity duration-500 ease-out",
                isExiting ? "opacity-0" : "opacity-100"
            )}
        >
            {/* Animated background orbs */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"
                    style={{ animation: isExiting ? 'none' : 'float 8s ease-in-out infinite' }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[80px]"
                    style={{ animation: isExiting ? 'none' : 'float 10s ease-in-out infinite', animationDelay: '2s' }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 -z-10">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-primary/20"
                        style={{
                            width: `${4 + (i % 3) * 2}px`,
                            height: `${4 + (i % 3) * 2}px`,
                            left: `${15 + i * 10}%`,
                            top: `${25 + (i % 4) * 15}%`,
                            animation: isExiting ? 'none' : `float ${6 + i * 0.8}s ease-in-out infinite`,
                            animationDelay: `${i * 0.7}s`,
                        }}
                    />
                ))}
            </div>

            {/* Progress dots */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                {[...Array(totalSteps - 1)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "rounded-full transition-all duration-700 ease-out",
                            i <= currentStepIndex
                                ? "w-2.5 h-2.5 bg-primary shadow-sm shadow-primary/50"
                                : "w-2 h-2 bg-muted/50"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

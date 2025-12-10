import { Rocket, Sparkles, Stars, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeStepProps {
    onNext: () => void;
    isTransitioning: boolean;
}

export function WelcomeStep({ onNext, isTransitioning }: WelcomeStepProps) {
    return (
        <div className="text-center space-y-10">
            {/* Cool Rocket Icon */}
            <div className="relative mx-auto w-32 h-32">
                {/* Orbiting rings */}
                <div
                    className="absolute inset-0 rounded-full border-2 border-primary/20 border-dashed"
                    style={{ animation: 'spin 20s linear infinite' }}
                />
                <div
                    className="absolute inset-4 rounded-full border border-primary/10"
                    style={{ animation: 'spin 15s linear infinite reverse' }}
                />

                {/* Glow effect */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-primary/40 via-emerald-500/20 to-transparent rounded-full blur-2xl"
                    style={{ animation: 'pulse 3s ease-in-out infinite' }}
                />

                {/* Decorations */}
                <Stars
                    className="absolute -bottom-2 left-0 w-5 h-5 text-primary/40"
                    style={{ animation: 'twinkle 2s ease-in-out infinite' }}
                />
                <Zap
                    className="absolute bottom-4 -left-4 w-4 h-4 text-emerald-400/50"
                    style={{ animation: 'twinkle 2s ease-in-out infinite', animationDelay: '0.5s' }}
                />
                <Sparkles
                    className="absolute top-0 -right-2 w-6 h-6 text-primary/50"
                    style={{ animation: 'twinkle 2s ease-in-out infinite', animationDelay: '1s' }}
                />

                {/* Main rocket container */}
                <div className="relative w-32 h-32 bg-gradient-to-br from-card via-card to-background rounded-full flex items-center justify-center ring-2 ring-primary/30 shadow-2xl shadow-primary/20">
                    <div style={{ animation: 'rocketFloat 3s ease-in-out infinite' }}>
                        <Rocket className="w-16 h-16 text-primary transform -rotate-45" />
                        {/* Rocket trail */}
                        <div
                            className="absolute bottom-0 left-2 w-8 h-3 bg-gradient-to-l from-primary/60 via-orange-400/40 to-transparent blur-sm rounded-full"
                            style={{ animation: 'trail 0.5s ease-in-out infinite' }}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">
                    Welcome to{' '}
                    <span className="bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                        Pakky
                    </span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
                    Your personal package manager companion for macOS.
                </p>
            </div>

            <Button
                size="lg"
                className="gap-3 px-10 py-6 text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]"
                onClick={onNext}
                disabled={isTransitioning}
            >
                Let's get started
                <ArrowRight className="w-5 h-5" />
            </Button>
        </div>
    );
}

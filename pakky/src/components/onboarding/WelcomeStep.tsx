import { motion } from 'motion/react';
import { Rocket, Sparkles, Stars, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    spinnerTransition,
    pulseTransition,
    twinkleAnimation,
    twinkleTransition,
    rocketFloatAnimation,
    rocketFloatTransition,
    trailAnimation,
    trailTransition,
    gradientAnimation,
    gradientTransition,
} from '@/lib/animations';

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
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/20 border-dashed"
                    animate={{ rotate: 360 }}
                    transition={{ ...spinnerTransition, duration: 20 }}
                />
                <motion.div
                    className="absolute inset-4 rounded-full border border-primary/10"
                    animate={{ rotate: -360 }}
                    transition={{ ...spinnerTransition, duration: 15 }}
                />

                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/40 via-emerald-500/20 to-transparent rounded-full blur-2xl"
                    animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1, 0.95] }}
                    transition={pulseTransition}
                />

                {/* Decorations */}
                <motion.div
                    className="absolute -bottom-2 left-0"
                    animate={twinkleAnimation}
                    transition={twinkleTransition}
                >
                    <Stars className="w-5 h-5 text-primary/40" />
                </motion.div>
                <motion.div
                    className="absolute bottom-4 -left-4"
                    animate={twinkleAnimation}
                    transition={{ ...twinkleTransition, delay: 0.5 }}
                >
                    <Zap className="w-4 h-4 text-emerald-400/50" />
                </motion.div>
                <motion.div
                    className="absolute top-0 -right-2"
                    animate={twinkleAnimation}
                    transition={{ ...twinkleTransition, delay: 1 }}
                >
                    <Sparkles className="w-6 h-6 text-primary/50" />
                </motion.div>

                {/* Main rocket container */}
                <div className="relative w-32 h-32 bg-gradient-to-br from-card via-card to-background rounded-full flex items-center justify-center ring-2 ring-primary/30 shadow-2xl shadow-primary/20">
                    <motion.div
                        animate={rocketFloatAnimation}
                        transition={rocketFloatTransition}
                    >
                        <Rocket className="w-16 h-16 text-primary transform -rotate-45" />
                        {/* Rocket trail */}
                        <motion.div
                            className="absolute bottom-0 left-2 w-8 h-3 bg-gradient-to-l from-primary/60 via-orange-400/40 to-transparent blur-sm rounded-full"
                            animate={trailAnimation}
                            transition={trailTransition}
                        />
                    </motion.div>
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">
                    Welcome to{' '}
                    <motion.span
                        className="bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
                        animate={gradientAnimation}
                        transition={gradientTransition}
                    >
                        Pakky
                    </motion.span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
                    Your personal package manager companion for macOS.
                </p>
            </div>

            <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                <Button
                    size="lg"
                    className="gap-3 px-10 py-6 text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-shadow duration-500"
                    onClick={onNext}
                    disabled={isTransitioning}
                >
                    Let's get started
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </motion.div>
        </div>
    );
}

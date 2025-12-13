import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IsoCube } from '@/components/ui/IsoCube';
import {
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
            {/* Cool Iso-Cube Icon */}
            <div className="relative mx-auto w-40 h-40 flex items-center justify-center">

                {/* Ambient Glow behind cube */}
                <motion.div
                    className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full"
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                <IsoCube size={80} />
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-[#F9FAFB]">
                    Welcome to{' '}
                    <motion.span
                        className="bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
                        animate={gradientAnimation}
                        transition={gradientTransition}
                    >
                        Pakky
                    </motion.span>
                </h1>
                <p className="text-[#94A3B8] text-lg max-w-sm mx-auto leading-relaxed">
                    Your personal package manager companion for macOS.
                </p>
            </div>

            <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
                <Button
                    size="lg"
                    className="gap-3 px-10 py-6 text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300" // removed transition-shadow, use all
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

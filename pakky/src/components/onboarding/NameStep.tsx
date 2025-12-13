import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NameStepProps {
    name: string;
    onNameChange: (name: string) => void;
    onNext: () => void;
    isTransitioning: boolean;
}

export function NameStep({ name, onNameChange, onNext, isTransitioning }: NameStepProps) {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">What's your name?</h2>
                <p className="text-muted-foreground text-base">We'll use this to personalize your experience.</p>
            </div>

            <motion.div
                layoutId="onboarding-card"
                className="bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-8 shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
                <div className="space-y-5">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Enter your name"
                        className="flex h-14 w-full rounded-xl border-2 border-input/50 bg-background/60 px-5 py-2 text-lg ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 transition-all duration-200 ease-out"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && name.trim() && !isTransitioning) onNext();
                        }}
                    />

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                        <Button
                            className="w-full h-13 text-base gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={onNext}
                            disabled={!name.trim() || isTransitioning}
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </motion.div>
                </div>
            </motion.div>

            <p className="text-center text-sm text-muted-foreground/60">
                You can change this later in Settings
            </p>
        </div>
    );
}

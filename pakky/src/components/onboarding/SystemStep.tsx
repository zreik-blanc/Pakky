import { Cpu, Laptop, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SystemInfo } from '@/lib/types';

interface SystemStepProps {
    name: string;
    systemInfo: SystemInfo | null;
    onNext: () => void;
    isSubmitting: boolean;
    isTransitioning: boolean;
}

export function SystemStep({ name, systemInfo, onNext, isSubmitting, isTransitioning }: SystemStepProps) {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">Hi, {name || 'there'}! 👋</h2>
                <p className="text-muted-foreground text-base">Here's what we detected about your system.</p>
            </div>

            <div className="bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-8 shadow-2xl space-y-6">
                {systemInfo && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/20 rounded-xl p-5 space-y-3 border border-border/30 transition-all duration-300 hover:bg-muted/30">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Laptop className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-xs uppercase tracking-wider font-medium">Platform</span>
                            </div>
                            <div>
                                <p className="text-xl font-semibold capitalize">
                                    {systemInfo.platform === 'macos' ? 'macOS' : systemInfo.platform}
                                </p>
                                <p className="text-sm text-muted-foreground mt-0.5">{systemInfo.version}</p>
                            </div>
                        </div>

                        <div className="bg-muted/20 rounded-xl p-5 space-y-3 border border-border/30 transition-all duration-300 hover:bg-muted/30">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Cpu className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-xs uppercase tracking-wider font-medium">Architecture</span>
                            </div>
                            <div>
                                <p className="text-xl font-semibold">{systemInfo.arch}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {systemInfo.arch === 'arm64' ? 'Apple Silicon' : 'Intel'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <Button
                    className="w-full h-13 text-base gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={onNext}
                    disabled={isSubmitting || isTransitioning}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Setting up...
                        </>
                    ) : (
                        <>
                            Complete Setup
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

import { useState } from 'react';
import type { SystemInfo } from '@/lib/types';
import { userConfigAPI } from '@/lib/electron';
import { Cpu, Laptop, Monitor } from 'lucide-react';

interface OnboardingPageProps {
    systemInfo: SystemInfo | null;
    onComplete: () => void;
}

export default function OnboardingPage({ systemInfo, onComplete }: OnboardingPageProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await userConfigAPI.save({
                userName: name.trim(),
                systemInfo: systemInfo || undefined,
            });
            onComplete();
        } catch (error) {
            console.error('Failed to save user config:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />

            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Welcome to Pakky
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Your personal package manager companion.
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                What should we call you?
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="flex h-12 w-full rounded-lg border border-input bg-background/50 px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                autoFocus
                            />
                        </div>

                        {systemInfo && (
                            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Monitor className="w-4 h-4" />
                                    <span>Detected System</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                                            <Laptop className="w-3.5 h-3.5" />
                                            OS
                                        </div>
                                        <div className="font-medium capitalize pl-0.5">{systemInfo.platform} {systemInfo.version}</div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                                            <Cpu className="w-3.5 h-3.5" />
                                            Architecture
                                        </div>
                                        <div className="font-medium pl-0.5">{systemInfo.arch}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className="w-full inline-flex items-center justify-center rounded-lg bg-primary h-12 px-8 text-base font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                    Setting up...
                                </>
                            ) : (
                                'Get Started'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

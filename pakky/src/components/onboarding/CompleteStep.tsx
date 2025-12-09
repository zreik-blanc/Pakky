import { CheckCircle2 } from 'lucide-react';

export function CompleteStep() {
    return (
        <div className="text-center space-y-8">
            {/* Checkmark with glow */}
            <div className="relative mx-auto w-28 h-28">
                {/* Success glow */}
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />

                {/* Checkmark circle */}
                <div className="relative w-28 h-28 bg-gradient-to-br from-green-500/20 via-green-500/10 to-emerald-500/5 rounded-full flex items-center justify-center ring-2 ring-green-500/40 shadow-2xl shadow-green-500/20">
                    <CheckCircle2 className="w-14 h-14 text-green-500 drop-shadow-lg" />
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-green-500">
                    All set!
                </h2>
                <p className="text-muted-foreground text-base">
                    Taking you to Pakky...
                </p>
            </div>

            {/* Loading dots */}
            <div className="flex justify-center">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-green-500"
                            style={{
                                animation: 'pulse 1s ease-in-out infinite',
                                animationDelay: `${i * 0.2}s`
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface IsoCubeProps {
    className?: string;
    size?: number;
}

export function IsoCube({ className, size = 64 }: IsoCubeProps) {
    const halfSize = size / 2;

    // Face styles
    const faceStyle = "absolute inset-0 border border-primary/40 bg-primary/5 backdrop-blur-[2px] shadow-[inset_0_0_20px_rgba(34,197,94,0.1)] flex items-center justify-center";

    return (
        <div
            className={cn("relative flex items-center justify-center", className)}
            style={{ width: size * 2, height: size * 2, perspective: '1000px' }}
            aria-hidden="true"
        >
            <motion.div
                className="relative transform-style-3d"
                style={{
                    width: size,
                    height: size,
                    transformStyle: 'preserve-3d'
                }}
                animate={{
                    rotateX: [35, 35],
                    rotateY: [0, 360]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {/* Front */}
                <div className={faceStyle} style={{ transform: `translateZ(${halfSize}px)` }}>
                    <Package className="w-1/2 h-1/2 text-primary/80 opacity-80" />
                </div>

                {/* Back */}
                <div className={faceStyle} style={{ transform: `rotateY(180deg) translateZ(${halfSize}px)` }} />

                {/* Right */}
                <div className={faceStyle} style={{ transform: `rotateY(90deg) translateZ(${halfSize}px)` }} />

                {/* Left */}
                <div className={faceStyle} style={{ transform: `rotateY(-90deg) translateZ(${halfSize}px)` }} />

                {/* Top */}
                <div className={cn(faceStyle, "bg-primary/10")} style={{ transform: `rotateX(90deg) translateZ(${halfSize}px)` }} />

                {/* Bottom */}
                <div className={cn(faceStyle, "bg-primary/10 shadow-[0_0_40px_rgba(34,197,94,0.4)]")} style={{ transform: `rotateX(-90deg) translateZ(${halfSize}px)` }} />

                {/* Inner Core/Glow */}
                <div
                    className="absolute inset-4 bg-primary/40 blur-xl rounded-full"
                    style={{ transform: 'translateZ(0)' }}
                />
            </motion.div>
        </div>
    );
}

import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface OnboardingBackgroundProps {
    currentStepIndex: number;
    totalSteps: number;
    isExiting?: boolean;
}

// Grid configuration
const TILE_SIZE = 40;
const ISO_ANGLE = 0.5; // Controls the isometric skew
const SCANNER_SPEED = 800; // pixels per second
const SCANNER_MAX_RADIUS_MULT = 1.5; // Multiplier of canvas diagonal

// Darker Slate Palette (700-950)
const PALETTE = [
    { r: 51, g: 65, b: 85 }, // Slate-700 (Highlight)
    { r: 30, g: 41, b: 59 }, // Slate-800 (Mid Tone)
    { r: 15, g: 23, b: 42 }, // Slate-900 (Deep Base)
    { r: 2, g: 6, b: 23 },   // Slate-950 (Shadow)
];

interface DataPulse {
    x: number;
    y: number;
    axis: 'x' | 'y';
    direction: 1 | -1;
    progress: number;
    speed: number;
    // Cache current grid position to avoid recalculating every tile check
    currGridX: number;
    currGridY: number;
}

interface GridTile {
    x: number;
    y: number;
    baseHeight: number;
    color: { r: number, g: number, b: number };
    screenX: number;
    screenY: number;
}

export function OnboardingBackground({ currentStepIndex, totalSteps, isExiting = false }: OnboardingBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on canvas itself if possible, though we overlay
        if (!ctx) return;

        let animationFrameId: number;
        let scannerRadius = 0;
        let scannerActive = true;

        let dataPulses: DataPulse[] = [];
        let gridTiles: GridTile[] = [];

        const handleResize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            initGrid();
        };

        const toScreen = (gx: number, gy: number) => {
            return {
                x: (gx - gy) * TILE_SIZE,
                y: (gx + gy) * (TILE_SIZE * ISO_ANGLE)
            };
        };

        const initGrid = () => {
            gridTiles = [];
            // Create a grid large enough to cover the screen plus some buffer
            const cols = Math.ceil(canvas.width / TILE_SIZE) * 2 + 4;
            const rows = Math.ceil(canvas.height / TILE_SIZE) * 2 + 4;

            const cx = canvas.width / 2;
            const cy = -canvas.height * 0.2;

            for (let i = -cols / 2; i < cols; i++) {
                for (let j = -rows / 2; j < rows; j++) {
                    const pos = toScreen(i, j);
                    gridTiles.push({
                        x: i,
                        y: j,
                        baseHeight: Math.random() * 5,
                        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
                        screenX: cx + pos.x,
                        screenY: cy + pos.y
                    });
                }
            }

            // critical for 3D occlusion
            gridTiles.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        };

        const drawIsoTile = (
            cx: number, cy: number,
            color: { r: number, g: number, b: number },
            height: number,
            alpha: number,
            highlightStr: number
        ) => {
            const h = height > 0 ? height : 0;
            const { r, g, b } = color;

            // Optional: Pre-calculate highlight colors if performance is still bound, 
            // but simple math here is usually fine.
            const hr = Math.min(255, r + highlightStr * 100);
            const hg = Math.min(255, g + highlightStr * 100);
            const hb = Math.min(255, b + highlightStr * 100);

            // Vertices
            // Top: cx, cy
            // Right: cx + TILE_SIZE, cy + TILE_SIZE * ISO_ANGLE
            // Bottom: cx, cy + TILE_SIZE * ISO_ANGLE * 2
            // Left: cx - TILE_SIZE, cy + TILE_SIZE * ISO_ANGLE

            const halfH = TILE_SIZE * ISO_ANGLE;
            const fullH = halfH * 2;

            // Cached coordinates
            const rightX = cx + TILE_SIZE;
            const rightY = cy + halfH;
            const bottomY = cy + fullH;
            const leftX = cx - TILE_SIZE;

            // Roof (shifted by h)
            const rtY = cy - h;
            const rrY = rightY - h;
            const rbY = bottomY - h;
            // const rlY = rightY - h; // Unused

            ctx.lineWidth = 0.5;

            // 3D Sides
            if (h > 1) {
                const fillAlpha = Math.min(0.4, alpha * 0.6);
                const strokeAlpha = alpha * 0.2;

                // Right Face
                ctx.beginPath();
                ctx.moveTo(rightX, rightY);
                ctx.lineTo(cx, bottomY);
                ctx.lineTo(cx, rbY);
                ctx.lineTo(rightX, rrY);
                ctx.closePath();
                ctx.fillStyle = `rgba(${hr}, ${hg}, ${hb}, ${fillAlpha})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(${hr}, ${hg}, ${hb}, ${strokeAlpha})`;
                ctx.stroke();

                // Left Face
                ctx.beginPath();
                ctx.moveTo(leftX, rightY); // leftY is same as rightY in simpler variable naming
                ctx.lineTo(cx, bottomY);
                ctx.lineTo(cx, rbY);
                ctx.lineTo(leftX, rrY); // LeftY - h
                ctx.closePath();
                // Shadowed color
                const sr = Math.max(0, hr - 20);
                const sg = Math.max(0, hg - 20);
                const sb = Math.max(0, hb - 20);

                ctx.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${Math.min(0.5, alpha * 0.8)})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(${hr}, ${hg}, ${hb}, ${strokeAlpha})`;
                ctx.stroke();
            }

            // Roof
            ctx.beginPath();
            ctx.moveTo(cx, rtY);
            ctx.lineTo(rightX, rrY);
            ctx.lineTo(cx, rbY);
            ctx.lineTo(leftX, rrY);
            ctx.closePath();

            const borderAlpha = 0.15 + alpha * 0.2 + highlightStr * 0.5;
            ctx.strokeStyle = `rgba(${hr}, ${hg}, ${hb}, ${borderAlpha})`;
            ctx.stroke();

            if (alpha > 0.05) {
                // Lighten top
                const tr = Math.min(255, hr + 20);
                const tg = Math.min(255, hg + 20);
                const tb = Math.min(255, hb + 20);
                ctx.fillStyle = `rgba(${tr}, ${tg}, ${tb}, ${alpha})`;
                ctx.fill();
            }
        };

        // Pulse spawner
        const pulseInterval = setInterval(() => {
            if (Math.random() > 0.5) return;
            const axis = Math.random() > 0.5 ? 'x' : 'y';
            const startX = Math.floor((Math.random() - 0.5) * 40);
            const startY = Math.floor((Math.random() - 0.5) * 40);

            dataPulses.push({
                x: startX,
                y: startY,
                axis,
                direction: Math.random() > 0.5 ? 1 : -1,
                progress: 0,
                speed: 10 + Math.random() * 20,
                currGridX: startX,
                currGridY: startY
            });

            if (dataPulses.length > 20) dataPulses.shift();
        }, 500);

        let lastTime = performance.now();

        const animate = (time: number) => {
            if (!ctx || !canvas) return;
            const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt to avoid huge jumps
            lastTime = time;

            // Clear with background color instead of clearRect if we want to avoid trails, 
            // but we are drawing full scene. clearRect is fine.
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Update Scanner
            if (scannerActive) {
                scannerRadius += SCANNER_SPEED * dt;
                // Pre-calc max radius squared to avoid sqrt in loop if possible, 
                // but we need linear radius for linear wave speed.
                const diag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
                if (scannerRadius > diag * SCANNER_MAX_RADIUS_MULT) scannerActive = false;
            }

            // 2. Update Pulses & spatial cache
            // We reuse the same array to avoid allocation (filter creates new array)
            // But for small N (20), filter is fine. Optimization: use a persistent array and an active count.
            // Sticking to filter for now as N is very small.
            for (let i = 0; i < dataPulses.length; i++) {
                const p = dataPulses[i];
                p.progress += p.speed * dt;
                // Update cached grid pos
                if (p.axis === 'x') {
                    p.currGridX = p.x + p.progress * p.direction;
                    p.currGridY = p.y;
                } else {
                    p.currGridX = p.x;
                    p.currGridY = p.y + p.progress * p.direction;
                }
            }
            // Remove finished
            dataPulses = dataPulses.filter(p => p.progress < 60);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const scanBandWidth = 300;

            // Render
            // Use for loop instead of forEach for perf
            for (let i = 0; i < gridTiles.length; i++) {
                const tile = gridTiles[i];
                const dx = tile.screenX - cx;
                const dy = tile.screenY - cy;

                // Simple culling
                if (tile.screenX < -100 || tile.screenX > canvas.width + 100 ||
                    tile.screenY < -200 || tile.screenY > canvas.height + 100) continue;

                // Scanner logic
                const distFromCenter = Math.sqrt(dx * dx + dy * dy);
                const scanDist = scannerRadius - distFromCenter;

                let scanAlpha = 0;
                let scanHeightMod = 0;

                if (scanDist > 0) {
                    scanAlpha = 1;
                } else if (scanDist > -scanBandWidth) {
                    const t = 1 - (scanDist / -scanBandWidth);
                    scanAlpha = t;
                    scanHeightMod = Math.sin(t * Math.PI) * 40;
                }

                if (scanAlpha < 0.01) continue;

                // Pulse logic
                let pulseHeight = 0;
                let pulseGlow = 0;

                // Optimized pulse check
                for (let j = 0; j < dataPulses.length; j++) {
                    const p = dataPulses[j];
                    // Manhattan distance check first (super fast)
                    if (Math.abs(tile.x - p.currGridX) > 4 || Math.abs(tile.y - p.currGridY) > 4) continue;

                    // Euclidean check for smoothness
                    const dist = Math.sqrt((tile.x - p.currGridX) ** 2 + (tile.y - p.currGridY) ** 2);
                    if (dist < 3) {
                        const influence = Math.max(0, 1 - dist / 3);
                        pulseHeight += influence * 30;
                        pulseGlow += influence;
                    }
                }

                const finalHeight = tile.baseHeight + scanHeightMod + pulseHeight;
                const finalAlpha = Math.min(1, scanAlpha * 0.3); // Keeping the "hidden" alpha low

                if (finalAlpha > 0.01 || finalHeight > 0.5) {
                    drawIsoTile(
                        tile.screenX,
                        tile.screenY,
                        tile.color,
                        finalHeight,
                        finalAlpha,
                        Math.min(1, pulseGlow)
                    );
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            clearInterval(pulseInterval);
        };
    }, []);

    return (
        <motion.div
            ref={containerRef}
            className="absolute inset-0 -z-10 overflow-hidden bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: isExiting ? 0 : 1 }}
            transition={{ duration: 1 }}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block w-full h-full"
            />

            {/* Vignette Overlay for depth */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/60 to-background pointer-events-none" />

            {/* Tech Status Indicators (Progress) */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
                {[...Array(totalSteps - 1)].map((_, i) => {
                    const isCompleteStep = currentStepIndex === totalSteps - 1;
                    const isActive = i <= currentStepIndex;

                    return (
                        <motion.div
                            key={i}
                            className={cn(
                                "h-1.5 rounded-sm transition-colors duration-300",
                                isActive
                                    ? "bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                                    : "bg-muted/30"
                            )}
                            animate={{
                                width: isActive ? 24 : 12,
                                opacity: isExiting ? 0 : (isCompleteStep ? 0 : 1), // Hide on complete
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                        />
                    );
                })}
            </div>
        </motion.div>
    );
}

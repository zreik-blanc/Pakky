import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { smoothSpring } from '@/lib/animations';

interface OnboardingBackgroundProps {
    currentStepIndex: number;
    totalSteps: number;
    isExiting?: boolean;
}

export function OnboardingBackground({ currentStepIndex, totalSteps, isExiting = false }: OnboardingBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mousePositionRef = useRef({ x: -9999, y: -9999 }); // Start off-screen
    const mouseActiveRef = useRef(false);
    const currentMouseOpacityRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        // Configuration
        const particleCount = 60;
        const connectionDistance = 150;
        const mouseDistance = 200;

        // Resize handler
        const handleResize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            initParticles();
        };



        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.vx = (Math.random() - 0.5) * 0.3; // Slower, calmer movement
                this.vy = (Math.random() - 0.5) * 0.3;
                this.size = Math.random() * 2 + 1; // Varying star sizes
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.3})`; // Twinkling effect via opacity
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Smoothly interpolate mouse opacity
            const targetOpacity = mouseActiveRef.current ? 1 : 0;
            currentMouseOpacityRef.current += (targetOpacity - currentMouseOpacityRef.current) * 0.1;

            // Draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw connections
            particles.forEach((a, index) => {
                // Connect to other particles
                for (let i = index + 1; i < particles.length; i++) {
                    const b = particles[i];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        // White lines, very subtle opacity
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - (distance / connectionDistance))})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }

                // Connect to mouse ONLY if opacity > 0.01
                if (currentMouseOpacityRef.current > 0.01) {
                    const dx = a.x - mousePositionRef.current.x;
                    const dy = a.y - mousePositionRef.current.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        ctx.beginPath();
                        // Mouse connection alpha multiplied by interpolated opacity for smooth fade
                        const alpha = (0.3 * (1 - (distance / mouseDistance))) * currentMouseOpacityRef.current;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(mousePositionRef.current.x, mousePositionRef.current.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Mouse handler attached to window for reliable tracking
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            mousePositionRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            mouseActiveRef.current = true;
        };

        const handleMouseLeave = () => {
            mouseActiveRef.current = false;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove); // Listen on window to catch events everywhere
        window.addEventListener('mouseout', handleMouseLeave); // Detect leaving window

        handleResize();
        initParticles(); // Re-init to fill new size
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
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

            {/* Overlay Gradient for depth - Made darker at edges */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/20 to-background/80 pointer-events-none" />

            {/* Progress dots */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none">
                {[...Array(totalSteps - 1)].map((_, i) => {
                    const isCompleteStep = currentStepIndex === totalSteps - 1;
                    return (
                        <motion.div
                            key={i}
                            className={cn(
                                "rounded-full",
                                i <= currentStepIndex
                                    ? "bg-primary shadow-sm shadow-primary/50"
                                    : "bg-muted/50"
                            )}
                            animate={{
                                width: i <= currentStepIndex ? 10 : 8,
                                height: i <= currentStepIndex ? 10 : 8,
                                opacity: isExiting ? 0 : (isCompleteStep ? [1, 0.4, 1] : 1),
                            }}
                            transition={{
                                ...smoothSpring,
                                opacity: isExiting ? {
                                    duration: 0.8,
                                    ease: "easeOut"
                                } : (isCompleteStep ? {
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.2
                                } : { duration: 0 })
                            }}
                        />
                    );
                })}
            </div>
        </motion.div>
    );
}

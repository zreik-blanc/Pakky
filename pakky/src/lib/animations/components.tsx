/**
 * Motion Component Utilities
 * 
 * Pre-configured motion components for common animation patterns.
 * These are ready-to-use building blocks for consistent animations.
 * 
 * @see https://motion.dev/docs/react-animation
 */

import { motion, AnimatePresence } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import { forwardRef, type ReactNode } from 'react';
import {
    spinnerTransition,
    pulseTransition,
    floatTransition,
    bounceTransition,
    pingTransition,
    fadeIn,
    fadeInUp,
    slideInFromBottom,
    scaleIn,
    staggerContainer,
    listItem,
    modal,
    backdrop,
    dropdown,
    pageEnter,
} from './variants';

// ============================================================================
// INFINITE ANIMATION COMPONENTS
// ============================================================================

interface MotionWrapperProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
}

/**
 * Spinner - rotates 360° infinitely
 * Replaces: animate-spin
 */
export const Spinner = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            animate={{ rotate: 360 }}
            transition={spinnerTransition}
            {...props}
        >
            {children}
        </motion.div>
    )
);
Spinner.displayName = 'Spinner';

/**
 * Pulse - fades in and out infinitely
 * Replaces: animate-pulse
 */
export const Pulse = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={pulseTransition}
            {...props}
        >
            {children}
        </motion.div>
    )
);
Pulse.displayName = 'Pulse';

/**
 * Float - subtle up and down movement
 * Replaces: animate-float, float keyframe
 */
export const Float = forwardRef<HTMLDivElement, MotionWrapperProps & { duration?: number }>(
    ({ children, duration = 3, ...props }, ref) => (
        <motion.div
            ref={ref}
            animate={{ y: [0, -4, 0] }}
            transition={{ ...floatTransition, duration }}
            {...props}
        >
            {children}
        </motion.div>
    )
);
Float.displayName = 'Float';

/**
 * Bounce - bouncy up and down movement
 * Replaces: animate-bounce
 */
export const Bounce = forwardRef<HTMLDivElement, MotionWrapperProps & { delay?: number; duration?: number }>(
    ({ children, delay = 0, duration = 1.5, ...props }, ref) => (
        <motion.div
            ref={ref}
            animate={{ y: [0, -8, 0] }}
            transition={{ ...bounceTransition, delay, duration }}
            {...props}
        >
            {children}
        </motion.div>
    )
);
Bounce.displayName = 'Bounce';

/**
 * Ping - expands and fades out (notification indicator)
 * Replaces: animate-ping
 */
export const Ping = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            animate={{ scale: [1, 2], opacity: [0.75, 0] }}
            transition={pingTransition}
            {...props}
        >
            {children}
        </motion.div>
    )
);
Ping.displayName = 'Ping';

// ============================================================================
// ENTRANCE ANIMATION COMPONENTS
// ============================================================================

/**
 * FadeIn - simple opacity fade
 * Replaces: animate-in fade-in
 */
export const FadeIn = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
        >
            {children}
        </motion.div>
    )
);
FadeIn.displayName = 'FadeIn';

/**
 * FadeInUp - fades in while sliding up
 * Replaces: animate-in fade-in slide-in-from-bottom
 */
export const FadeInUp = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
        >
            {children}
        </motion.div>
    )
);
FadeInUp.displayName = 'FadeInUp';

/**
 * SlideUp - slides up from below
 * Replaces: animate-in slide-in-from-bottom
 */
export const SlideUp = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={slideInFromBottom}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
        >
            {children}
        </motion.div>
    )
);
SlideUp.displayName = 'SlideUp';

/**
 * ScaleIn - scales up from smaller size
 * Replaces: animate-in zoom-in-95
 */
export const ScaleIn = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
        >
            {children}
        </motion.div>
    )
);
ScaleIn.displayName = 'ScaleIn';

/**
 * PageTransition - smooth page-level entrance
 * Replaces: animate-in fade-in duration-500
 */
export const PageTransition = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={pageEnter}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
        >
            {children}
        </motion.div>
    )
);
PageTransition.displayName = 'PageTransition';

// ============================================================================
// LIST ANIMATION COMPONENTS
// ============================================================================

/**
 * StaggerList - container that staggers children animations
 * Use with StaggerItem for each child
 */
export const StaggerList = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
        >
            {children}
        </motion.div>
    )
);
StaggerList.displayName = 'StaggerList';

/**
 * StaggerItem - list item with stagger animation
 * Use inside StaggerList
 */
export const StaggerItem = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={listItem}
            {...props}
        >
            {children}
        </motion.div>
    )
);
StaggerItem.displayName = 'StaggerItem';

// ============================================================================
// MODAL/OVERLAY COMPONENTS
// ============================================================================

interface ModalOverlayProps extends MotionWrapperProps {
    isOpen: boolean;
}

/**
 * ModalBackdrop - semi-transparent overlay background
 */
export const ModalBackdrop = forwardRef<HTMLDivElement, ModalOverlayProps>(
    ({ isOpen, children, ...props }, ref) => (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={ref}
                    variants={backdrop}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    {...props}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    )
);
ModalBackdrop.displayName = 'ModalBackdrop';

/**
 * ModalContent - animated modal card
 */
export const ModalContent = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
        >
            {children}
        </motion.div>
    )
);
ModalContent.displayName = 'ModalContent';

/**
 * Dropdown - animated dropdown menu
 */
export const Dropdown = forwardRef<HTMLDivElement, MotionWrapperProps>(
    ({ children, ...props }, ref) => (
        <motion.div
            ref={ref}
            variants={dropdown}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
        >
            {children}
        </motion.div>
    )
);
Dropdown.displayName = 'Dropdown';

// ============================================================================
// TEXT ANIMATION COMPONENTS
// ============================================================================

interface StaggerTextProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
    children: string;
    /** Delay between each character in seconds */
    staggerDelay?: number;
    /** Whether the component is visible */
    isVisible?: boolean;
}

/**
 * StaggerText - animates text character by character
 * Letters appear/disappear with staggered timing from right to left on exit
 */
export function StaggerText({
    children,
    staggerDelay = 0.02,
    isVisible = true,
    className,
    ...props
}: StaggerTextProps) {
    const characters = children.split('');

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: staggerDelay,
            }
        },
        exit: {
            transition: {
                staggerChildren: staggerDelay,
                staggerDirection: -1, // Reverse: right to left
            }
        }
    };

    const charVariants = {
        hidden: {
            opacity: 0,
            x: -4,
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.1 }
        },
        exit: {
            opacity: 0,
            x: -8,
            transition: { duration: 0.08 }
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.span
                    className={className}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ display: 'inline-flex' }}
                    {...props}
                >
                    {characters.map((char, index) => (
                        <motion.span
                            key={`${char}-${index}`}
                            variants={charVariants}
                            style={{
                                display: 'inline-block',
                                whiteSpace: char === ' ' ? 'pre' : 'normal'
                            }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </motion.span>
            )}
        </AnimatePresence>
    );
}

// Re-export AnimatePresence for convenience
export { AnimatePresence };

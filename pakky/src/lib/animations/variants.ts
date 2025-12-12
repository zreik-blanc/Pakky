/**
 * Motion Animation Variants Library
 * 
 * Centralized animation variants and transitions for consistent
 * animations throughout the Pakky application.
 * 
 * @see https://motion.dev/docs/react-animation
 */

import type { Variants, Transition } from 'motion/react';

// ============================================================================
// TRANSITIONS
// ============================================================================

/** Default spring transition - snappy and responsive */
export const springTransition: Transition = {
    type: 'spring',
    stiffness: 400,
    damping: 30,
};

/** Smooth spring with slight bounce */
export const smoothSpring: Transition = {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 0.8,
};

/** Gentle spring for subtle animations */
export const gentleSpring: Transition = {
    type: 'spring',
    stiffness: 200,
    damping: 20,
};

/** Quick tween for micro-interactions */
export const quickTween: Transition = {
    duration: 0.2,
    ease: 'easeOut',
};

/** Standard tween for most animations */
export const standardTween: Transition = {
    duration: 0.3,
    ease: 'easeInOut',
};

/** Slow tween for dramatic entrances */
export const slowTween: Transition = {
    duration: 0.5,
    ease: [0.32, 0.72, 0, 1], // Custom bezier for smooth deceleration
};

/** Very slow tween for page transitions */
export const pageTransition: Transition = {
    duration: 0.7,
    ease: [0.22, 1, 0.36, 1],
};

// ============================================================================
// FADE VARIANTS
// ============================================================================

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: quickTween,
    },
    exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: standardTween,
    },
    exit: { opacity: 0, y: -10 },
};

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: standardTween,
    },
    exit: { opacity: 0, y: 10 },
};

export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: standardTween,
    },
    exit: { opacity: 0, x: 10 },
};

export const fadeInRight: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: standardTween,
    },
    exit: { opacity: 0, x: -10 },
};

// ============================================================================
// SCALE VARIANTS
// ============================================================================

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: smoothSpring,
    },
    exit: { opacity: 0, scale: 0.95 },
};

export const scaleInBounce: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 25,
        },
    },
    exit: { opacity: 0, scale: 0.9 },
};

export const pop: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: [0.8, 1.1, 1],
        transition: {
            duration: 0.3,
            times: [0, 0.6, 1],
            ease: 'easeOut',
        },
    },
    exit: { opacity: 0, scale: 0.9 },
};

// ============================================================================
// SLIDE VARIANTS
// ============================================================================

export const slideInFromTop: Variants = {
    hidden: { opacity: 0, y: -16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: smoothSpring,
    },
    exit: { opacity: 0, y: -8 },
};

export const slideInFromBottom: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: smoothSpring,
    },
    exit: { opacity: 0, y: 8 },
};

export const slideInFromLeft: Variants = {
    hidden: { opacity: 0, x: -16 },
    visible: {
        opacity: 1,
        x: 0,
        transition: smoothSpring,
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: {
            duration: 0.15,
            ease: 'easeIn',
        }
    },
};

export const slideInFromRight: Variants = {
    hidden: { opacity: 0, x: 16 },
    visible: {
        opacity: 1,
        x: 0,
        transition: smoothSpring,
    },
    exit: { opacity: 0, x: 8 },
};

// ============================================================================
// INFINITE/LOOPING ANIMATIONS (for use with animate prop directly)
// ============================================================================

/** Spinner animation config (for Loader2 icons, etc.) */
export const spinnerAnimation = {
    rotate: 360,
};
export const spinnerTransition: Transition = {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
};

/** Pulse animation config */
export const pulseAnimation = {
    opacity: [1, 0.5, 1],
    scale: [1, 0.98, 1],
};
export const pulseTransition: Transition = {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
};

/** Subtle float animation */
export const floatAnimation = {
    y: [0, -4, 0],
};
export const floatTransition: Transition = {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
};

/** Bounce animation */
export const bounceAnimation = {
    y: [0, -8, 0],
};
export const bounceTransition: Transition = {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
};

/** Ping animation (ripple effect) */
export const pingAnimation = {
    scale: [1, 2],
    opacity: [0.75, 0],
};
export const pingTransition: Transition = {
    duration: 1,
    repeat: Infinity,
    ease: 'easeOut',
};

/** Shake animation for errors */
export const shakeAnimation = {
    x: [0, -2, 2, -2, 2, -2, 2, 0],
};
export const shakeTransition: Transition = {
    duration: 0.5,
    ease: 'easeInOut',
};

/** Shimmer/loading skeleton animation */
export const shimmerAnimation = {
    x: ['-100%', '100%'],
};
export const shimmerTransition: Transition = {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
};

/** Twinkle animation for decorative elements */
export const twinkleAnimation = {
    opacity: [0.3, 0.8, 0.3],
    scale: [1, 1.2, 1],
};
export const twinkleTransition: Transition = {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
};

/** Gradient background animation */
export const gradientAnimation = {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
};
export const gradientTransition: Transition = {
    duration: 4,
    repeat: Infinity,
    ease: 'linear',
};

// ============================================================================
// ONBOARDING-SPECIFIC ANIMATIONS
// ============================================================================

/** Rocket floating animation */
export const rocketFloatAnimation = {
    y: [0, -8, -4, 0],
    rotate: [0, 2, -2, 0],
};
export const rocketFloatTransition: Transition = {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
};

/** Rocket trail animation */
export const trailAnimation = {
    opacity: [0.6, 0.8, 0.6],
    scaleX: [1, 1.2, 1],
};
export const trailTransition: Transition = {
    duration: 0.5,
    repeat: Infinity,
    ease: 'easeInOut',
};

/** Orbiting ring spin animation */
export const orbitAnimation = {
    rotate: 360,
};
export const orbitTransition = (duration: number, reverse = false): Transition => ({
    duration,
    repeat: Infinity,
    ease: 'linear',
    ...(reverse && { repeatType: 'loop' as const }),
});

// ============================================================================
// LIST/STAGGER VARIANTS
// ============================================================================

/** Container for staggered children */

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1, // Increased from 0.05 for more distinct entry
            delayChildren: 0.2,   // Increased from 0.1 to wait for hero to settle
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

/** Fast stagger for quick lists */
export const fastStaggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
        },
    },
};

/** List item variant (use with staggerContainer) */
export const listItem: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: quickTween,
    },
    exit: { opacity: 0, x: 10 },
};

/** Card item variant for grid layouts */

export const cardItem: Variants = {
    hidden: { opacity: 0, y: 30 }, // Increased distance slightly
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100, // Softer than gentleSpring (200)
            damping: 15,
            mass: 1,
        },
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

/** Form container with staggered form fields */
export const formContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
        },
    },
};

/** Form field item variant (use with formContainer) */
export const formItem: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: quickTween,
    },
};

// ============================================================================
// MODAL/OVERLAY VARIANTS
// ============================================================================

export const backdrop: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.15 },
    },
};

export const modal: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 10,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: smoothSpring,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: quickTween,
    },
};

export const dropdown: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: -4,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.15,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: -4,
        transition: {
            duration: 0.1,
        },
    },
};

// ============================================================================
// GESTURE STATES (for whileHover, whileTap, etc.)
// ============================================================================

export const hoverScale = {
    scale: 1.02,
    transition: quickTween,
};

export const hoverScaleLarge = {
    scale: 1.05,
    transition: quickTween,
};

export const tapScale = {
    scale: 0.98,
    transition: { duration: 0.1 },
};

export const hoverLift = {
    y: -2,
    transition: quickTween,
};

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

export const pageEnter: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: pageTransition,
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: quickTween,
    },
};

// ============================================================================
// PROGRESS BAR
// ============================================================================

export const indeterminateProgress = {
    x: ['-100%', '200%'],
};
export const indeterminateProgressTransition: Transition = {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
};

// ============================================================================
// COLLAPSE/EXPAND (for expandable sections without transform distortion)
// ============================================================================

/** Simple height-based collapse animation - avoids y-transform stretching */
export const collapseExpand: Variants = {
    hidden: {
        opacity: 0,
        height: 0,
        overflow: 'hidden',
    },
    visible: {
        opacity: 1,
        height: 'auto',
        overflow: 'hidden',
        transition: {
            height: { duration: 0.2, ease: 'easeOut' },
            opacity: { duration: 0.15, delay: 0.05 },
        },
    },
    exit: {
        opacity: 0,
        height: 0,
        overflow: 'hidden',
        transition: {
            height: { duration: 0.2, ease: 'easeIn' },
            opacity: { duration: 0.1 },
        },
    },
};


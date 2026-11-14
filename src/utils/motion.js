// Smooth quintic/expo settling curve matching --ease-out: cubic-bezier(0.16, 1, 0.3, 1)
export const EASE_OUT = [0.16, 1, 0.3, 1];

// Liquid, zero-bounce spring for sliding tab indicators, nav underlines, and layout reflow
export const FLUID_SPRING = {
    type: 'spring',
    stiffness: 300,
    damping: 32,
    mass: 0.85,
};

// Soft cushioned spring for tactile icon pops (Star, Bookmark, Check)
export const TACTILE_SPRING = {
    type: 'spring',
    stiffness: 340,
    damping: 22,
    mass: 0.75,
};

// Critically damped glide spring for overlapping card & question transitions
export const CARD_GLIDE_SPRING = {
    type: 'spring',
    stiffness: 260,
    damping: 30,
    mass: 0.9,
};

// Physical 3D index-card rotation spring (preserves velocity if flipped mid-air)
export const FLIP_TRANSITION = {
    type: 'spring',
    stiffness: 190,
    damping: 25,
    mass: 0.95,
};

// Smooth spring for progress bars
export const PROGRESS_SPRING = {
    type: 'spring',
    stiffness: 180,
    damping: 28,
    mass: 0.9,
};

export const PAGE_TRANSITION = {
    duration: 0.32,
    ease: EASE_OUT,
};

export const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
        opacity: 1,
        y: 0,
        transition: PAGE_TRANSITION,
    },
};

export const cardSlideVariants = {
    enter: (direction) => ({
        opacity: 0,
        x: direction > 0 ? 44 : direction < 0 ? -44 : 0,
        y: direction === 0 ? 10 : 0,
        scale: 0.985,
        zIndex: 1,
    }),
    center: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        zIndex: 1,
        transition: {
            x: CARD_GLIDE_SPRING,
            y: CARD_GLIDE_SPRING,
            scale: CARD_GLIDE_SPRING,
            opacity: { duration: 0.24, ease: EASE_OUT },
        },
    },
    exit: (direction) => ({
        opacity: 0,
        x: direction > 0 ? -44 : direction < 0 ? 44 : 0,
        scale: 0.98,
        zIndex: 0,
        pointerEvents: 'none',
        transition: {
            x: CARD_GLIDE_SPRING,
            scale: CARD_GLIDE_SPRING,
            opacity: { duration: 0.2, ease: EASE_OUT },
        },
    }),
};

export const modalBackdropVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.24, ease: EASE_OUT } },
    exit: { opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } },
};

export const modalPanelVariants = {
    initial: { opacity: 0, scale: 0.95, y: 12 },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 320,
            damping: 28,
            mass: 0.85,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.97,
        y: 6,
        transition: { duration: 0.16, ease: EASE_OUT },
    },
};

/**
 * Gentle stagger for lists and grids, capped so 40-50 items never lag.
 */
export function getStaggerDelay(index, step = 0.016, maxDelay = 0.22) {
    if (typeof index !== 'number' || index <= 0) return 0;
    return Math.round(Math.min(index * step, maxDelay) * 1000) / 1000;
}

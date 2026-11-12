/*
 * One motion vocabulary for the whole admin (Emil Kowalski's curves).
 * CSS mirrors these as --ease-* variables in admin.css.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const; // arrivals, exits, feedback
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const; // movement across the screen
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const; // sheets and drawers (iOS-like)
export const CSS_EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const CSS_EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
/** Apple-style spring for pills, toggles and things that follow a pointer. */
export const SPRING = { type: "spring", duration: 0.5, bounce: 0.2 } as const;
export const SPRING_SNAPPY = { type: "spring", duration: 0.35, bounce: 0.15 } as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

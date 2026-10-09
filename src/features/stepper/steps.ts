export interface Step { id: string; title: string; hint: string }

export const STEPS: Step[] = [
  { id: 'color', title: 'Get a color', hint: 'Use an image, a screenshot, or type one in.' },
  { id: 'match', title: 'Pick your colors', hint: 'Choose a wheel type and tap colors, or choose one suggested pairing.' },
  { id: 'palette', title: 'Your palette', hint: 'Review, copy or tweak what you picked.' },
];

export const clampStep = (index: number, count = STEPS.length): number => Math.min(count - 1, Math.max(0, index));

/**
 * A step can be jumped to once it has been reached. Steps beyond the furthest one reached stay locked, so
 * the setup each step does on arrival (such as selecting the wheel's colors) is never skipped.
 */
export const canVisit = (index: number, furthest: number): boolean => index >= 0 && index <= furthest;

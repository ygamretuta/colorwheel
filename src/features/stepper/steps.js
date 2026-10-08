export const STEPS = [
  { id: 'color', title: 'Get a color', hint: 'Use an image, a screenshot, or type one in.' },
  { id: 'match', title: 'Pick your colors', hint: 'Choose a wheel type and tap colors, or choose one suggested pairing.' },
  { id: 'palette', title: 'Your palette', hint: 'Review, copy or tweak what you picked.' },
];

export const clampStep = (index, count = STEPS.length) => Math.min(count - 1, Math.max(0, index));

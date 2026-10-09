import { hexToHsl, hslToHex, isNeutral, normalizeHex, rotateHue } from '@/shared/color/convert.js';

/** Hue offsets (degrees) from the base color for each wheel scheme. */
export const HARMONIES = {
  complementary: { label: 'Complementary', description: 'Two colors directly opposite on the wheel: maximum contrast.', offsets: [180] },
  splitComplementary: { label: 'Split complementary', description: 'The base plus the two colors beside its complement: contrast with less tension.', offsets: [150, 210] },
  analogous: { label: 'Analogous', description: 'The base plus its two neighbors: calm and cohesive.', offsets: [-30, 30] },
  triadic: { label: 'Triadic', description: 'Three colors evenly spaced around the wheel: vibrant and balanced.', offsets: [120, 240] },
  tetradic: { label: 'Tetradic (rectangle)', description: 'Two complementary pairs forming a rectangle: rich, needs one dominant color.', offsets: [60, 180, 240] },
  square: { label: 'Square', description: 'Four colors evenly spaced 90° apart: bold and varied.', offsets: [90, 180, 270] },
  tertiary: { label: 'Tertiary (adjacent mixes)', description: 'The base plus the in-between mixes on either side, and its complement.', offsets: [-60, 60, 180] },
  monochromatic: { label: 'Monochromatic', description: 'One hue in lighter and darker shades: subtle and uniform.', lightness: [-30, -15, 15, 30] },
};

const NEUTRAL_ACCENT_HUE = 210; // a calm blue: the hue greys, whites and blacks borrow
const RAMP_STEPS = [15, 33.75, 52.5, 71.25, 90]; // five evenly spaced lightness levels for monochromatic

const unique = (colors) => [...new Set(colors)];

/** The hue a neutral color borrows to take part in a scheme, dark enough (or light enough) to stand out from it. */
function neutralAccent(neutral) {
  return hslToHex({ h: NEUTRAL_ACCENT_HUE, s: 65, l: hexToHsl(neutral).l > 50 ? 40 : 60 });
}

/**
 * Five distinct shades of the base's hue: the base, then the four other steps of an evenly spaced
 * lightness ramp (the step nearest the base is replaced by it), ordered light to dark. Spacing the
 * steps out, rather than adding fixed offsets, keeps them distinct for very light and very dark colors.
 */
function monochromaticRamp(base) {
  const hsl = hexToHsl(base);
  const nearest = RAMP_STEPS.reduce((best, step, index) => (Math.abs(step - hsl.l) < Math.abs(RAMP_STEPS[best] - hsl.l) ? index : best), 0);
  const shades = RAMP_STEPS.filter((_, index) => index !== nearest).map((l) => hslToHex({ ...hsl, l }));
  return [base, ...shades.reverse()];
}

/**
 * The colors of a wheel scheme, base first, with no repeats. Greys, whites and blacks have no hue to
 * rotate, so their scheme is built around a blue accent: [base, accent, ...the accent's partners].
 */
export function generateHarmony(hex, type) {
  const base = normalizeHex(hex);
  const scheme = HARMONIES[type];
  if (!base) throw new Error(`Invalid hex color: ${hex}`);
  if (!scheme) throw new Error(`Unknown harmony: ${type}`);

  if (scheme.lightness) return monochromaticRamp(base);

  const anchor = isNeutral(base) ? neutralAccent(base) : base;
  const partners = scheme.offsets.map((offset) => rotateHue(anchor, offset));
  return unique([base, ...(anchor === base ? [] : [anchor]), ...partners]);
}

export function generateAllHarmonies(hex) {
  return Object.entries(HARMONIES).map(([id, { label }]) => ({
    id,
    label,
    colors: generateHarmony(hex, id),
  }));
}

/** Hue (0-360) of each color, for drawing markers on the wheel. Meaningless for neutrals; see isNeutral. */
export const hueOf = (hex) => hexToHsl(hex).h;

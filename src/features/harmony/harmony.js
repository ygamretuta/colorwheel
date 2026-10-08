import { hexToHsl, hslToHex, normalizeHex, rotateHue } from '@/shared/color/convert.js';

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

export function generateHarmony(hex, type) {
  const base = normalizeHex(hex);
  const scheme = HARMONIES[type];
  if (!base) throw new Error(`Invalid hex color: ${hex}`);
  if (!scheme) throw new Error(`Unknown harmony: ${type}`);

  if (scheme.lightness) {
    const hsl = hexToHsl(base);
    const shades = scheme.lightness.map((delta) =>
      hslToHex({ ...hsl, l: Math.min(95, Math.max(5, hsl.l + delta)) }),
    );
    return [base, ...shades];
  }
  return [base, ...scheme.offsets.map((offset) => rotateHue(base, offset))];
}

export function generateAllHarmonies(hex) {
  return Object.entries(HARMONIES).map(([id, { label }]) => ({
    id,
    label,
    colors: generateHarmony(hex, id),
  }));
}

/** Hue (0-360) of each color, for drawing markers on the wheel. */
export const hueOf = (hex) => hexToHsl(hex).h;

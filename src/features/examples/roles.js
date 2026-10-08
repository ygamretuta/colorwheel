import { luminance, readableTextColor } from '@/shared/color/contrast.js';
import { hexToHsl, hexToRgb, hslToHex, normalizeHex, setLightness } from '@/shared/color/convert.js';
import { contrastRatio } from '@/shared/color/contrast.js';

const MIN_COLORS = 4;
const clamp = (value) => Math.min(92, Math.max(8, value));

const unique = (colors) => [...new Set(colors.map(normalizeHex).filter(Boolean))];

/** Lightness/hue variants of one color, used to fill out a palette that is too small to design with. */
function fillers(seed) {
  const { h, s, l } = hexToHsl(seed);
  return [
    setLightness(seed, clamp(l > 50 ? l - 40 : l + 40)),
    setLightness(seed, clamp(l > 50 ? l - 20 : l + 20)),
    hslToHex({ h: h + 30, s, l: clamp(l) }),
    setLightness(seed, clamp(l > 50 ? l - 55 : l + 55)),
    hslToHex({ h: h - 30, s, l: clamp(l) }),
  ];
}

/** Palette of at least MIN_COLORS distinct colors: the input, padded with variants of the first color. */
function completePalette(colors) {
  const pool = unique(colors);
  if (pool.length === 0) return [];
  for (const filler of fillers(pool[0])) {
    if (pool.length >= MIN_COLORS) break;
    if (!pool.includes(filler)) pool.push(filler);
  }
  return pool;
}

/** How colorful a color is (0 = grey, 1 = fully saturated), independent of lightness. */
export function chroma(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

/**
 * Give each palette color a design role so the example layouts work with any palette:
 * `dark` and `light` (the extremes, for backgrounds and type), `accent` (the most vivid
 * of the rest) and `mid` (what is left). Small palettes are padded with variants of the first color.
 * Returns null for an empty palette.
 */
export function assignRoles(colors) {
  const pool = completePalette(colors);
  if (pool.length === 0) return null;

  const byLuminance = [...pool].sort((a, b) => luminance(a) - luminance(b));
  const dark = byLuminance[0];
  const light = byLuminance.at(-1);
  const rest = pool.filter((color) => color !== dark && color !== light);
  const bySaturation = [...rest].sort((a, b) => hexToHsl(b).s - hexToHsl(a).s);
  const accent = bySaturation[0] ?? light;
  const mid = bySaturation.find((color) => color !== accent) ?? accent;

  return {
    dark,
    light,
    accent,
    mid,
    onDark: readableTextColor(dark),
    onLight: readableTextColor(light),
    onAccent: readableTextColor(accent),
    onMid: readableTextColor(mid),
  };
}

/**
 * Roles for the 60-30-10 rule: the calmest color covers about 60% (dominant), a contrasting
 * one about 30% (secondary) and the most vivid just 10% (accent). Returns null for an empty palette.
 */
export function assignSixtyThirtyTen(colors) {
  const pool = completePalette(colors);
  if (pool.length === 0) return null;

  const accent = [...pool].sort((a, b) => chroma(b) - chroma(a))[0];
  const others = pool.filter((color) => color !== accent);
  const dominant = [...others].sort((a, b) => chroma(a) - chroma(b) || luminance(b) - luminance(a))[0];
  const secondary = others
    .filter((color) => color !== dominant)
    .sort((a, b) => contrastRatio(b, dominant) - contrastRatio(a, dominant))[0];

  return {
    dominant,
    secondary,
    accent,
    onDominant: readableTextColor(dominant),
    onSecondary: readableTextColor(secondary),
    onAccent: readableTextColor(accent),
  };
}

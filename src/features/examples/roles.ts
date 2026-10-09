import { luminance, readableTextColor } from '@/shared/color/contrast';
import { contrastRatio } from '@/shared/color/contrast';
import { chroma, hexToHsl, hslToHex, normalizeHex, setLightness } from '@/shared/color/convert';

/**
 * Design roles for the example mock-ups: extremes for backgrounds and type, then an accent and a
 * mid tone.
 */
export interface Roles {
  dark: string;
  light: string;
  accent: string;
  mid: string;
  onDark: string;
  onLight: string;
  onAccent: string;
  onMid: string;
}

/**
 * Roles for the 60-30-10 rule: the calmest color covers about 60%, a contrasting one 30%, the most
 * vivid 10%.
 */
export interface RuleRoles {
  dominant: string;
  secondary: string;
  accent: string;
  onDominant: string;
  onSecondary: string;
  onAccent: string;
}

/** Roles for the four-color rule: the 60-30-10 roles, plus a rare highlight. */
export interface FourColorRoles extends RuleRoles {
  highlight: string;
  onHighlight: string;
}

const MIN_COLORS = 4;
const clamp = (value: number): number => Math.min(92, Math.max(8, value));

const unique = (colors: string[]): string[] => [
  ...new Set(colors.map(normalizeHex).filter((hex): hex is string => hex !== null)),
];

/**
 * Lightness/hue variants of one color, used to fill out a palette that is too small to design with.
 */
function fillers(seed: string): string[] {
  const { h, s, l } = hexToHsl(seed);
  return [
    setLightness(seed, clamp(l > 50 ? l - 40 : l + 40)),
    setLightness(seed, clamp(l > 50 ? l - 20 : l + 20)),
    hslToHex({ h: h + 30, s, l: clamp(l) }),
    setLightness(seed, clamp(l > 50 ? l - 55 : l + 55)),
    hslToHex({ h: h - 30, s, l: clamp(l) }),
  ];
}

/**
 * Palette of at least MIN_COLORS distinct colors: the input, padded with variants of the first
 * color.
 */
function completePalette(colors: string[]): string[] {
  const pool = unique(colors);
  if (pool.length === 0) return [];
  for (const filler of fillers(pool[0])) {
    if (pool.length >= MIN_COLORS) break;
    if (!pool.includes(filler)) pool.push(filler);
  }
  return pool;
}

/**
 * Give each palette color a design role so the example layouts work with any palette:
 * `dark` and `light` (the extremes, for backgrounds and type), `accent` (the most vivid
 * of the rest) and `mid` (what is left). Small palettes are padded with variants of the first
 * color. Returns null for an empty palette.
 */
export function assignRoles(colors: string[]): Roles | null {
  const pool = completePalette(colors);
  if (pool.length === 0) return null;

  const byLuminance = [...pool].sort((a, b) => luminance(a) - luminance(b));
  const dark = byLuminance[0];
  const light = byLuminance[byLuminance.length - 1]; // the pool is never empty here
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
 * Roles for the 60-30-10 rule: the calmest color covers about 60% (dominant), a contrasting one
 * about 30% (secondary) and the most vivid just 10% (accent). Returns null for an empty palette.
 */
export function assignSixtyThirtyTen(colors: string[]): RuleRoles | null {
  const pool = completePalette(colors);
  if (pool.length === 0) return null;

  const accent = [...pool].sort((a, b) => chroma(b) - chroma(a))[0];
  const others = pool.filter((color) => color !== accent);
  const dominant = [...others].sort(
    (a, b) => chroma(a) - chroma(b) || luminance(b) - luminance(a),
  )[0];
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

/**
 * Roles for the four-color rule (60-25-10-5): dominant, secondary and accent are chosen exactly as for
 * 60-30-10, and the color left over is the highlight, the rarest of the four. Returns null for an
 * empty palette.
 */
export function assignFourColor(colors: string[]): FourColorRoles | null {
  const roles = assignSixtyThirtyTen(colors);
  if (!roles) return null;

  const used = [roles.dominant, roles.secondary, roles.accent];
  const [highlight = roles.accent] = completePalette(colors)
    .filter((color) => !used.includes(color))
    .sort((a, b) => contrastRatio(b, roles.dominant) - contrastRatio(a, roles.dominant));

  return { ...roles, highlight, onHighlight: readableTextColor(highlight) };
}

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

const ruleRolesFrom = (dominant: string, secondary: string, accent: string): RuleRoles => ({
  dominant,
  secondary,
  accent,
  onDominant: readableTextColor(dominant),
  onSecondary: readableTextColor(secondary),
  onAccent: readableTextColor(accent),
});

const fourColorRolesFrom = (
  dominant: string,
  secondary: string,
  accent: string,
  highlight: string,
): FourColorRoles => ({
  ...ruleRolesFrom(dominant, secondary, accent),
  highlight,
  onHighlight: readableTextColor(highlight),
});

/**
 * Roles for the 60-30-10 rule: the calmest color covers about 60% (dominant), a contrasting one about
 * 30% (secondary) and the most vivid just 10% (accent). Returns null for an empty palette.
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

  return ruleRolesFrom(dominant, secondary, accent);
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

  return fourColorRolesFrom(roles.dominant, roles.secondary, roles.accent, highlight);
}

// --- shuffling -----------------------------------------------------------------------------------

/** Dominant and secondary closer than this look like one flat color, which makes a dull example. */
const MIN_ROLE_CONTRAST = 1.5;

/** Every way to choose `count` colors from `pool` and put them in order. */
function arrangements(pool: string[], count: number): string[][] {
  if (count === 0) return [[]];
  return pool.flatMap((color, index) =>
    arrangements([...pool.slice(0, index), ...pool.slice(index + 1)], count - 1).map((rest) => [
      color,
      ...rest,
    ]),
  );
}

/**
 * Pick a new way to hand the palette's colors to the first `count` roles, in order. It is always a
 * different arrangement from `current` (when one exists), and arrangements whose dominant and secondary
 * barely differ are skipped unless nothing else is left. `random` returns [0, 1).
 */
function shuffledOrder(
  colors: string[],
  count: number,
  current: string[],
  random: () => number,
): string[] | null {
  const different = arrangements(completePalette(colors), count).filter((order) =>
    order.some((color, index) => color !== current[index]),
  );
  const lively = different.filter(
    ([dominant, secondary]) => contrastRatio(dominant, secondary) >= MIN_ROLE_CONTRAST,
  );
  const choices = lively.length > 0 ? lively : different;
  return choices.length > 0 ? choices[Math.floor(random() * choices.length)] : null;
}

/**
 * A new 60-30-10 arrangement for the same palette: possibly a different color for the 60, the 30 and
 * the 10, and the colors left out may come in. Returns `current` if there is no other arrangement.
 */
export function shuffleSixtyThirtyTen(
  colors: string[],
  current: RuleRoles,
  random: () => number = Math.random,
): RuleRoles {
  const order = shuffledOrder(
    colors,
    3,
    [current.dominant, current.secondary, current.accent],
    random,
  );
  return order ? ruleRolesFrom(order[0], order[1], order[2]) : current;
}

/**
 * A new 60-25-10-5 arrangement for the same palette: the same four colors in different roles. Returns
 * `current` if there is no other arrangement.
 */
export function shuffleFourColor(
  colors: string[],
  current: FourColorRoles,
  random: () => number = Math.random,
): FourColorRoles {
  const order = shuffledOrder(
    colors,
    4,
    [current.dominant, current.secondary, current.accent, current.highlight],
    random,
  );
  return order ? fourColorRolesFrom(order[0], order[1], order[2], order[3]) : current;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeHex(input: unknown): string | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(input).trim());
  if (!match) return null;
  let digits = match[1].toLowerCase();
  if (digits.length === 3) {
    digits = digits
      .split('')
      .map((d) => d + d)
      .join('');
  }
  return `#${digits}`;
}

export function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error(`Invalid hex color: ${hex}`);
  const value = parseInt(normalized.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return (
    '#' +
    [r, g, b]
      .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l: l * 100 };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === red) h = ((green - blue) / delta) % 6;
  else if (max === green) h = (blue - red) / delta + 2;
  else h = (red - green) / delta + 4;

  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const hue = ((h % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - chroma / 2;
  const sectors: [number, number, number][] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ];
  const [r, g, b] = sectors[Math.floor(hue / 60) % 6];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export const hexToHsl = (hex: string): Hsl => rgbToHsl(hexToRgb(hex));
export const hslToHex = (hsl: Hsl): string => rgbToHex(hslToRgb(hsl));

export function rotateHue(hex: string, degrees: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, h: hsl.h + degrees });
}

export function setLightness(hex: string, l: number): string {
  return hslToHex({ ...hexToHsl(hex), l: clamp(l, 0, 100) });
}

/** How colorful a color is (0 = grey, 1 = fully saturated), independent of lightness. */
export function chroma(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

// under ~20/255 of channel spread a color reads as grey, white or black
const NEUTRAL_CHROMA = 0.08;

/**
 * True for greys, whites, blacks and tints so faint they have no usable hue. HSL saturation can't
 * be used for this: near-white and near-black colors report a high saturation despite looking
 * neutral.
 */
export const isNeutral = (hex: string): boolean => chroma(hex) < NEUTRAL_CHROMA;

/** Normalize each color, dropping anything that isn't a valid hex. */
export const normalizeHexes = (colors: string[]): string[] =>
  colors.map(normalizeHex).filter((hex): hex is string => hex !== null);

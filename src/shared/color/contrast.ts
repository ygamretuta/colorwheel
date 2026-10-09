import { hexToRgb, hexToHsl, setLightness } from './convert';

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const [lighter, darker] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

export function readableTextColor(hex: string): '#000000' | '#ffffff' {
  return contrastRatio(hex, '#000000') >= contrastRatio(hex, '#ffffff') ? '#000000' : '#ffffff';
}

/** Nudge lightness away from `against` until the contrast ratio reaches `minRatio`. */
export function ensureContrast(hex: string, against: string, minRatio: number, step = 2): string {
  const { l } = hexToHsl(hex);
  const direction = luminance(hex) >= luminance(against) ? 1 : -1;
  let candidate = hex;
  for (let next = l; next >= 0 && next <= 100; next += step * direction) {
    candidate = setLightness(hex, next);
    if (contrastRatio(candidate, against) >= minRatio) return candidate;
  }
  return candidate;
}

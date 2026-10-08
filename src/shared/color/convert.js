const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeHex(input) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(input).trim());
  if (!match) return null;
  let digits = match[1].toLowerCase();
  if (digits.length === 3) {
    digits = digits.split('').map((d) => d + d).join('');
  }
  return `#${digits}`;
}

export function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error(`Invalid hex color: ${hex}`);
  const value = parseInt(normalized.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex({ r, g, b }) {
  return (
    '#' +
    [r, g, b]
      .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function rgbToHsl({ r, g, b }) {
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

export function hslToRgb({ h, s, l }) {
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const hue = ((h % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - chroma / 2;
  const sectors = [
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

export const hexToHsl = (hex) => rgbToHsl(hexToRgb(hex));
export const hslToHex = (hsl) => rgbToHex(hslToRgb(hsl));

export function rotateHue(hex, degrees) {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, h: hsl.h + degrees });
}

export function setLightness(hex, l) {
  return hslToHex({ ...hexToHsl(hex), l: clamp(l, 0, 100) });
}

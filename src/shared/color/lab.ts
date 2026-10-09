/** CIELAB (D65) so "how different do these two colors look" is a plain distance. */

const linear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);

export interface Lab {
  l: number;
  a: number;
  b: number;
}

export function rgbToLab({ r, g, b }: { r: number; g: number; b: number }): Lab {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;
  return { l: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}

/** CIE76 colour difference: about 2.3 is a just-noticeable difference, 10+ is clearly different. */
export const deltaE = (p: Lab, q: Lab): number => Math.hypot(p.l - q.l, p.a - q.a, p.b - q.b);

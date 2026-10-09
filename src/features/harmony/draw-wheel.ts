import { hslToHex, isNeutral } from '@/shared/color/convert';

import { hueOf } from './harmony';

/**
 * Draw a hue ring and mark each color's hue; the first color is the base. `others` are the user's
 * remaining chosen colors, drawn as small dots (inside the harmony points) so the whole combination
 * shows.
 */
export function drawWheel(
  canvas: HTMLCanvasElement,
  colors: string[],
  others: string[] = [],
): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const { width, height } = canvas;
  const center = { x: width / 2, y: height / 2 };
  const outer = Math.min(width, height) / 2 - 8;
  const thickness = outer * 0.3;
  const inner = outer - thickness;
  const middle = outer - thickness / 2;

  context.clearRect(0, 0, width, height);
  context.lineWidth = thickness;
  for (let degree = 0; degree < 360; degree += 1) {
    context.beginPath();
    context.strokeStyle = hslToHex({ h: degree, s: 85, l: 55 });
    context.arc(
      center.x,
      center.y,
      middle,
      ((degree - 90.6) * Math.PI) / 180,
      ((degree - 88.8) * Math.PI) / 180,
    );
    context.stroke();
  }

  // Greys, whites and blacks have no hue, so they sit at the centre instead of at a meaningless
  // angle.
  const position = (hex: string, radius: number) => {
    if (isNeutral(hex)) return { x: center.x, y: center.y };
    const angle = ((hueOf(hex) - 90) * Math.PI) / 180;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  };

  const points = colors.map((hex) => ({ hex, ...position(hex, inner * 0.8) }));

  context.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  context.lineWidth = outer * 0.03;
  context.beginPath();
  points.forEach(({ x, y }, index) => (index ? context.lineTo(x, y) : context.moveTo(x, y)));
  if (points.length > 2) context.closePath();
  context.stroke();

  points.forEach(({ hex, x, y }, index) => {
    context.beginPath();
    context.arc(x, y, outer * (index === 0 ? 0.19 : 0.15), 0, Math.PI * 2);
    context.fillStyle = hex;
    context.fill();
    context.lineWidth = outer * 0.05;
    context.strokeStyle = '#fff';
    context.stroke();
    // thin dark edge so white and very light colors still show against the white inside of the ring
    context.lineWidth = outer * 0.015;
    context.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    context.stroke();
  });

  others.forEach((hex) => {
    const { x, y } = position(hex, inner * 0.45);
    context.beginPath();
    context.arc(x, y, outer * 0.09, 0, Math.PI * 2);
    context.fillStyle = hex;
    context.fill();
    context.lineWidth = outer * 0.04;
    context.strokeStyle = '#fff';
    context.stroke();
    context.lineWidth = outer * 0.015;
    context.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    context.stroke();
  });
}

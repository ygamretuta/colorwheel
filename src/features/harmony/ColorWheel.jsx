import './harmony.css';
import { useEffect, useRef } from 'react';
import { hslToHex } from '@/shared/color/convert.js';
import { hueOf } from '@/features/harmony/harmony.js';

/** Draw a hue ring and mark each color's hue; the first color is the base. */
export function drawWheel(canvas, colors) {
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
    context.arc(center.x, center.y, middle, ((degree - 90.6) * Math.PI) / 180, ((degree - 88.8) * Math.PI) / 180);
    context.stroke();
  }

  const points = colors.map((hex) => {
    const angle = ((hueOf(hex) - 90) * Math.PI) / 180;
    return { hex, x: center.x + Math.cos(angle) * inner * 0.8, y: center.y + Math.sin(angle) * inner * 0.8 };
  });

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
  });
}

export default function ColorWheel({ colors }) {
  const ref = useRef(null);
  useEffect(() => drawWheel(ref.current, colors), [colors]);
  return <canvas ref={ref} className="harmony__wheel" width="240" height="240" aria-label="Color wheel showing the selected harmony" />;
}

import { rgbToHex } from '@/shared/color/convert.js';

/** Map a pointer position in a displayed canvas to canvas pixel coordinates. */
export function toCanvasPoint({ clientX, clientY }, rect, canvas) {
  return {
    x: Math.floor(((clientX - rect.left) / rect.width) * canvas.width),
    y: Math.floor(((clientY - rect.top) / rect.height) * canvas.height),
  };
}

/** Average color of an ImageData-like { data, width, height }, ignoring transparent pixels. */
export function averageHex({ data }) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  }
  if (count === 0) return null;
  return rgbToHex({ r: r / count, g: g / count, b: b / count });
}

/** Sample a (2*radius+1)² square around a point so noise in photos doesn't skew the pick. */
export function sampleCanvas(canvas, { x, y }, radius = 2) {
  const left = Math.max(0, x - radius);
  const top = Math.max(0, y - radius);
  const width = Math.min(canvas.width, x + radius + 1) - left;
  const height = Math.min(canvas.height, y + radius + 1) - top;
  if (width <= 0 || height <= 0) return null;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  return averageHex(context.getImageData(left, top, width, height));
}

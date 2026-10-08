import { rgbToHex } from '@/shared/color/convert.js';

const CHANNELS = [0, 1, 2];
const MIN_DISTANCE = 28; // Euclidean RGB distance below which two swatches look like one color.

const channelRange = (pixels, channel) => {
  let min = 255;
  let max = 0;
  for (const pixel of pixels) {
    if (pixel[channel] < min) min = pixel[channel];
    if (pixel[channel] > max) max = pixel[channel];
  }
  return max - min;
};

const widestChannel = (pixels) =>
  CHANNELS.reduce((best, channel) => (channelRange(pixels, channel) > channelRange(pixels, best) ? channel : best), 0);

const average = (pixels) => {
  const sum = pixels.reduce((acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b], [0, 0, 0]);
  return { r: sum[0] / pixels.length, g: sum[1] / pixels.length, b: sum[2] / pixels.length };
};

const distance = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

/**
 * Dominant colors of an ImageData-like { data } using median cut: repeatedly split the
 * bucket with the widest color spread at its median, then average each bucket.
 * Splits land on color boundaries rather than strictly at the median.
 * Returns up to `count` hex colors, most common first, with near-duplicates removed.
 */
export function extractPalette({ data }, count = 6) {
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // ignore transparent pixels
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) return [];

  // Ask for extra buckets so de-duplication still leaves `count` distinct colors.
  const target = count * 2;
  const buckets = [pixels];
  while (buckets.length < target) {
    const candidates = buckets.filter((bucket) => bucket.length > 1 && CHANNELS.some((c) => channelRange(bucket, c) > 0));
    if (candidates.length === 0) break;
    const biggest = candidates.reduce((best, bucket) => (bucket.length * widestSpread(bucket) > best.length * widestSpread(best) ? bucket : best));
    const channel = widestChannel(biggest);
    const sorted = [...biggest].sort((a, b) => a[channel] - b[channel]);
    const middle = splitIndex(sorted, channel);
    buckets.splice(buckets.indexOf(biggest), 1, sorted.slice(0, middle), sorted.slice(middle));
  }

  const swatches = buckets
    .filter((bucket) => bucket.length > 0)
    .sort((a, b) => b.length - a.length)
    .map((bucket) => average(bucket));

  const distinct = [];
  for (const swatch of swatches) {
    if (distinct.every((kept) => distance(kept, swatch) >= MIN_DISTANCE)) distinct.push(swatch);
    if (distinct.length === count) break;
  }
  return distinct.map(rgbToHex);
}

/** Split near the median, but only where the channel value actually changes, so identical colors stay together. */
function splitIndex(sorted, channel) {
  const median = Math.floor(sorted.length / 2);
  for (let offset = 0; offset < sorted.length; offset += 1) {
    for (const index of [median - offset, median + offset]) {
      if (index > 0 && index < sorted.length && sorted[index][channel] !== sorted[index - 1][channel]) return index;
    }
  }
  return median;
}

function widestSpread(bucket) {
  return Math.max(...CHANNELS.map((channel) => channelRange(bucket, channel)));
}

/** Shrink a canvas to at most `side` pixels on its longest edge and read its pixels. */
export function readSmallImageData(canvas, side = 96) {
  const scale = Math.min(1, side / Math.max(canvas.width, canvas.height));
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(canvas.width * scale));
  small.height = Math.max(1, Math.round(canvas.height * scale));
  const context = small.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(canvas, 0, 0, small.width, small.height);
  return context.getImageData(0, 0, small.width, small.height);
}

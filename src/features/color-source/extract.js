import { rgbToHex } from '@/shared/color/convert.js';
import { deltaE, rgbToLab } from '@/shared/color/lab.js';

const BIN_SHIFT = 4; // 16 levels per channel: pixels that look alike share a bin, which also averages out noise
const MIN_SHARE = 0.01; // under 1% of the image is a speck or a stray edge pixel, never a palette color
const ACCENT_SHARE = 0.02; // between 1% and 2% a color must also stand out to count...
const ISOLATED_DELTA_E = 30; // ...i.e. look clearly different from every color already kept (a small accent, not noise)
const MIN_DELTA_E = 12; // two swatches closer than this look like the same color
const REFINE_DELTA_E = 15; // pixels this close to a cluster's main color are averaged into it
const BLEND_MAX_SHARE = 0.08; // only small colors can be dismissed as blends of two bigger ones
const BLEND_DELTA_E = 7; // how close to the line between two colors counts as "in between"
const EXTRA_CLUSTERS = 3; // cluster a few more than asked for, then prune, so noise gets its own cluster to be dropped
const MAX_ITERATIONS = 12;

/** Group opaque pixels into fine bins, keeping each bin's pixel count and exact mean color. */
function buildHistogram(data) {
  const bins = new Map();
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // ignore transparent pixels
    const key = ((data[i] >> BIN_SHIFT) << 8) | ((data[i + 1] >> BIN_SHIFT) << 4) | (data[i + 2] >> BIN_SHIFT);
    const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bin.n += 1;
    bin.r += data[i];
    bin.g += data[i + 1];
    bin.b += data[i + 2];
    bins.set(key, bin);
    total += 1;
  }
  const list = [...bins.values()].map(({ n, r, g, b }) => {
    const rgb = { r: r / n, g: g / n, b: b / n };
    return { n, rgb, lab: rgbToLab(rgb) };
  });
  return { bins: list, total };
}

/**
 * Pick starting centers: the most common color first, then repeatedly the bin that is
 * both far from every chosen center and well populated (weighted k-means++, deterministic).
 */
function seedCenters(bins, k) {
  const sorted = [...bins].sort((a, b) => b.n - a.n);
  const centers = [sorted[0].lab];
  while (centers.length < Math.min(k, bins.length)) {
    let best = null;
    let bestScore = -1;
    for (const bin of bins) {
      const nearest = Math.min(...centers.map((c) => deltaE(c, bin.lab)));
      const score = nearest * nearest * bin.n;
      if (score > bestScore) {
        bestScore = score;
        best = bin;
      }
    }
    if (bestScore <= 0) break;
    centers.push(best.lab);
  }
  return centers;
}

/** Weighted k-means in Lab space. Returns clusters of bins. */
function cluster(bins, k) {
  const centers = seedCenters(bins, k);
  let assignment = new Array(bins.length).fill(-1);

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
    const next = bins.map((bin) => {
      let best = 0;
      let bestDistance = Infinity;
      centers.forEach((center, index) => {
        const distance = deltaE(center, bin.lab);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      return best;
    });
    const stable = next.every((value, index) => value === assignment[index]);
    assignment = next;
    if (stable) break;

    centers.forEach((center, index) => {
      let weight = 0;
      const sum = { l: 0, a: 0, b: 0 };
      bins.forEach((bin, i) => {
        if (assignment[i] !== index) return;
        weight += bin.n;
        sum.l += bin.lab.l * bin.n;
        sum.a += bin.lab.a * bin.n;
        sum.b += bin.lab.b * bin.n;
      });
      if (weight > 0) centers[index] = { l: sum.l / weight, a: sum.a / weight, b: sum.b / weight };
    });
  }

  return centers
    .map((_, index) => bins.filter((_bin, i) => assignment[i] === index))
    .filter((members) => members.length > 0);
}

/**
 * A cluster's swatch is its most common color, refined by averaging only the pixels that
 * look the same as it. Averaging the whole cluster would smear neighbors into a muddy blend.
 */
function representative(members) {
  const top = members.reduce((best, bin) => (bin.n > best.n ? bin : best));
  const close = members.filter((bin) => deltaE(bin.lab, top.lab) <= REFINE_DELTA_E);
  const weight = close.reduce((sum, bin) => sum + bin.n, 0);
  const mean = (channel) => close.reduce((sum, bin) => sum + bin.rgb[channel] * bin.n, 0) / weight;
  return { rgb: { r: mean('r'), g: mean('g'), b: mean('b') } };
}

/** Distance from `point` to the segment p-q in Lab space, and how far along it the closest point is (0..1). */
function segmentDistance(point, p, q) {
  const d = { l: q.l - p.l, a: q.a - p.a, b: q.b - p.b };
  const length2 = d.l * d.l + d.a * d.a + d.b * d.b;
  if (length2 === 0) return { distance: deltaE(point, p), t: 0 };
  const t = Math.min(1, Math.max(0, ((point.l - p.l) * d.l + (point.a - p.a) * d.a + (point.b - p.b) * d.b) / length2));
  const closest = { l: p.l + t * d.l, a: p.a + t * d.a, b: p.b + t * d.b };
  return { distance: deltaE(point, closest), t };
}

/** Specks are always noise; small patches are kept only if they are a distinct accent rather than a variant of a bigger color. */
function isTooSmall(candidate, kept) {
  if (candidate.share < MIN_SHARE) return true;
  if (candidate.share >= ACCENT_SHARE) return false;
  return kept.some((swatch) => deltaE(swatch.lab, candidate.lab) < ISOLATED_DELTA_E);
}

/**
 * An edge between two colors, or a smooth gradient, produces in-between pixels that are not a
 * color of their own. A small color lying on the line between two bigger kept colors is one.
 */
function isBlendOf(candidate, kept) {
  if (candidate.share >= BLEND_MAX_SHARE) return false;
  return kept.some((first, i) =>
    kept.slice(i + 1).some((second) => {
      const { distance, t } = segmentDistance(candidate.lab, first.lab, second.lab);
      return distance < BLEND_DELTA_E && t > 0.1 && t < 0.9;
    }),
  );
}

/**
 * Dominant colors of an ImageData-like { data }, as [{ hex, share }] with share = fraction
 * of the (opaque) image that looks like that color, most common first. Shares sum to 1.
 *
 * 1. Bin pixels into a coarse histogram.  2. Cluster the bins with k-means in Lab space.
 * 3. Name each cluster by its most common real color.  4. Drop specks, small clusters that are only
 * a variant of a bigger color, clusters that look like one already kept, and small clusters that are
 * just a blend of two bigger ones. A small but clearly different color (an accent) is kept.
 */
export function extractPaletteWithShares({ data }, count = 6) {
  const { bins, total } = buildHistogram(data);
  if (total === 0) return [];

  const clusters = cluster(bins, count + EXTRA_CLUSTERS)
    .map((members) => {
      const { rgb } = representative(members);
      return { rgb, lab: rgbToLab(rgb), share: members.reduce((sum, bin) => sum + bin.n, 0) / total };
    })
    .sort((a, b) => b.share - a.share);

  const kept = [];
  const dropped = [];
  for (const candidate of clusters) {
    const isNoise = kept.length > 0 && isTooSmall(candidate, kept);
    const isDuplicate = kept.some((swatch) => deltaE(swatch.lab, candidate.lab) < MIN_DELTA_E);
    if (kept.length < count && !isNoise && !isDuplicate && !isBlendOf(candidate, kept)) kept.push(candidate);
    else dropped.push(candidate);
  }

  // Dropped colors still cover part of the image: credit that area to the swatch they look most like.
  const totals = kept.map(({ share }) => share);
  dropped.forEach((candidate) => {
    const nearest = kept.reduce((best, swatch, index) => (deltaE(swatch.lab, candidate.lab) < deltaE(kept[best].lab, candidate.lab) ? index : best), 0);
    totals[nearest] += candidate.share;
  });

  return kept
    .map(({ rgb }, index) => ({ hex: rgbToHex(rgb), share: totals[index] }))
    .sort((a, b) => b.share - a.share);
}

/** Up to `count` dominant hex colors, most common first. */
export const extractPalette = (imageData, count = 6) => extractPaletteWithShares(imageData, count).map(({ hex }) => hex);

/** Shrink a canvas to at most `side` pixels on its longest edge and read its pixels. */
export function readSmallImageData(canvas, side = 128) {
  const scale = Math.min(1, side / Math.max(canvas.width, canvas.height));
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(canvas.width * scale));
  small.height = Math.max(1, Math.round(canvas.height * scale));
  const context = small.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(canvas, 0, 0, small.width, small.height);
  return context.getImageData(0, 0, small.width, small.height);
}

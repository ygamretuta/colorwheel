import { HARMONIES, generateHarmony } from '@/features/harmony/harmony.js';
import { contrastRatio, ensureContrast } from '@/shared/color/contrast.js';
import { hexToHsl, hexToRgb, hslToHex, isNeutral, normalizeHex } from '@/shared/color/convert.js';
import { deltaE, rgbToLab } from '@/shared/color/lab.js';

const MATCH_CONTRAST = 3;
const SCHEME_CONTRAST = 1.5;
const MAX_SCHEME_COLORS = 3;
const NEUTRAL_ACCENT_HUE = 210;
const NEW_COLOR_DELTA_E = 15; // a suggestion must differ at least this much from every color already chosen
const SAME_PARTNER_DELTA_E = 12; // partners this close, from different colors, count as one shared partner
const DISTINCT_PARTNER_DELTA_E = 20; // two suggested partners should look clearly different from each other

const toLab = (hex) => rgbToLab(hexToRgb(hex));

const byContrastWith = (base) => (a, b) => contrastRatio(b, base) - contrastRatio(a, base);

/** A lighter or darker shade of `hex`, whichever stays distinct from it. */
function softTint(hex) {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: hsl.l > 55 ? hsl.l - 22 : hsl.l + 22 });
}

/** Pairings built from the base color alone. */
function suggestForBase(hex, harmony) {
  const base = normalizeHex(hex);
  if (!base) throw new Error(`Invalid hex color: ${hex}`);
  const scheme = HARMONIES[harmony];
  if (!scheme) throw new Error(`Unknown harmony: ${harmony}`);

  // Greys have no hue to rotate, so build the scheme around a neutral-friendly blue accent.
  const neutral = isNeutral(base);
  const { l } = hexToHsl(base);
  const anchor = neutral ? hslToHex({ h: NEUTRAL_ACCENT_HUE, s: 65, l: l > 50 ? 35 : 65 }) : base;
  const scheme_colors = generateHarmony(anchor, harmony);
  const partners = (neutral ? scheme_colors : scheme_colors.slice(1))
    .map((color) => ensureContrast(color, base, SCHEME_CONTRAST));

  const ranked = [...partners].sort(byContrastWith(base));
  const name = scheme.label.toLowerCase();
  const suggestions = [
    {
      id: 'best-match',
      label: 'Best match',
      reason: `The strongest contrast in the ${name} scheme, adjusted to stay legible.`,
      colors: [ensureContrast(ranked[0], base, MATCH_CONTRAST)],
    },
    ranked.length >= 2
      ? {
          id: 'balanced-pair',
          label: 'Balanced pair',
          reason: `Two colors from the ${name} scheme that contrast most with your color.`,
          colors: ranked.slice(0, 2),
        }
      : {
          id: 'balanced-pair',
          label: 'Match + shade',
          reason: `The ${name} match with a ${hexToHsl(ranked[0]).l > 55 ? 'darker' : 'lighter'} shade of it.`,
          colors: [ranked[0], softTint(ranked[0])],
        },
  ];

  if (partners.length > 2) {
    suggestions.push({
      id: 'full-scheme',
      label: 'Full scheme',
      reason: `Every color of the ${name} scheme, in wheel order.`,
      colors: partners.slice(0, MAX_SCHEME_COLORS),
    });
  }
  return suggestions;
}

/**
 * Candidate partners for a set of chosen colors: each non-grey color contributes the partners of
 * the chosen wheel type, near-identical partners are merged, and every candidate is scored by how
 * many of the chosen colors "vote" for it and how far it sits from all of them.
 */
function rankPartnersForSet(anchors, harmony) {
  const anchorLabs = anchors.map(toLab);
  const candidates = [];

  anchors.forEach((anchor, anchorIndex) => {
    if (isNeutral(anchor)) return; // greys have no hue to build a scheme from
    generateHarmony(anchor, harmony).slice(1).forEach((hex) => {
      const lab = toLab(hex);
      if (anchorLabs.some((anchorLab) => deltaE(anchorLab, lab) < NEW_COLOR_DELTA_E)) return; // adds nothing new
      const match = candidates.find((candidate) => deltaE(candidate.lab, lab) < SAME_PARTNER_DELTA_E);
      if (match) match.votes.add(anchorIndex);
      else candidates.push({ hex, lab, votes: new Set([anchorIndex]) });
    });
  });

  return candidates
    .map((candidate) => ({ ...candidate, spread: Math.min(...anchorLabs.map((anchorLab) => deltaE(anchorLab, candidate.lab))) }))
    .sort((a, b) => b.votes.size - a.votes.size || b.spread - a.spread);
}

/**
 * When the chosen colors already cover the whole wheel scheme, new hues would only repeat them,
 * so offer lighter and darker shades of what is there to add depth.
 */
function suggestShades(anchors, name) {
  const taken = anchors.map(toLab);
  const picked = [];
  anchors.forEach((anchor) => {
    const { h, s, l } = hexToHsl(anchor);
    [softTint(anchor), hslToHex({ h, s, l: l > 55 ? l - 38 : l + 38 })].forEach((hex) => {
      const lab = toLab(hex);
      const isNew = [...taken, ...picked.map((p) => p.lab)].every((other) => deltaE(other, lab) >= NEW_COLOR_DELTA_E);
      if (isNew && picked.length < MAX_SCHEME_COLORS) picked.push({ hex, lab });
    });
  });
  if (picked.length === 0) return null;

  const labels = [
    ['best-match', 'Add depth', [picked[0].hex]],
    ['balanced-pair', 'Shade pair', picked.slice(0, 2).map(({ hex }) => hex)],
    ['full-scheme', 'Shade set', picked.map(({ hex }) => hex)],
  ];
  return labels
    .filter(([, , colors], index) => index === 0 || colors.length > index)
    .map(([id, label, colors]) => ({
      id,
      label,
      reason: `Your colors already complete the ${name} scheme, so ${colors.length > 1 ? 'these shades add' : 'this shade adds'} depth.`,
      colors,
    }));
}

/**
 * Suggest one to three partner sets for `hex`, drawn from the chosen wheel type (default
 * complementary). Pass `context`, the other colors already chosen, to get partners that suit the
 * whole combination: colors that several of them agree on come first, and nothing that merely
 * repeats a chosen color is offered.
 *
 * Returns [{ id, label, reason, colors }]; `colors` excludes the base.
 */
export function suggestPairings(hex, harmony = 'complementary', context = []) {
  const base = normalizeHex(hex);
  if (!base) throw new Error(`Invalid hex color: ${hex}`);
  const scheme = HARMONIES[harmony];
  if (!scheme) throw new Error(`Unknown harmony: ${harmony}`);

  const others = [...new Set(context.map(normalizeHex).filter((color) => color && color !== base))];
  if (others.length === 0) return suggestForBase(base, harmony);

  const anchors = [base, ...others];
  const name = scheme.label.toLowerCase();
  const hasHue = anchors.some((color) => !isNeutral(color));
  if (!hasHue) return suggestForBase(base, harmony); // all greys: use the neutral-friendly accent path

  const ranked = rankPartnersForSet(anchors, harmony);
  if (ranked.length === 0) return suggestShades(anchors, name) ?? suggestForBase(base, harmony);

  const count = others.length + 1;
  const [first] = ranked;
  const fits = first.votes.size > 1 ? `, and ${first.votes.size} of your ${count} colors agree on it` : '';
  const suggestions = [
    {
      id: 'best-match',
      label: 'Best match',
      reason: `Best ${name} partner for your ${count} colors${fits}.`,
      colors: [ensureContrast(first.hex, base, MATCH_CONTRAST)],
    },
  ];

  const second = ranked.slice(1).find((candidate) => deltaE(candidate.lab, first.lab) >= DISTINCT_PARTNER_DELTA_E);
  if (second) {
    suggestions.push({
      id: 'balanced-pair',
      label: 'Balanced pair',
      reason: `Two ${name} partners that work across your ${count} colors.`,
      colors: [first.hex, second.hex],
    });
  } else {
    suggestions.push({
      id: 'balanced-pair',
      label: 'Match + shade',
      reason: `The ${name} match with a ${hexToHsl(first.hex).l > 55 ? 'darker' : 'lighter'} shade of it.`,
      colors: [first.hex, softTint(first.hex)],
    });
  }

  const spread = [];
  for (const candidate of ranked) {
    if (spread.every((chosen) => deltaE(chosen.lab, candidate.lab) >= DISTINCT_PARTNER_DELTA_E)) spread.push(candidate);
    if (spread.length === MAX_SCHEME_COLORS) break;
  }
  if (spread.length > 2) {
    suggestions.push({
      id: 'full-scheme',
      label: 'Full scheme',
      reason: `Three ${name} partners spread across your ${count} colors.`,
      colors: spread.map(({ hex: color }) => color),
    });
  }
  return suggestions;
}

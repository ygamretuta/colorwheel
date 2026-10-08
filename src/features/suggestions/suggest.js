import { HARMONIES, generateHarmony } from '@/features/harmony/harmony.js';
import { contrastRatio, ensureContrast } from '@/shared/color/contrast.js';
import { hexToHsl, hslToHex, normalizeHex } from '@/shared/color/convert.js';

const MATCH_CONTRAST = 3;
const SCHEME_CONTRAST = 1.5;
const MAX_SCHEME_COLORS = 3;
const NEUTRAL_ACCENT_HUE = 210;

const byContrastWith = (base) => (a, b) => contrastRatio(b, base) - contrastRatio(a, base);

/** A lighter or darker shade of `hex`, whichever stays distinct from it. */
function softTint(hex) {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: hsl.l > 55 ? hsl.l - 22 : hsl.l + 22 });
}

/**
 * Suggest one to three partner sets for `hex`, drawn from the chosen wheel type
 * (default complementary). Returns [{ id, label, reason, colors }]; `colors`
 * excludes the base and the list changes with `harmony`.
 */
export function suggestPairings(hex, harmony = 'complementary') {
  const base = normalizeHex(hex);
  if (!base) throw new Error(`Invalid hex color: ${hex}`);
  const scheme = HARMONIES[harmony];
  if (!scheme) throw new Error(`Unknown harmony: ${harmony}`);

  // Greys have no hue to rotate, so build the scheme around a neutral-friendly blue accent.
  const { s, l } = hexToHsl(base);
  const isNeutral = s < 8;
  const anchor = isNeutral ? hslToHex({ h: NEUTRAL_ACCENT_HUE, s: 65, l: l > 50 ? 35 : 65 }) : base;
  const scheme_colors = generateHarmony(anchor, harmony);
  const partners = (isNeutral ? scheme_colors : scheme_colors.slice(1))
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

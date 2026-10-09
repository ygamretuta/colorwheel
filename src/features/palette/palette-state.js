/**
 * The palette is built from two places:
 *
 * - `picks`: colors the user ticked (or, for `auto`, colors selected for them), and
 * - `pairing`: at most one suggested pairing the user chose.
 *
 * While a pairing is chosen it IS the palette: choosing one resets the palette to exactly its colors.
 * The earlier picks are kept out of sight, so un-choosing the pairing brings them back, and so the
 * colors the suggestions are tailored to don't change underneath the user.
 *
 * `auto` lists the picks that were selected for the user (the wheel's own colors, when nothing else
 * was chosen). They follow the wheel type until the user takes over.
 *
 * The palette never holds more than MAX_PALETTE_COLORS colors. Pairings are always within that, and
 * every operation that adds colors one by one stops at the limit.
 */
import { MAX_PALETTE_COLORS } from '@/shared/palette-limit.js';

export const EMPTY_PALETTE = { picks: [], pairing: [], auto: [] };

const unique = (colors) => [...new Set(colors)];

/** What the palette holds right now: the chosen pairing if there is one, otherwise the picks. */
export const paletteColors = ({ picks, pairing }) => unique(pairing.length > 0 ? pairing : picks);

/** True when no more colors can be added. */
export const isFull = (state) => paletteColors(state).length >= MAX_PALETTE_COLORS;

/** Picks the user chose themselves, i.e. everything that isn't auto-selected. */
const userPicks = (state) => state.picks.filter((color) => !state.auto.includes(color));

/**
 * Tap a color on the wheel's swatches. A color that is in the palette is removed from it (see
 * removeColor). Any other color is added, unless the palette is full, in which case the state is
 * returned as is. Editing the palette by hand dissolves a chosen pairing into ordinary picks.
 */
export const togglePick = (state, hex) => {
  const current = paletteColors(state);
  if (current.includes(hex)) return removeColor(state, hex);
  if (current.length >= MAX_PALETTE_COLORS) return state;
  return { picks: [...current, hex], pairing: [], auto: [] }; // the user is choosing now, so nothing stays automatic
};

/**
 * Select the wheel's colors when the user has chosen nothing themselves, replacing any earlier
 * auto-selection. Leaves manual picks alone, and a chosen pairing counts as a choice.
 */
export const applyAutoHarmony = (state, colors) => {
  if (userPicks(state).length > 0 || state.pairing.length > 0) return state;
  const selected = unique(colors).slice(0, MAX_PALETTE_COLORS);
  return { ...state, picks: selected, auto: selected };
};

/** Drop auto-selected picks (e.g. the base color changed, so they no longer match the wheel). */
export const dropAuto = (state) => ({ ...state, picks: userPicks(state), auto: [] });

/**
 * Choose a pairing: the palette becomes exactly its colors, whatever it held before. Choosing the
 * pairing that is already chosen clears it, which brings the earlier picks back.
 */
export const choosePairing = (state, colors) => {
  const same = colors.length === state.pairing.length && colors.every((c, i) => c === state.pairing[i]);
  if (same) return { ...state, pairing: [] };
  return { ...state, pairing: unique(colors).slice(0, MAX_PALETTE_COLORS) };
};

/**
 * Add several colors to the palette at once (e.g. everything found in an image), in order, skipping
 * duplicates and stopping at the palette limit. Colors that do not fit are left out. A chosen pairing
 * is kept as the starting point and becomes ordinary picks.
 */
export const addPicks = (state, colors) => {
  const picks = state.pairing.length > 0 ? [...state.pairing] : userPicks(state);
  colors.forEach((color) => {
    if (!picks.includes(color) && picks.length < MAX_PALETTE_COLORS) picks.push(color);
  });
  return { picks, pairing: [], auto: [] };
};

export const clearPairing = (state) => ({ ...state, pairing: [] });

/** Remove one color from the palette. If a pairing was chosen it dissolves, leaving its other colors as picks. */
export const removeColor = (state, hex) => ({
  picks: paletteColors(state).filter((color) => color !== hex),
  pairing: [],
  auto: [],
});

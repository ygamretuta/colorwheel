/**
 * Palette = colors toggled in the harmony step ("picks") plus at most one chosen
 * pairing, so the final palette never mixes several competing pairings.
 *
 * `auto` lists the picks that were selected for the user (the wheel's own colors, when
 * nothing else was chosen). They follow the wheel type until the user takes over by
 * toggling, adding or removing a color.
 */
export const EMPTY_PALETTE = { picks: [], pairing: [], auto: [] };

const unique = (colors) => [...new Set(colors)];

export const paletteColors = ({ picks, pairing }) => unique([...picks, ...pairing]);

/** Picks the user chose themselves, i.e. everything that isn't auto-selected. */
const userPicks = (state) => state.picks.filter((color) => !state.auto.includes(color));

export const togglePick = (state, hex) => ({
  ...state,
  auto: [], // the user is choosing now, so auto-selected colors become theirs
  picks: state.picks.includes(hex) ? state.picks.filter((c) => c !== hex) : [...state.picks, hex],
});

/**
 * Select the wheel's colors when the user has chosen nothing themselves, replacing any
 * earlier auto-selection. Leaves manual picks alone.
 */
export const applyAutoHarmony = (state, colors) =>
  userPicks(state).length > 0 ? state : { ...state, picks: unique(colors), auto: unique(colors) };

/** Drop auto-selected picks (e.g. the base color changed, so they no longer match the wheel). */
export const dropAuto = (state) => ({ ...state, picks: userPicks(state), auto: [] });

/** Choose a pairing (replacing any earlier one); choosing the same colors again clears it. */
export const choosePairing = (state, colors) => {
  const same = colors.length === state.pairing.length && colors.every((c, i) => c === state.pairing[i]);
  if (same) return { ...state, pairing: [] };
  // Choosing a pairing is a deliberate pick, so it replaces any auto-selected wheel colors.
  return { ...dropAuto(state), pairing: colors };
};

/** Add several colors to the picks at once (e.g. everything found in an image), skipping duplicates. */
export const addPicks = (state, colors) => ({
  ...state,
  auto: [],
  picks: unique([...userPicks(state), ...colors]),
});

export const clearPairing = (state) => ({ ...state, pairing: [] });

/** Remove one color from the final palette, wherever it came from. */
export const removeColor = (state, hex) => ({
  picks: unique([...state.picks, ...state.pairing]).filter((c) => c !== hex),
  pairing: [],
  auto: [],
});

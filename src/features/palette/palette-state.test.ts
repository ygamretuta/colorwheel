import { describe, expect, it } from 'vitest';

import { MAX_PALETTE_COLORS } from '@/shared/palette-limit';

import {
  addPicks,
  applyAutoHarmony,
  choosePairing,
  clearPairing,
  dropAuto,
  EMPTY_PALETTE,
  isFull,
  paletteColors,
  type PaletteState,
  removeColor,
  togglePick,
} from './palette-state';

const colors = (n: number) => Array.from({ length: n }, (_, i) => `#${String(i + 1).repeat(6)}`);
const pick = (state: PaletteState, ...hexes: string[]) =>
  hexes.reduce((current, hex) => togglePick(current, hex), state);

describe('picks', () => {
  it('toggles a color on and off', () => {
    const on = togglePick(EMPTY_PALETTE, '#111111');
    expect(paletteColors(on)).toEqual(['#111111']);
    expect(paletteColors(togglePick(on, '#111111'))).toEqual([]);
  });

  it('a hand-picked color is no longer automatic', () => {
    const state = togglePick(applyAutoHarmony(EMPTY_PALETTE, ['#111111', '#222222']), '#333333');
    expect(state.auto).toEqual([]);
    expect(paletteColors(state)).toEqual(['#111111', '#222222', '#333333']);
  });
});

describe('choosing a pairing', () => {
  const pairing = ['#aaaaaa', '#bbbbbb'];

  it('makes the palette exactly the pairing, whatever it held before', () => {
    const state = pick(EMPTY_PALETTE, '#111111', '#222222', '#333333');
    expect(paletteColors(choosePairing(state, pairing))).toEqual(pairing);
  });

  it('replaces auto-selected wheel colors too', () => {
    const state = applyAutoHarmony(EMPTY_PALETTE, ['#111111', '#222222', '#333333', '#444444']);
    expect(paletteColors(choosePairing(state, pairing))).toEqual(pairing);
  });

  it('is never blocked, even when the palette is already full', () => {
    const full = pick(EMPTY_PALETTE, ...colors(MAX_PALETTE_COLORS));
    expect(isFull(full)).toBe(true);
    const state = choosePairing(full, ['#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd']);
    expect(paletteColors(state)).toEqual(['#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd']);
  });

  it('a different pairing replaces the previous one', () => {
    const state = choosePairing(choosePairing(EMPTY_PALETTE, pairing), ['#cccccc', '#dddddd']);
    expect(paletteColors(state)).toEqual(['#cccccc', '#dddddd']);
  });

  it('choosing it again clears it and brings the earlier picks back', () => {
    const before = pick(EMPTY_PALETTE, '#111111', '#222222');
    const chosen = choosePairing(before, pairing);
    const cleared = choosePairing(chosen, pairing);
    expect(cleared.pairing).toEqual([]);
    expect(paletteColors(cleared)).toEqual(['#111111', '#222222']);
  });

  it('brings back auto-selected wheel colors when cleared', () => {
    const wheel = ['#111111', '#222222'];
    const cleared = choosePairing(
      choosePairing(applyAutoHarmony(EMPTY_PALETTE, wheel), pairing),
      pairing,
    );
    expect(paletteColors(cleared)).toEqual(wheel);
  });

  it('keeps the earlier picks out of the palette but in the state, so suggestions can stay tailored to them', () => {
    const state = choosePairing(pick(EMPTY_PALETTE, '#111111', '#222222'), pairing);
    expect(state.picks).toEqual(['#111111', '#222222']);
    expect(paletteColors(state)).not.toContain('#111111');
  });

  it('never makes the palette larger than the limit', () => {
    const oversized = colors(MAX_PALETTE_COLORS + 3);
    expect(paletteColors(choosePairing(EMPTY_PALETTE, oversized))).toHaveLength(MAX_PALETTE_COLORS);
  });
});

describe('editing a palette that is a chosen pairing', () => {
  const chosen = () =>
    choosePairing(pick(EMPTY_PALETTE, '#111111'), ['#aaaaaa', '#bbbbbb', '#cccccc']);

  it('removing one of its colors leaves the others as ordinary picks, with no pairing chosen', () => {
    const after = togglePick(chosen(), '#aaaaaa');
    expect(after).toEqual({ picks: ['#bbbbbb', '#cccccc'], pairing: [], auto: [] });
  });

  it('adding a color keeps the pairing colors and adds the new one', () => {
    const after = togglePick(chosen(), '#dddddd');
    expect(paletteColors(after)).toEqual(['#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd']);
    expect(after.pairing).toEqual([]);
  });

  it('a color only in the hidden earlier picks counts as new, not as present', () => {
    expect(paletteColors(togglePick(chosen(), '#111111'))).toContain('#111111');
  });

  it('removeColor does the same as unchecking', () => {
    expect(removeColor(chosen(), '#bbbbbb')).toEqual({
      picks: ['#aaaaaa', '#cccccc'],
      pairing: [],
      auto: [],
    });
  });
});

describe('addPicks (adding colors from an image)', () => {
  it('adds colors without duplicates, keeping existing picks', () => {
    const start = pick(EMPTY_PALETTE, '#111111');
    expect(addPicks(start, ['#111111', '#222222', '#222222']).picks).toEqual([
      '#111111',
      '#222222',
    ]);
  });

  it('keeps only as many colors as fit, in order', () => {
    const result = addPicks(EMPTY_PALETTE, colors(6));
    expect(result.picks).toEqual(colors(4));
    expect(paletteColors(result)).toHaveLength(4);
  });

  it('fills only the remaining room', () => {
    const start = pick(EMPTY_PALETTE, '#999999', '#888888');
    expect(addPicks(start, colors(6)).picks).toEqual([
      '#999999',
      '#888888',
      colors(2)[0],
      colors(2)[1],
    ]);
  });

  it('replaces auto-selected colors, keeping manual ones', () => {
    const auto = applyAutoHarmony(EMPTY_PALETTE, ['#111111', '#222222']);
    const result = addPicks(auto, ['#aaaaaa']);
    expect(result.picks).toEqual(['#aaaaaa']);
    expect(result.auto).toEqual([]);
  });

  it('builds on a chosen pairing, which becomes ordinary picks', () => {
    const start = choosePairing(EMPTY_PALETTE, ['#aaaaaa', '#bbbbbb', '#cccccc']);
    const result = addPicks(start, ['#111111', '#222222']);
    expect(result.picks).toEqual(['#aaaaaa', '#bbbbbb', '#cccccc', '#111111']); // one slot was left
    expect(result.pairing).toEqual([]);
  });

  it('dropAuto removes only the auto colors', () => {
    const mixed = { picks: ['#111111', '#999999'], pairing: [], auto: ['#111111'] };
    expect(dropAuto(mixed)).toEqual({ picks: ['#999999'], pairing: [], auto: [] });
  });
});

describe('auto-selected wheel colors', () => {
  const wheelA = ['#111111', '#222222'];
  const wheelB = ['#111111', '#333333', '#444444'];

  it('selects the wheel colors when nothing is chosen', () => {
    const state = applyAutoHarmony(EMPTY_PALETTE, wheelA);
    expect(paletteColors(state)).toEqual(wheelA);
    expect(state.auto).toEqual(wheelA);
  });

  it('follows the wheel type until the user takes over', () => {
    expect(
      paletteColors(applyAutoHarmony(applyAutoHarmony(EMPTY_PALETTE, wheelA), wheelB)),
    ).toEqual(wheelB);
  });

  it('leaves manual picks alone', () => {
    const manual = togglePick(EMPTY_PALETTE, '#999999');
    expect(applyAutoHarmony(manual, wheelA)).toBe(manual);
  });

  it('toggling a swatch hands the auto colors to the user', () => {
    const state = togglePick(applyAutoHarmony(EMPTY_PALETTE, wheelA), '#222222');
    expect(paletteColors(state)).toEqual(['#111111']);
    expect(applyAutoHarmony(state, wheelB)).toBe(state);
  });

  it('selects again after the user deselects everything', () => {
    const state = pick(applyAutoHarmony(EMPTY_PALETTE, wheelA), '#111111', '#222222');
    expect(paletteColors(state)).toEqual([]);
    expect(paletteColors(applyAutoHarmony(state, wheelB))).toEqual(wheelB);
  });

  it('never selects more than the limit, even for a five-color wheel', () => {
    const state = applyAutoHarmony(EMPTY_PALETTE, colors(5));
    expect(paletteColors(state)).toEqual(colors(4));
    expect(state.auto).toEqual(colors(4));
  });

  it('leaves a chosen pairing alone when applied again (coming back to step 2)', () => {
    const state = choosePairing(applyAutoHarmony(EMPTY_PALETTE, colors(4)), ['#aaaaaa', '#bbbbbb']);
    expect(applyAutoHarmony(state, colors(4))).toBe(state);
    expect(paletteColors(state)).toEqual(['#aaaaaa', '#bbbbbb']);
  });

  it('selects the wheel again once the pairing is cleared and nothing else is chosen', () => {
    const state = choosePairing(choosePairing(EMPTY_PALETTE, ['#aaaaaa', '#bbbbbb']), [
      '#aaaaaa',
      '#bbbbbb',
    ]);
    expect(paletteColors(applyAutoHarmony(state, wheelA))).toEqual(wheelA);
  });
});

describe('palette limit', () => {
  const full = () => pick(EMPTY_PALETTE, ...colors(MAX_PALETTE_COLORS));

  it('is four colors', () => {
    expect(MAX_PALETTE_COLORS).toBe(4);
  });

  it('togglePick stops at the limit and leaves a full palette untouched', () => {
    const state = full();
    expect(paletteColors(state)).toHaveLength(4);
    expect(isFull(state)).toBe(true);
    expect(togglePick(state, '#999999')).toBe(state);
  });

  it('togglePick still removes from a full palette, which frees a slot', () => {
    const removed = togglePick(full(), colors(4)[0]);
    expect(isFull(removed)).toBe(false);
    expect(paletteColors(togglePick(removed, '#999999'))).toHaveLength(4);
  });

  it('a full chosen pairing is a full palette', () => {
    const state = choosePairing(EMPTY_PALETTE, colors(4));
    expect(isFull(state)).toBe(true);
    expect(togglePick(state, '#999999')).toBe(state);
  });

  it('never exceeds the limit through any sequence of operations', () => {
    let state: PaletteState = EMPTY_PALETTE;
    const operations: ((st: PaletteState) => PaletteState)[] = [
      (st) => addPicks(st, colors(6)),
      (st) => togglePick(st, '#aaaaaa'),
      (st) => choosePairing(st, ['#bbbbbb', '#cccccc', '#dddddd', '#eeeeee']),
      (st) => applyAutoHarmony(st, colors(5)),
      (st) => togglePick(st, colors(1)[0]),
      (st) => choosePairing(st, ['#dddddd']),
      (st) => addPicks(st, ['#eeeeee', '#ffffff']),
      (st) => removeColor(st, colors(2)[1]),
      (st) => togglePick(st, '#123456'),
      (st) => clearPairing(st),
      (st) => applyAutoHarmony(st, colors(5)),
    ];
    operations.forEach((operation) => {
      state = operation(state);
      expect(paletteColors(state).length).toBeLessThanOrEqual(MAX_PALETTE_COLORS);
    });
  });
});

describe('unchecking a color on the wheel swatches', () => {
  it('removes a color that is part of the chosen pairing', () => {
    const state = choosePairing(EMPTY_PALETTE, ['#aaaaaa', '#bbbbbb', '#cccccc']);
    expect(paletteColors(togglePick(state, '#bbbbbb'))).toEqual(['#aaaaaa', '#cccccc']);
  });

  it('removes a color that was picked directly and is also in the pairing', () => {
    const state = choosePairing(togglePick(EMPTY_PALETTE, '#aaaaaa'), ['#aaaaaa', '#bbbbbb']);
    const after = togglePick(state, '#aaaaaa');
    expect(paletteColors(after)).toEqual(['#bbbbbb']);
    expect(after.picks).not.toContain('#aaaaaa');
  });

  it('removes an auto-selected color and hands the rest to the user', () => {
    const state = applyAutoHarmony(EMPTY_PALETTE, ['#111111', '#222222', '#333333']);
    const after = togglePick(state, '#222222');
    expect(paletteColors(after)).toEqual(['#111111', '#333333']);
    expect(after.auto).toEqual([]);
  });

  it('can be added back afterwards', () => {
    const removed = togglePick(choosePairing(EMPTY_PALETTE, ['#aaaaaa', '#bbbbbb']), '#aaaaaa');
    expect(paletteColors(togglePick(removed, '#aaaaaa'))).toEqual(['#bbbbbb', '#aaaaaa']);
  });
});

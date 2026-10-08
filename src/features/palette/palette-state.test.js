import { describe, expect, it } from 'vitest';
import { EMPTY_PALETTE, addPicks, applyAutoHarmony, choosePairing, clearPairing, dropAuto, paletteColors, removeColor, togglePick } from './palette-state.js';

describe('palette state', () => {
  it('toggles picks', () => {
    const on = togglePick(EMPTY_PALETTE, '#111111');
    expect(on.picks).toEqual(['#111111']);
    expect(togglePick(on, '#111111').picks).toEqual([]);
  });

  it('only keeps one pairing: choosing another replaces it', () => {
    const a = choosePairing(EMPTY_PALETTE, ['#aaaaaa', '#bbbbbb']);
    const b = choosePairing(a, ['#aaaaaa', '#cccccc']);
    expect(b.pairing).toEqual(['#aaaaaa', '#cccccc']);
    expect(paletteColors(b)).toEqual(['#aaaaaa', '#cccccc']);
  });

  it('choosing the same pairing again clears it', () => {
    const a = choosePairing(EMPTY_PALETTE, ['#aaaaaa', '#bbbbbb']);
    expect(choosePairing(a, ['#aaaaaa', '#bbbbbb']).pairing).toEqual([]);
  });

  it('keeps harmony picks when the pairing changes, without duplicates', () => {
    const state = choosePairing(togglePick(EMPTY_PALETTE, '#aaaaaa'), ['#aaaaaa', '#bbbbbb']);
    expect(paletteColors(state)).toEqual(['#aaaaaa', '#bbbbbb']);
    expect(paletteColors(clearPairing(state))).toEqual(['#aaaaaa']);
  });

  it('removing a pairing color keeps its siblings as plain picks', () => {
    const state = choosePairing(EMPTY_PALETTE, ['#aaaaaa', '#bbbbbb', '#cccccc']);
    const next = removeColor(state, '#bbbbbb');
    expect(next).toEqual({ picks: ['#aaaaaa', '#cccccc'], pairing: [], auto: [] });
  });
});

describe('addPicks', () => {
  it('adds colors without duplicates, keeping existing picks and the pairing', () => {
    const start = choosePairing(togglePick(EMPTY_PALETTE, '#111111'), ['#999999']);
    const next = addPicks(start, ['#111111', '#222222', '#222222']);
    expect(next.picks).toEqual(['#111111', '#222222']);
    expect(next.pairing).toEqual(['#999999']);
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
    const state = applyAutoHarmony(applyAutoHarmony(EMPTY_PALETTE, wheelA), wheelB);
    expect(paletteColors(state)).toEqual(wheelB);
  });

  it('leaves manual picks alone', () => {
    const manual = togglePick(EMPTY_PALETTE, '#999999');
    expect(applyAutoHarmony(manual, wheelA)).toBe(manual);
  });

  it('toggling a swatch hands the auto colors over to the user', () => {
    const state = togglePick(applyAutoHarmony(EMPTY_PALETTE, wheelA), '#222222');
    expect(state.picks).toEqual(['#111111']);
    expect(state.auto).toEqual([]);
    expect(applyAutoHarmony(state, wheelB)).toBe(state);
  });

  it('selects again after the user deselects everything', () => {
    let state = togglePick(applyAutoHarmony(EMPTY_PALETTE, wheelA), '#111111');
    state = togglePick(state, '#222222');
    expect(state.picks).toEqual([]);
    expect(paletteColors(applyAutoHarmony(state, wheelB))).toEqual(wheelB);
  });

  it('adding image colors replaces the auto colors, keeping manual ones', () => {
    const state = addPicks(applyAutoHarmony(EMPTY_PALETTE, wheelA), ['#aaaaaa']);
    expect(state.picks).toEqual(['#aaaaaa']);
    expect(state.auto).toEqual([]);
  });

  it('dropAuto removes only auto colors', () => {
    const mixed = { picks: ['#111111', '#999999'], pairing: [], auto: ['#111111'] };
    expect(dropAuto(mixed)).toEqual({ picks: ['#999999'], pairing: [], auto: [] });
  });
});

describe('choosing a pairing over auto-selected colors', () => {
  it('replaces the auto colors but keeps manual picks', () => {
    const auto = applyAutoHarmony(EMPTY_PALETTE, ['#111111', '#222222']);
    expect(paletteColors(choosePairing(auto, ['#111111', '#555555']))).toEqual(['#111111', '#555555']);

    const mixed = { picks: ['#111111', '#999999'], pairing: [], auto: ['#111111'] };
    expect(paletteColors(choosePairing(mixed, ['#555555']))).toEqual(['#999999', '#555555']);
  });
});

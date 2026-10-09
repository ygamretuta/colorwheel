import { describe, expect, it } from 'vitest';
import { STEPS, canVisit, clampStep } from './steps';

describe('steps', () => {
  it('clamps navigation inside the step range', () => {
    expect(clampStep(-1)).toBe(0);
    expect(clampStep(2)).toBe(2);
    expect(clampStep(99)).toBe(STEPS.length - 1);
  });

  it('gives every step a unique id, title and hint', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length);
    STEPS.forEach((s) => expect(s.title && s.hint).toBeTruthy());
  });
});

describe('canVisit', () => {
  it('allows every step up to the furthest one reached', () => {
    expect(canVisit(0, 0)).toBe(true);
    expect(canVisit(1, 1)).toBe(true);
    expect(canVisit(0, 2)).toBe(true);
    expect(canVisit(2, 2)).toBe(true);
  });

  it('locks steps beyond the furthest one reached', () => {
    expect(canVisit(1, 0)).toBe(false);
    expect(canVisit(2, 1)).toBe(false);
  });

  it('rejects indexes that are not steps', () => {
    expect(canVisit(-1, 2)).toBe(false);
  });
});

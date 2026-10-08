import { describe, expect, it } from 'vitest';
import { STEPS, clampStep } from './steps.js';

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

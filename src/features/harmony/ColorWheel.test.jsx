import { describe, expect, it, vi } from 'vitest';
import { drawWheel } from './ColorWheel.jsx';

/** A fake 2D context that records how many dots (full circles) were drawn. */
function fakeCanvas() {
  const circles = [];
  const noop = () => {};
  const context = new Proxy({}, {
    get: (_target, name) => {
      if (name === 'arc') return (x, y, r, start, end) => circles.push({ x, y, r, full: end - start > 6 });
      return noop;
    },
    set: () => true,
  });
  return { canvas: { width: 240, height: 240, getContext: vi.fn(() => context) }, circles };
}

describe('drawWheel', () => {
  const dots = (circles) => circles.filter((circle) => circle.full);

  it('marks one dot per harmony color', () => {
    const { canvas, circles } = fakeCanvas();
    drawWheel(canvas, ['#ff0000', '#00ff00', '#0000ff']);
    expect(dots(circles)).toHaveLength(3);
  });

  it('adds a small dot for each of the other chosen colors', () => {
    const base = fakeCanvas();
    drawWheel(base.canvas, ['#ff0000', '#00ffff']);
    const withOthers = fakeCanvas();
    drawWheel(withOthers.canvas, ['#ff0000', '#00ffff'], ['#a8dadc', '#1d3557']);

    expect(dots(withOthers.circles)).toHaveLength(dots(base.circles).length + 2);
    const extra = dots(withOthers.circles).slice(-2);
    const harmonyRadius = Math.min(...dots(withOthers.circles).slice(0, 2).map((c) => c.r));
    extra.forEach((dot) => expect(dot.r).toBeLessThan(harmonyRadius));
  });

  it('does nothing without a 2D context', () => {
    expect(() => drawWheel({ width: 240, height: 240, getContext: () => null }, ['#ff0000'], ['#00ff00'])).not.toThrow();
  });

  it('marks a neutral base at the centre, since greys, whites and blacks have no hue', () => {
    const { canvas, circles } = fakeCanvas();
    drawWheel(canvas, ['#ffffff', '#2f6fb3', '#b3702f']);
    const [neutralDot, ...hued] = dots(circles);
    expect(neutralDot.x).toBe(120);
    expect(neutralDot.y).toBe(120);
    hued.forEach((dot) => expect(Math.hypot(dot.x - 120, dot.y - 120)).toBeGreaterThan(30));
  });

  it('puts a chromatic base on the ring side, not at the centre', () => {
    const { canvas, circles } = fakeCanvas();
    drawWheel(canvas, ['#ff0000', '#00ffff']);
    dots(circles).forEach((dot) => expect(Math.hypot(dot.x - 120, dot.y - 120)).toBeGreaterThan(30));
  });
});


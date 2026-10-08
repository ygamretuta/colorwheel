import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollToIfNeeded } from './scroll.js';

afterEach(() => vi.restoreAllMocks());

describe('scrollToIfNeeded', () => {
  it('scrolls the element into view with block: nearest, smoothly', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb());
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const element = { scrollIntoView: vi.fn() };
    scrollToIfNeeded(element);
    expect(element.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('skips the animation when the user prefers reduced motion', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb());
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const element = { scrollIntoView: vi.fn() };
    scrollToIfNeeded(element);
    expect(element.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' });
  });

  it('ignores missing elements', () => {
    expect(() => scrollToIfNeeded(null)).not.toThrow();
  });
});

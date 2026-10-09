import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollToIfNeeded } from './scroll';

afterEach(() => vi.restoreAllMocks());

describe('scrollToIfNeeded', () => {
  it('scrolls the element into view with block: nearest, smoothly', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const element = { scrollIntoView: vi.fn() };
    scrollToIfNeeded(element as unknown as Element);
    expect(element.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('skips the animation when the user prefers reduced motion', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const element = { scrollIntoView: vi.fn() };
    scrollToIfNeeded(element as unknown as Element);
    expect(element.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' });
  });

  it('ignores missing elements', () => {
    expect(() => scrollToIfNeeded(null)).not.toThrow();
  });
});

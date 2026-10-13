/**
 * jsdom has no IntersectionObserver, which motion uses to start "when in view" animations. This stand-in
 * reports every observed element as visible straight away, so those animations reach their end state.
 */
class VisibleObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds = [0];

  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    const entry = {
      isIntersecting: true,
      intersectionRatio: 1,
      target,
    } as IntersectionObserverEntry;
    this.callback([entry], this);
  }

  unobserve() {
    // nothing is held between observations
  }
  disconnect() {
    // nothing is held between observations
  }
  takeRecords() {
    return [];
  }
}

globalThis.IntersectionObserver = VisibleObserver;

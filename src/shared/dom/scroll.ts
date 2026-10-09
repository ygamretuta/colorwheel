const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Bring `element` into view only if it isn't already, so screens that fit stay still
 * and short phones scroll down to the next thing to do. Waits a frame so freshly
 * rendered content is measured.
 */
export function scrollToIfNeeded(element: Element | null | undefined): void {
  if (!element?.scrollIntoView) return;
  requestAnimationFrame(() => {
    element.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

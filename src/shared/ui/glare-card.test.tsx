import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GlareCard } from './glare-card';

const setup = () => {
  render(
    <GlareCard>
      <p>content</p>
    </GlareCard>,
  );
  const card = screen.getByText('content').parentElement!;
  card.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 }) as DOMRect;
  return card;
};

describe('GlareCard', () => {
  it('shows its content', () => {
    setup();
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('puts the sheen under the mouse', () => {
    const card = setup();
    fireEvent.pointerMove(card, { clientX: 150, clientY: 25, pointerType: 'mouse' });
    expect(card.style.getPropertyValue('--glare-x')).toBe('75%');
    expect(card.style.getPropertyValue('--glare-y')).toBe('25%');
  });

  it('tilts toward the mouse', () => {
    const card = setup();
    fireEvent.pointerMove(card, { clientX: 200, clientY: 0, pointerType: 'mouse' });
    expect(parseFloat(card.style.getPropertyValue('--tilt-y'))).toBeGreaterThan(0);
    expect(parseFloat(card.style.getPropertyValue('--tilt-x'))).toBeGreaterThan(0);
  });

  it('settles back when the mouse leaves', () => {
    const card = setup();
    fireEvent.pointerMove(card, { clientX: 150, clientY: 25, pointerType: 'mouse' });
    fireEvent.pointerLeave(card);
    expect(card.style.getPropertyValue('--glare-x')).toBe('');
    expect(card.style.getPropertyValue('--tilt-x')).toBe('');
  });

  it('ignores touch, so it never gets in the way of scrolling', () => {
    const card = setup();
    fireEvent.pointerMove(card, { clientX: 150, clientY: 25, pointerType: 'touch' });
    expect(card.style.getPropertyValue('--glare-x')).toBe('');
  });

  it('puts the sheen out of the accessibility tree', () => {
    const card = setup();
    expect(card.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});

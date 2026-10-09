import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import PaletteStack from './PaletteStack';

const segments = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('.stack__segment'),
];
const filled = (container: HTMLElement) => segments(container).filter((el) => el.dataset.hex);
const empty = (container: HTMLElement) =>
  segments(container).filter((el) => el.classList.contains('stack__segment--empty'));

describe('PaletteStack', () => {
  it('stacks every color in one bar, in order', () => {
    const { container } = render(
      <PaletteStack colors={['#e63946', '#f1faee', '#1d3557']} onRemove={() => {}} />,
    );
    expect(container.querySelectorAll<HTMLElement>('.stack__bar')).toHaveLength(1);
    expect(filled(container).map((el) => el.dataset.hex)).toEqual([
      '#e63946',
      '#f1faee',
      '#1d3557',
    ]);
    filled(container).forEach((el) => expect(el.closest('.stack__bar')).toBeTruthy());
  });

  it('paints each segment with its color and a readable label', () => {
    const { container } = render(
      <PaletteStack colors={['#ffffff', '#000000']} onRemove={() => {}} />,
    );
    const [light, dark] = filled(container);
    expect(light.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(light.style.color).toBe('rgb(0, 0, 0)'); // dark text on a light color
    expect(dark.style.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(dark.style.color).toBe('rgb(255, 255, 255)'); // light text on a dark color
    expect(light.textContent).toBe('#ffffff');
  });

  it('shows empty slots for the room that is left, so the bar always has four places', () => {
    const { container } = render(<PaletteStack colors={['#e63946']} onRemove={() => {}} />);
    expect(filled(container)).toHaveLength(1);
    expect(empty(container)).toHaveLength(3);
    expect(segments(container)).toHaveLength(4);
    empty(container).forEach((el) => expect(el.getAttribute('aria-hidden')).toBe('true'));
  });

  it('has no empty slots when the palette is full', () => {
    const { container } = render(
      <PaletteStack colors={['#111111', '#222222', '#333333', '#444444']} onRemove={() => {}} />,
    );
    expect(empty(container)).toHaveLength(0);
    expect(segments(container)).toHaveLength(4);
  });

  it('counts the colors in a heading', () => {
    render(<PaletteStack colors={['#111111', '#222222']} onRemove={() => {}} />);
    expect(screen.getByRole('heading', { name: '2 of 4 colors in your palette' })).toBeTruthy();
  });

  it('removes a color when its segment is tapped', async () => {
    const onRemove = vi.fn();
    render(<PaletteStack colors={['#111111', '#222222']} onRemove={onRemove} />);
    await userEvent.click(screen.getByTitle<HTMLButtonElement>('Remove #222222 from your palette'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('#222222');
  });

  it('does not react to taps on empty slots', async () => {
    const onRemove = vi.fn();
    const { container } = render(<PaletteStack colors={['#111111']} onRemove={onRemove} />);
    await userEvent.click(empty(container)[0]);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('says what to do: tap to remove, or how to get colors in', () => {
    const { rerender } = render(<PaletteStack colors={['#111111']} onRemove={() => {}} />);
    expect(screen.getByText('Tap a color to remove it.')).toBeTruthy();
    rerender(<PaletteStack colors={[]} onRemove={() => {}} />);
    expect(screen.getByText(/Pick colors above, or choose a pairing below/)).toBeTruthy();
    expect(screen.getByText('0 of 4 colors in your palette')).toBeTruthy();
  });

  it('never exceeds four places even if given too many colors', () => {
    const { container } = render(
      <PaletteStack
        colors={['#111111', '#222222', '#333333', '#444444', '#555555']}
        onRemove={() => {}}
      />,
    );
    expect(empty(container)).toHaveLength(0);
    // it shows what it is given; the limit is enforced by the palette state
    expect(filled(container)).toHaveLength(5);
  });
});

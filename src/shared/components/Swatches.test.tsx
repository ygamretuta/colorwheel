import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Swatches from './Swatches';

describe('Swatches', () => {
  it('renders BEM swatches and reports selection', async () => {
    const onSelect = vi.fn();
    const { container } = render(<Swatches colors={['#ff0000', '#00ff00']} activeHex="#ff0000" onSelect={onSelect} />);
    const items = container.querySelectorAll<HTMLElement>('.swatches__item');
    expect(items).toHaveLength(2);
    expect(items[0].classList.contains('swatches__item--active')).toBe(true);
    await userEvent.click(screen.getByText('#00ff00'));
    expect(onSelect).toHaveBeenCalledWith('#00ff00');
  });
});

describe('Swatches as toggles', () => {
  it('marks selected colors as pressed', () => {
    render(<Swatches colors={['#ff0000', '#00ff00']} selected={['#00ff00']} onSelect={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });
});

describe('Swatches active vs selected', () => {
  it('tells the current color apart from selected colors, and allows both', () => {
    const { container } = render(
      <Swatches colors={['#ff0000', '#00ff00', '#0000ff']} activeHex="#ff0000" selected={['#ff0000', '#0000ff']} onSelect={() => {}} />,
    );
    const [red, green, blue] = container.querySelectorAll<HTMLElement>('.swatches__item');
    expect(red.className).toContain('swatches__item--active');
    expect(red.className).toContain('swatches__item--selected');
    expect(red.getAttribute('aria-current')).toBe('true');
    expect(green.className).not.toMatch(/--(active|selected)/);
    expect(blue.className).toContain('swatches__item--selected');
    expect(blue.className).not.toContain('swatches__item--active');
    expect(blue.getAttribute('aria-current')).toBeNull();
  });
});

describe('Swatches disabledColors', () => {
  it('shows disabled colors dimmed and does not let them be tapped', async () => {
    const onSelect = vi.fn();
    render(<Swatches colors={['#ff0000', '#00ff00']} selected={['#ff0000']} onSelect={onSelect} disabledColors={['#00ff00']} />);
    const locked = screen.getByTitle<HTMLButtonElement>(/Palette is full: remove a color to add #00ff00/);
    expect(locked.disabled).toBe(true);
    expect(locked.className).toContain('swatches__item--locked');
    await userEvent.click(locked);
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTitle<HTMLButtonElement>('Remove #ff0000')); // selected colors can always be removed
    expect(onSelect).toHaveBeenCalledWith('#ff0000');
  });

  it('ignores disabledColors on read-only swatches', () => {
    const { container } = render(<Swatches colors={['#ff0000']} disabledColors={['#ff0000']} />);
    expect(container.querySelector<HTMLElement>('.swatches__item--locked')).toBeNull();
  });
});

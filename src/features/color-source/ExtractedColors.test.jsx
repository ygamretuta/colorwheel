import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ExtractedColors from './ExtractedColors.jsx';

const COLORS = ['#ff0000', '#00ff00', '#0000ff'];
const setup = (props = {}) => {
  const onPick = vi.fn();
  const onAdd = vi.fn();
  render(<ExtractedColors colors={COLORS} activeHex="#ff0000" onPick={onPick} onAdd={onAdd} {...props} />);
  return { onPick, onAdd };
};

describe('ExtractedColors', () => {
  it('tapping a swatch picks the base color by default', async () => {
    const { onPick } = setup();
    await userEvent.click(screen.getByTitle('Use #00ff00'));
    expect(onPick).toHaveBeenCalledWith('#00ff00');
  });

  it('adds every color from the default button', async () => {
    const { onAdd } = setup();
    await userEvent.click(screen.getByText('Add all to palette'));
    expect(onAdd).toHaveBeenCalledWith(COLORS);
    expect(screen.getByText('Added to palette ✓')).toBeTruthy();
  });

  it('select-multiple mode toggles swatches instead of picking', async () => {
    const { onPick } = setup();
    await userEvent.click(screen.getByText('Select multiple'));
    await userEvent.click(screen.getByTitle('Add #00ff00'));
    await userEvent.click(screen.getByTitle('Add #0000ff'));
    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByTitle('Remove #00ff00').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Add selected (2) to palette')).toBeTruthy();
  });

  it('adds only the selected colors, then clears the selection', async () => {
    const { onAdd } = setup();
    await userEvent.click(screen.getByText('Select multiple'));
    expect(screen.getByText(/^Add selected \(0\)/).closest('button').disabled).toBe(true);
    await userEvent.click(screen.getByTitle('Add #ff0000'));
    await userEvent.click(screen.getByTitle('Add #0000ff'));
    await userEvent.click(screen.getByText('Add selected (2) to palette'));
    expect(onAdd).toHaveBeenCalledWith(['#ff0000', '#0000ff']);
    expect(screen.getByText('Added 2 to palette ✓')).toBeTruthy();
    expect(screen.getByTitle('Add #ff0000').getAttribute('aria-pressed')).toBe('false');
  });

  it('can deselect, and leaving the mode drops the selection', async () => {
    setup();
    await userEvent.click(screen.getByText('Select multiple'));
    await userEvent.click(screen.getByTitle('Add #ff0000'));
    await userEvent.click(screen.getByTitle('Remove #ff0000'));
    expect(screen.getByText(/^Add selected \(0\)/)).toBeTruthy();
    await userEvent.click(screen.getByTitle('Add #ff0000'));
    await userEvent.click(screen.getByText('Done selecting'));
    await userEvent.click(screen.getByText('Select multiple'));
    expect(screen.getByText(/^Add selected \(0\)/)).toBeTruthy();
  });
});

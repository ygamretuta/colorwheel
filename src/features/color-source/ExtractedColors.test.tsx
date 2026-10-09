import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ExtractedColors from './ExtractedColors';

const COLORS = ['#ff0000', '#00ff00', '#0000ff'];
const setup = (props = {}) => {
  const onPick = vi.fn();
  const onAdd = vi.fn();
  render(
    <ExtractedColors
      colors={COLORS}
      activeHex="#ff0000"
      onPick={onPick}
      onAdd={onAdd}
      {...props}
    />,
  );
  return { onPick, onAdd };
};

describe('ExtractedColors', () => {
  it('lists the colors, with the current one marked', () => {
    setup();
    expect(screen.getByText('Colors in this image')).toBeTruthy();
    expect(screen.getAllByTitle<HTMLButtonElement>(/^Use #/)).toHaveLength(3);
    expect(screen.getByTitle<HTMLButtonElement>('Use #ff0000').getAttribute('aria-current')).toBe(
      'true',
    );
    expect(
      screen.getByTitle<HTMLButtonElement>('Use #00ff00').getAttribute('aria-current'),
    ).toBeNull();
  });

  it('tapping a swatch picks it as the base color', async () => {
    const { onPick, onAdd } = setup();
    await userEvent.click(screen.getByTitle<HTMLButtonElement>('Use #00ff00'));
    expect(onPick).toHaveBeenCalledWith('#00ff00');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('adds every color to the palette from the button and confirms', async () => {
    const { onAdd } = setup();
    await userEvent.click(screen.getByText('Add all to palette'));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(COLORS);
    expect(screen.getByText('Added to palette ✓')).toBeTruthy();
  });

  it('has no multi-select controls', () => {
    setup();
    expect(screen.queryByText('Select multiple')).toBeNull();
    expect(screen.queryByText(/Add selected/)).toBeNull();
    expect(screen.queryByText(/selected/i)).toBeNull();
  });

  it('swatches are plain picks, not toggles', () => {
    setup();
    screen
      .getAllByTitle<HTMLButtonElement>(/^Use #/)
      .forEach((swatch) => expect(swatch.getAttribute('aria-pressed')).toBeNull());
  });
});

describe('ExtractedColors with more colors than the palette holds', () => {
  const SIX = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];

  it('offers to add only the top four', () => {
    render(
      <ExtractedColors
        colors={SIX}
        activeHex="#ff0000"
        onPick={() => {}}
        onAdd={() => ({ added: 4, total: 6 })}
      />,
    );
    expect(screen.getByText('Add top 4 to palette')).toBeTruthy();
  });

  it('says how many fit after adding', async () => {
    render(
      <ExtractedColors
        colors={SIX}
        activeHex="#ff0000"
        onPick={() => {}}
        onAdd={() => ({ added: 4, total: 6 })}
      />,
    );
    await userEvent.click(screen.getByText('Add top 4 to palette'));
    expect(screen.getByText('Added 4 of 6 (palette holds 4) ✓')).toBeTruthy();
  });

  it('says so when the palette had no room at all', async () => {
    render(
      <ExtractedColors
        colors={SIX}
        activeHex="#ff0000"
        onPick={() => {}}
        onAdd={() => ({ added: 0, total: 6 })}
      />,
    );
    await userEvent.click(screen.getByText('Add top 4 to palette'));
    expect(screen.getByText('Palette is full: remove a color first')).toBeTruthy();
  });

  it('keeps the plain wording for four colors or fewer', async () => {
    render(
      <ExtractedColors
        colors={SIX.slice(0, 4)}
        activeHex="#ff0000"
        onPick={() => {}}
        onAdd={() => ({ added: 4, total: 4 })}
      />,
    );
    expect(screen.getByText('Add all to palette')).toBeTruthy();
    await userEvent.click(screen.getByText('Add all to palette'));
    expect(screen.getByText('Added to palette ✓')).toBeTruthy();
  });
});

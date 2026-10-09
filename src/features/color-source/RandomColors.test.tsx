import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RandomColors from './RandomColors';
import { randomSwatches } from './random-colors';

afterEach(() => vi.restoreAllMocks());

const swatches = () =>
  [...document.querySelectorAll<HTMLElement>('.source__random .swatches__item')].map(
    (el) => el.dataset.hex!,
  );

describe('RandomColors', () => {
  it('shows six random colors to choose from', () => {
    render(<RandomColors onPick={() => {}} />);
    expect(swatches()).toHaveLength(6);
    expect(new Set(swatches()).size).toBe(6);
    expect(screen.getByText('Or start from a color')).toBeTruthy();
  });

  it('picks a color when it is tapped', async () => {
    const onPick = vi.fn();
    render(<RandomColors onPick={onPick} />);
    const [first, , third] = swatches();
    await userEvent.click(screen.getByTitle(`Use ${third}`));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(third);
    await userEvent.click(screen.getByTitle(`Use ${first}`));
    expect(onPick).toHaveBeenLastCalledWith(first);
  });

  it('keeps the same colors when the parent re-renders', () => {
    const { rerender } = render(<RandomColors onPick={() => {}} activeHex="#111111" />);
    const before = swatches();
    rerender(<RandomColors onPick={() => {}} activeHex="#222222" />);
    expect(swatches()).toEqual(before);
  });

  it('marks exactly the color that is currently chosen', () => {
    // a constant random source gives a known set, so the chosen swatch can be named
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const known = randomSwatches(6, () => 0.5);
    render(<RandomColors onPick={() => {}} activeHex={known[2]} />);
    expect(swatches()).toEqual(known);
    const active = [
      ...document.querySelectorAll<HTMLElement>('.source__random .swatches__item--active'),
    ];
    expect(active.map((el) => el.dataset.hex)).toEqual([known[2]]);
  });

  it('marks nothing when the chosen color is not one of the random ones', () => {
    render(<RandomColors onPick={() => {}} activeHex="#3366cc" />);
    expect(document.querySelectorAll('.source__random .swatches__item--active')).toHaveLength(0);
  });

  it('draws a new set when Shuffle is pressed, without picking anything', async () => {
    const onPick = vi.fn();
    render(<RandomColors onPick={onPick} />);
    const before = swatches();
    await userEvent.click(screen.getByRole('button', { name: 'Shuffle random colors' }));
    const after = swatches();
    expect(after).toHaveLength(6);
    expect(after).not.toEqual(before);
    expect(onPick).not.toHaveBeenCalled();
  });

  it('each Shuffle gives a new set, and the old swatches no longer exist', async () => {
    render(<RandomColors onPick={() => {}} />);
    const seen = new Set([swatches().join()]);
    for (let i = 0; i < 3; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: 'Shuffle random colors' }));
      seen.add(swatches().join());
    }
    expect(seen.size).toBe(4);
  });

  it('exposes itself as a labeled region', () => {
    render(<RandomColors onPick={() => {}} />);
    expect(screen.getByRole('region', { name: 'Random colors' })).toBeTruthy();
  });
});

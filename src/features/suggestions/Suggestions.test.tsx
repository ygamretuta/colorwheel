import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { HarmonyId } from '@/features/harmony/harmony';

import { suggestPairings } from './suggest';
import Suggestions from './Suggestions';

const HEX = '#3366cc';
const HARMONY = 'square';
const setOf = (index: number, harmony: HarmonyId = HARMONY) => [
  HEX,
  ...suggestPairings(HEX, harmony)[index].colors,
];

describe('Suggestions', () => {
  it('re-renders pairings from the selected wheel type', () => {
    const { container, rerender } = render(
      <Suggestions hex={HEX} harmony="complementary" chosen={[]} onChoose={() => {}} />,
    );
    const read = () =>
      [...container.querySelectorAll<HTMLElement>('[data-suggestion]')].map(
        (el) => el.dataset.suggestion,
      );
    expect(read()).toEqual(['best-match', 'balanced-pair']);
    const before = container.innerHTML;
    rerender(<Suggestions hex={HEX} harmony="square" chosen={[]} onChoose={() => {}} />);
    expect(read()).toEqual(['best-match', 'balanced-pair', 'full-scheme']);
    expect(container.innerHTML).not.toBe(before);
  });

  it('renders three suggestion cards for a wheel type with three or more partners', () => {
    const { container } = render(
      <Suggestions hex={HEX} harmony={HARMONY} chosen={[]} onChoose={() => {}} />,
    );
    expect(container.querySelectorAll<HTMLElement>('[data-suggestion]')).toHaveLength(3);
  });

  it('chooses a pairing from the button, once', async () => {
    const onChoose = vi.fn();
    render(<Suggestions hex={HEX} harmony={HARMONY} chosen={[]} onChoose={onChoose} />);
    await userEvent.click(screen.getAllByText('Choose')[0]);
    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledWith(setOf(0));
  });

  it('chooses a pairing from the whole tile, once', async () => {
    const onChoose = vi.fn();
    const { container } = render(
      <Suggestions hex={HEX} harmony={HARMONY} chosen={[]} onChoose={onChoose} />,
    );
    await userEvent.click(
      container.querySelector<HTMLElement>('[data-suggestion="balanced-pair"] p')!,
    );
    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledWith(setOf(1));
  });

  it('marks only the chosen pairing', () => {
    const { container } = render(
      <Suggestions hex={HEX} harmony={HARMONY} chosen={setOf(1)} onChoose={() => {}} />,
    );
    const picked = [...container.querySelectorAll<HTMLElement>('.suggestions__item--picked')];
    expect(picked).toHaveLength(1);
    expect(picked[0].dataset.suggestion).toBe('balanced-pair');
    expect(screen.getAllByText('Choose')).toHaveLength(2);
  });

  it('renders swatches as non-interactive chips', () => {
    const { container } = render(
      <Suggestions hex={HEX} harmony={HARMONY} chosen={[]} onChoose={() => {}} />,
    );
    expect(container.querySelectorAll<HTMLElement>('.swatches__item[aria-pressed]')).toHaveLength(
      0,
    );
    expect(container.querySelectorAll<HTMLElement>('.swatches button')).toHaveLength(0);
  });
});

describe('Suggestions are never disabled', () => {
  it('every pairing can be chosen, whatever the palette holds', async () => {
    const onChoose = vi.fn();
    const { container } = render(
      <Suggestions hex={HEX} harmony="square" chosen={[]} onChoose={onChoose} />,
    );
    const buttons = screen.getAllByText('Choose');
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => expect(button.closest('button')!.disabled).toBe(false));
    expect(container.querySelectorAll<HTMLElement>('.suggestions__item--blocked')).toHaveLength(0);
    expect(screen.queryByText('No room')).toBeNull();
    expect(screen.queryByText(/Your palette is full/)).toBeNull();

    await userEvent.click(buttons[2]);
    expect(onChoose).toHaveBeenCalledWith(setOf(2));
  });

  it('the whole tile stays clickable', async () => {
    const onChoose = vi.fn();
    const { container } = render(
      <Suggestions hex={HEX} harmony="square" chosen={[]} onChoose={onChoose} />,
    );
    await userEvent.click(
      container.querySelector<HTMLElement>('[data-suggestion="balanced-pair"] p')!,
    );
    expect(onChoose).toHaveBeenCalledWith(setOf(1));
  });

  it('the chosen pairing can be cleared', async () => {
    const onChoose = vi.fn();
    render(<Suggestions hex={HEX} harmony="square" chosen={setOf(0)} onChoose={onChoose} />);
    await userEvent.click(screen.getByText('✓ Chosen'));
    expect(onChoose).toHaveBeenCalledWith(setOf(0));
  });
});

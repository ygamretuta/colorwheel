import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import RuleHeader from './RuleHeader';

const setup = (isShuffled: boolean, isComparing = false) => {
  const onShuffle = vi.fn();
  const onReset = vi.fn();
  const onToggleCompare = vi.fn();
  render(
    <RuleHeader
      title="The title"
      ruleName="test rule"
      isShuffled={isShuffled}
      isComparing={isComparing}
      onShuffle={onShuffle}
      onToggleCompare={onToggleCompare}
      onReset={onReset}
    />,
  );
  return { onShuffle, onReset, onToggleCompare };
};

describe('RuleHeader', () => {
  it('shows the title and a Shuffle button named after the rule', () => {
    setup(false);
    expect(screen.getByRole('heading', { name: 'The title' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Shuffle the colors in the test rule' }),
    ).toBeTruthy();
  });

  it('hides Suggested until the colors are shuffled', () => {
    setup(false);
    expect(screen.queryByRole('button', { name: /suggested colors/ })).toBeNull();
  });

  it('calls onShuffle when Shuffle is pressed', async () => {
    const { onShuffle } = setup(false);
    await userEvent.click(screen.getByRole('button', { name: /Shuffle/ }));
    expect(onShuffle).toHaveBeenCalledTimes(1);
  });

  it('offers Suggested once shuffled, and calls onReset', async () => {
    const { onReset } = setup(true);
    await userEvent.click(
      screen.getByRole('button', { name: 'Back to the suggested colors for the test rule' }),
    );
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('hides Compare until the colors are shuffled', () => {
    setup(false);
    expect(screen.queryByRole('button', { name: /^Compare/ })).toBeNull();
  });

  it('offers Compare once shuffled, and calls onToggleCompare', async () => {
    const { onToggleCompare } = setup(true);
    await userEvent.click(screen.getByRole('button', { name: /^Compare/ }));
    expect(onToggleCompare).toHaveBeenCalledTimes(1);
  });

  it('shows whether Compare is on', () => {
    setup(true, true);
    expect(screen.getByRole('button', { name: /^Compare/ }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});

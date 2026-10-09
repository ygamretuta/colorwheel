import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StepHeader, StepNav } from './Stepper.jsx';
import { STEPS } from './steps.js';

describe('StepHeader', () => {
  it('shows progress and the current title', () => {
    render(<StepHeader index={1} />);
    expect(screen.getByText(`Step 2 of ${STEPS.length}`)).toBeTruthy();
    expect(screen.getByRole('heading', { name: STEPS[1].title })).toBeTruthy();
  });
});

describe('StepNav', () => {
  it('disables Back on the first step and calls Next', async () => {
    const onNext = vi.fn();
    render(<StepNav index={0} onBack={() => {}} onNext={onNext} />);
    expect(screen.getByText('Back').closest('button').disabled).toBe(true);
    await userEvent.click(screen.getByText(`Next: ${STEPS[1].title}`));
    expect(onNext).toHaveBeenCalled();
  });

  it('offers Start over instead of Next on the last step', async () => {
    const onRestart = vi.fn();
    const onNext = vi.fn();
    render(<StepNav index={STEPS.length - 1} onBack={() => {}} onNext={onNext} onRestart={onRestart} />);
    expect(screen.queryByText(/^Next:/)).toBeNull();
    await userEvent.click(screen.getByText('Start over'));
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('never offers Skip to palette (that shortcut was removed)', () => {
    [0, 1, 2].forEach((index) => {
      const { unmount } = render(<StepNav index={index} onBack={() => {}} onNext={() => {}} onRestart={() => {}} />);
      expect(screen.queryByText('Skip to palette')).toBeNull();
      unmount();
    });
  });

  it('keeps Back in its slot on step 1, hidden because there is nothing to go back to', () => {
    render(<StepNav index={0} onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText('Back').closest('button').disabled).toBe(true);
  });
});

describe('StepHeader reset', () => {
  afterEach(() => vi.useRealTimers());

  it('has no Reset button unless onReset is given', () => {
    render(<StepHeader index={0} />);
    expect(screen.queryByRole('button', { name: /reset/i })).toBeNull();
  });

  it('asks for confirmation on the first tap and resets on the second', async () => {
    const onReset = vi.fn();
    render(<StepHeader index={1} onReset={onReset} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset and start over' }));
    expect(onReset).not.toHaveBeenCalled();
    expect(screen.getByText('Confirm')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm reset' }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Reset')).toBeTruthy();
  });

  it('disarms after a few seconds without a second tap', () => {
    vi.useFakeTimers();
    const onReset = vi.fn();
    render(<StepHeader index={0} onReset={onReset} />);

    act(() => screen.getByText('Reset').click());
    expect(screen.getByText('Confirm')).toBeTruthy();
    act(() => vi.advanceTimersByTime(3100));
    expect(screen.getByText('Reset')).toBeTruthy();

    act(() => screen.getByText('Reset').click()); // needs a fresh confirmation
    expect(onReset).not.toHaveBeenCalled();
  });

  it('does not carry an armed state over to another step', async () => {
    const { rerender } = render(<StepHeader index={0} onReset={() => {}} />);
    await userEvent.click(screen.getByText('Reset'));
    expect(screen.getByText('Confirm')).toBeTruthy();
    rerender(<StepHeader index={1} onReset={() => {}} />);
    expect(screen.getByText('Reset')).toBeTruthy();
  });
});


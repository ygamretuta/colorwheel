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

describe('StepHeader progress bar', () => {
  const jumps = () => [...document.querySelectorAll('.stepper__jump')];

  it('is display-only without onGoTo', () => {
    render(<StepHeader index={1} />);
    expect(jumps()).toHaveLength(0);
    expect(document.querySelectorAll('.stepper__segment')).toHaveLength(STEPS.length);
  });

  it('has one button per step, named after it', () => {
    render(<StepHeader index={0} furthest={2} onGoTo={() => {}} />);
    expect(jumps()).toHaveLength(STEPS.length);
    STEPS.forEach((step, i) => expect(screen.getByRole('button', { name: `Step ${i + 1}: ${step.title}` })).toBeTruthy());
  });

  it('marks the current step with aria-current', () => {
    render(<StepHeader index={1} furthest={2} onGoTo={() => {}} />);
    const current = jumps().filter((button) => button.getAttribute('aria-current') === 'step');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute('aria-label')).toBe(`Step 2: ${STEPS[1].title}`);
  });

  it('jumps to a reached step when its segment is clicked', async () => {
    const onGoTo = vi.fn();
    render(<StepHeader index={2} furthest={2} onGoTo={onGoTo} />);
    await userEvent.click(screen.getByRole('button', { name: `Step 1: ${STEPS[0].title}` }));
    expect(onGoTo).toHaveBeenCalledWith(0);
    await userEvent.click(screen.getByRole('button', { name: `Step 2: ${STEPS[1].title}` }));
    expect(onGoTo).toHaveBeenLastCalledWith(1);
  });

  it('can jump forward again to a step reached earlier', async () => {
    const onGoTo = vi.fn();
    render(<StepHeader index={0} furthest={2} onGoTo={onGoTo} />);
    await userEvent.click(screen.getByRole('button', { name: `Step 3: ${STEPS[2].title}` }));
    expect(onGoTo).toHaveBeenCalledWith(2);
  });

  it('locks steps that have not been reached, and ignores clicks on them', async () => {
    const onGoTo = vi.fn();
    render(<StepHeader index={0} furthest={0} onGoTo={onGoTo} />);
    const [, second, third] = jumps();
    expect(second.disabled).toBe(true);
    expect(third.disabled).toBe(true);
    expect(second.title).toMatch(/not reached yet/);
    await userEvent.click(second);
    expect(onGoTo).not.toHaveBeenCalled();
  });

  it('does nothing when the current step is clicked', async () => {
    const onGoTo = vi.fn();
    render(<StepHeader index={1} furthest={2} onGoTo={onGoTo} />);
    await userEvent.click(screen.getByRole('button', { name: `Step 2: ${STEPS[1].title}` }));
    expect(onGoTo).not.toHaveBeenCalled();
  });

  it('shades reached steps differently from locked ones and the current progress', () => {
    render(<StepHeader index={0} furthest={1} onGoTo={() => {}} />);
    const [first, second, third] = [...document.querySelectorAll('.stepper__segment')];
    expect(first.className).toContain('stepper__segment--done');
    expect(second.className).toContain('stepper__segment--visited');
    expect(third.className).not.toMatch(/--(done|visited)/);
  });
});

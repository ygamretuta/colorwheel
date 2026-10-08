import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

  it('offers Skip to palette in the Back slot on step 1 only when allowed', async () => {
    const onSkip = vi.fn();
    const { rerender } = render(<StepNav index={0} onBack={() => {}} onNext={() => {}} canSkip={false} onSkip={onSkip} />);
    expect(screen.queryByText('Skip to palette')).toBeNull();

    rerender(<StepNav index={0} onBack={() => {}} onNext={() => {}} canSkip onSkip={onSkip} />);
    await userEvent.click(screen.getByText('Skip to palette'));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Back')).toBeNull();

    rerender(<StepNav index={1} onBack={() => {}} onNext={() => {}} canSkip onSkip={onSkip} />);
    expect(screen.queryByText('Skip to palette')).toBeNull();
    expect(screen.getByText('Back')).toBeTruthy();
  });
});


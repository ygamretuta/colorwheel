import { useEffect, useState } from 'react';
import './stepper.css';
import { Button } from '@/shared/ui/button';
import { STEPS, canVisit } from './steps';

const CONFIRM_WINDOW_MS = 3000;

interface ResetButtonProps {
  onReset: () => void;
}

/**
 * Two-tap reset: the first tap asks for confirmation, the second resets. Disarms itself after a few
 * seconds.
 */
function ResetButton({ onReset }: ResetButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      className={`stepper__reset${armed ? ' stepper__reset--armed' : ''}`}
      variant="ghost"
      size="sm"
      aria-label={armed ? 'Confirm reset' : 'Reset and start over'}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        setArmed(false);
        onReset();
      }}
    >
      {armed ? 'Confirm' : 'Reset'}
    </Button>
  );
}

interface StepHeaderProps {
  index: number;
  furthest?: number;
  onGoTo?: (index: number) => void;
  onReset?: () => void;
}

/**
 * Progress header for the current step. `onReset`, when given, adds a two-tap Reset button. With
 * `onGoTo`, each segment of the progress bar becomes a button that jumps to that step; steps beyond
 * `furthest` (the furthest step reached so far) stay locked.
 */
export function StepHeader({ index, furthest = index, onGoTo, onReset }: StepHeaderProps) {
  const { title, hint } = STEPS[index];
  return (
    <header className="stepper__header">
      <div className="stepper__row">
        <h2 className="stepper__title">{title}</h2>
        {onReset && <ResetButton key={index} onReset={onReset} />}
        <p className="stepper__count">
          Step {index + 1} of {STEPS.length}
        </p>
      </div>
      <ol className="stepper__bar" aria-label="Steps">
        {STEPS.map((step, i) => {
          const state =
            i <= index
              ? 'stepper__segment--done'
              : canVisit(i, furthest)
                ? 'stepper__segment--visited'
                : '';
          return (
            <li key={step.id} className={`stepper__segment ${state}`.trim()}>
              {onGoTo ? (
                <button
                  type="button"
                  className="stepper__jump"
                  aria-label={`Step ${i + 1}: ${step.title}`}
                  aria-current={i === index ? 'step' : undefined}
                  title={canVisit(i, furthest) ? step.title : `${step.title} (not reached yet)`}
                  disabled={!canVisit(i, furthest)}
                  onClick={() => i !== index && onGoTo(i)}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="stepper__hint">{hint}</p>
    </header>
  );
}

interface StepNavProps {
  index: number;
  onBack: () => void;
  onNext: () => void;
  onRestart?: () => void;
}

/**
 * Back / Next controls (Start over on the last step), pinned to the bottom of the screen on phones.
 */
export function StepNav({ index, onBack, onNext, onRestart }: StepNavProps) {
  const last = index === STEPS.length - 1;
  return (
    <nav className="stepper__nav" aria-label="Steps">
      <Button className="stepper__button" variant="outline" onClick={onBack} disabled={index === 0}>
        Back
      </Button>
      {last ? (
        <Button className="stepper__button" onClick={onRestart}>
          Start over
        </Button>
      ) : (
        <Button
          className="stepper__button"
          onClick={onNext}
        >{`Next: ${STEPS[index + 1].title}`}</Button>
      )}
    </nav>
  );
}

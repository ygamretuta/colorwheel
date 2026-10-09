import { useEffect, useState } from 'react';
import './stepper.css';
import { Button } from '@/shared/ui/button.jsx';
import { STEPS } from './steps.js';

const CONFIRM_WINDOW_MS = 3000;

/** Two-tap reset: the first tap asks for confirmation, the second resets. Disarms itself after a few seconds. */
function ResetButton({ onReset }) {
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

/** Progress header for the current step. `onReset`, when given, adds a two-tap Reset button. */
export function StepHeader({ index, onReset }) {
  const { title, hint } = STEPS[index];
  return (
    <header className="stepper__header">
      <div className="stepper__row">
        <h2 className="stepper__title">{title}</h2>
        {onReset && <ResetButton key={index} onReset={onReset} />}
        <p className="stepper__count">Step {index + 1} of {STEPS.length}</p>
      </div>
      <ol className="stepper__bar" aria-hidden="true">
        {STEPS.map((step, i) => (
          <li key={step.id} className={`stepper__segment${i <= index ? ' stepper__segment--done' : ''}`} />
        ))}
      </ol>
      <p className="stepper__hint">{hint}</p>
    </header>
  );
}

/** Back / Next controls (Start over on the last step), pinned to the bottom of the screen on phones. */
export function StepNav({ index, onBack, onNext, onRestart }) {
  const last = index === STEPS.length - 1;
  return (
    <nav className="stepper__nav" aria-label="Steps">
      <Button className="stepper__button" variant="outline" onClick={onBack} disabled={index === 0}>Back</Button>
      {last ? (
        <Button className="stepper__button" onClick={onRestart}>Start over</Button>
      ) : (
        <Button className="stepper__button" onClick={onNext}>{`Next: ${STEPS[index + 1].title}`}</Button>
      )}
    </nav>
  );
}

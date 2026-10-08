import './stepper.css';
import { Button } from '@/shared/ui/button.jsx';
import { STEPS } from './steps.js';

/** Progress header for the current step. */
export function StepHeader({ index }) {
  const { title, hint } = STEPS[index];
  return (
    <header className="stepper__header">
      <div className="stepper__row">
        <h2 className="stepper__title">{title}</h2>
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

/** Back / Next controls (Start over on the last step; Skip to palette on step 1 once colors are chosen), pinned to the bottom of the screen on phones. */
export function StepNav({ index, onBack, onNext, onRestart, canSkip = false, onSkip }) {
  const last = index === STEPS.length - 1;
  // On the first step there is no Back, so its slot offers a shortcut to the finished palette.
  const showSkip = index === 0 && canSkip;
  return (
    <nav className="stepper__nav" aria-label="Steps">
      {showSkip ? (
        <Button className="stepper__button" variant="outline" onClick={onSkip}>Skip to palette</Button>
      ) : (
        <Button className="stepper__button" variant="outline" onClick={onBack} disabled={index === 0}>Back</Button>
      )}
      {last ? (
        <Button className="stepper__button" onClick={onRestart}>Start over</Button>
      ) : (
        <Button className="stepper__button" onClick={onNext}>{`Next: ${STEPS[index + 1].title}`}</Button>
      )}
    </nav>
  );
}

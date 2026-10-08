import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PickColorsStep from './PickColorsStep.jsx';

const scrolled = [];

beforeEach(() => {
  scrolled.length = 0;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb());
  Element.prototype.scrollIntoView = function scrollIntoView() {
    scrolled.push(this.className);
  };
});

const renderStep = (props = {}) =>
  render(
    <PickColorsStep
      hex="#3366cc"
      harmony="square"
      onHarmonyChange={() => {}}
      picks={[]}
      pairing={[]}
      onTogglePick={() => {}}
      onChoosePairing={() => {}}
      {...props}
    />,
  );

describe('PickColorsStep scrolling', () => {
  it('scrolls down to the pairings after a swatch is tapped', async () => {
    const onTogglePick = vi.fn();
    renderStep({ onTogglePick });
    await userEvent.click(screen.getAllByTitle(/^Add #/)[0]);
    expect(onTogglePick).toHaveBeenCalled();
    expect(scrolled).toEqual(['pick-colors__pairings']);
  });

  it('scrolls to the end of the step after a pairing is chosen', async () => {
    const onChoosePairing = vi.fn();
    renderStep({ onChoosePairing });
    await userEvent.click(screen.getAllByText('Choose')[0]);
    expect(onChoosePairing).toHaveBeenCalled();
    expect(scrolled).toEqual(['pick-colors__end']);
  });
});

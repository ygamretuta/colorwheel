import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PickColorsStep from './PickColorsStep';

const scrolled: string[] = [];

beforeEach(() => {
  scrolled.length = 0;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
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
      pairing={[]}
      palette={[]}
      onTogglePick={() => {}}
      onChoosePairing={() => {}}
      onRemoveColor={() => {}}
      {...props}
    />,
  );

describe('PickColorsStep scrolling', () => {
  it('scrolls down to the pairings after a swatch is tapped', async () => {
    const onTogglePick = vi.fn();
    renderStep({ onTogglePick });
    await userEvent.click(screen.getAllByTitle<HTMLButtonElement>(/^Add #/)[0]);
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

describe('PickColorsStep palette stack', () => {
  const fromImage = ['#a8dadc', '#1d3557', '#f1faee'];
  const stack = () =>
    [...document.querySelectorAll<HTMLElement>('.stack__segment[data-hex]')].map(
      (el) => el.dataset.hex,
    );

  it('previews every color in the palette, in order, including colors the wheel does not show', () => {
    renderStep({ palette: fromImage });
    expect(stack()).toEqual(fromImage);
    expect(screen.getByText('3 of 4 colors in your palette')).toBeTruthy();
  });

  it('includes the colors that are also on the wheel swatches', () => {
    renderStep({ harmony: 'complementary', palette: ['#3366cc', '#cc9933', '#a8dadc'] });
    expect(stack()).toEqual(['#3366cc', '#cc9933', '#a8dadc']);
  });

  it('is shown even when the palette is empty, with a hint', () => {
    renderStep({ palette: [] });
    expect(document.querySelector<HTMLElement>('.stack__bar')).toBeTruthy();
    expect(screen.getByText('0 of 4 colors in your palette')).toBeTruthy();
    expect(screen.getByText(/Pick colors above, or choose a pairing below/)).toBeTruthy();
  });

  it('removes a color through onRemoveColor when its segment is tapped', async () => {
    const onRemoveColor = vi.fn();
    renderStep({ palette: fromImage, onRemoveColor });
    await userEvent.click(screen.getByTitle<HTMLButtonElement>('Remove #a8dadc from your palette'));
    expect(onRemoveColor).toHaveBeenCalledWith('#a8dadc');
  });

  it('still shows the colors the wheel lacks as small dots on the wheel', () => {
    renderStep({ harmony: 'complementary', palette: ['#3366cc', '#a8dadc'] });
    expect(screen.getByText(/Small dots on the wheel are your other colors/)).toBeTruthy();
  });
});

describe('PickColorsStep palette limit', () => {
  const four = ['#3366cc', '#cc9933', '#a8dadc', '#1d3557'];

  it('shows how full the palette is', () => {
    renderStep({ harmony: 'complementary', palette: ['#3366cc'] });
    expect(screen.getByText(/1 of 4 colors in your palette/)).toBeTruthy();
    expect(screen.getByText(/Tap a color to add it/)).toBeTruthy();
  });

  it('dims the wheel swatches that cannot be added once the palette is full', () => {
    renderStep({ harmony: 'complementary', palette: ['#3366cc', '#a8dadc', '#1d3557', '#f1faee'] });
    expect(screen.getByText(/4 of 4 colors in your palette/)).toBeTruthy();
    expect(screen.getByText(/Full: tap a ✓ color to swap it out/)).toBeTruthy();
    expect(
      screen.getByTitle<HTMLButtonElement>(/Palette is full: remove a color to add #cc9933/)
        .disabled,
    ).toBe(true); // not in the palette
    // in the palette, so it can be removed
    expect(screen.getByTitle<HTMLButtonElement>('Remove #3366cc').disabled).toBe(false);
  });

  it('leaves everything tappable while there is room', () => {
    renderStep({ harmony: 'complementary', palette: ['#3366cc'] });
    expect(screen.getByTitle<HTMLButtonElement>('Add #cc9933').disabled).toBe(false);
  });

  it('does not lock a wheel color that is already in the palette', () => {
    renderStep({ harmony: 'complementary', palette: four });
    expect(screen.getByTitle<HTMLButtonElement>('Remove #cc9933').disabled).toBe(false);
  });

  it('never disables a pairing, even when the palette is full', () => {
    renderStep({ harmony: 'square', palette: four });
    expect(screen.queryByText('No room')).toBeNull();
    screen
      .getAllByText('Choose')
      .forEach((button) => expect(button.closest('button')!.disabled).toBe(false));
  });
});

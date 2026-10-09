import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  // jsdom has no canvas; the wheel and image sampler only need a null context.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
});

/** The colors in step 2's stacked palette preview, in order. */
const stackColors = () => [...document.querySelectorAll<HTMLElement>('.stack__segment[data-hex]')].map((el) => el.dataset.hex);

describe('App flow', () => {
  it('restarts from the last step with an empty palette and default color', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getAllByText('Choose')[0]);
    await userEvent.click(screen.getByText(/^Next: Your palette/));
    expect(document.querySelectorAll<HTMLElement>('.palette .swatches__item').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByText('Start over'));
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('Hex value').value).toBe('#3366cc');
  });

  it('selects the wheel colors on arrival when nothing is chosen', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    const swatches = document.querySelectorAll<HTMLElement>('.harmony .swatches__item');
    expect(swatches.length).toBeGreaterThan(1);
    swatches.forEach((swatch) => expect(swatch.getAttribute('aria-pressed')).toBe('true'));
  });

  it('keeps manual choices instead of re-selecting the wheel', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getAllByTitle<HTMLButtonElement>(/^Remove #/)[1]); // user drops the second color
    await userEvent.click(screen.getByText('Back'));
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    const pressed = [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')].map((s) => s.getAttribute('aria-pressed'));
    expect(pressed).toEqual(['true', 'false']);
  });

  it('updates the document title for each step', async () => {
    render(<App />);
    expect(document.title).toBe('Get a color · Color Wheel');
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    expect(document.title).toBe('Pick your colors · Color Wheel');
  });

  it('keeps the typed color when returning to step 1', async () => {
    render(<App />);
    const field = screen.getByLabelText<HTMLInputElement>('Hex value');
    await userEvent.clear(field);
    await userEvent.type(field, '#e91e63');
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getByText('Back'));
    expect(screen.getByLabelText<HTMLInputElement>('Hex value').value).toBe('#e91e63');
  });
});

describe('unchecking a color on the wheel swatches', () => {
  const wheelSwatch = (index: number) => [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')][index];
  const isChecked = (el: HTMLElement) => el.getAttribute('aria-pressed') === 'true';
  const goToStep2 = () => userEvent.click(screen.getByText(/^Next: Pick your colors/));
  const finalPalette = async () => {
    await userEvent.click(screen.getByText(/^Next: Your palette/));
    return [...document.querySelectorAll<HTMLElement>('.palette .swatches__item')].map((el) => el.dataset.hex);
  };

  it('removes the color from the final palette', async () => {
    render(<App />);
    await goToStep2(); // both wheel colors are selected for you
    const [base, partner] = [wheelSwatch(0).dataset.hex, wheelSwatch(1).dataset.hex];

    await userEvent.click(wheelSwatch(0)); // uncheck the base
    expect(isChecked(wheelSwatch(0))).toBe(false);

    const palette = await finalPalette();
    expect(palette).toEqual([partner]);
    expect(palette).not.toContain(base);
  });

  it('removes a color that is also part of the chosen pairing', async () => {
    render(<App />);
    await goToStep2();
    const base = wheelSwatch(0).dataset.hex;
    await userEvent.click(screen.getAllByText('Choose')[0]); // the pairing contains the base

    expect(isChecked(wheelSwatch(0))).toBe(true); // the checkmark follows the real palette, pairing included
    await userEvent.click(wheelSwatch(0)); // uncheck it

    expect(isChecked(wheelSwatch(0))).toBe(false);
    expect(document.querySelectorAll<HTMLElement>('.suggestions__item--picked')).toHaveLength(0); // the pairing no longer stands
    const palette = await finalPalette();
    expect(palette).not.toContain(base);
    expect(palette.length).toBeGreaterThan(0); // the pairing's other color stays
  });

  it('removes a color that was picked by hand and is also in the pairing', async () => {
    render(<App />);
    await goToStep2();
    const base = wheelSwatch(0).dataset.hex;
    await userEvent.click(wheelSwatch(0)); // uncheck the base...
    await userEvent.click(wheelSwatch(0)); // ...and pick it by hand
    await userEvent.click(screen.getAllByText('Choose')[0]); // pairing also contains the base
    await userEvent.click(wheelSwatch(0)); // uncheck once

    const palette = await finalPalette();
    expect(palette).not.toContain(base);
  });

  it('shows the checkmark for every color that is really in the palette', async () => {
    render(<App />);
    await goToStep2();
    await userEvent.click(screen.getAllByText('Choose')[1]); // "Match + shade": base plus two colors
    const checked = [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')].filter(isChecked).map((el) => el.dataset.hex);
    const inPairing = [...document.querySelectorAll<HTMLElement>('.suggestions__item--picked .swatches__item')].map((el) => el.dataset.hex);
    checked.forEach((hex) => expect(inPairing).toContain(hex));
    expect(checked).toContain(wheelSwatch(0).dataset.hex);
  });

  it('keeps the palette as chosen when you leave step 2 and come back', async () => {
    render(<App />);
    await goToStep2();
    await userEvent.click(screen.getAllByText('Choose')[0]);
    const chosen = await finalPalette(); // goes to step 3...
    await userEvent.click(screen.getByText('Back')); // ...and back to step 2

    expect(screen.getByText(/of 4 colors in your palette/).textContent).toContain(`${chosen.length} of 4`);
    expect(await finalPalette()).toEqual(chosen); // nothing was added behind your back
  });

  it('never lets the wheel colors pile onto a chosen pairing', async () => {
    render(<App />);
    await goToStep2();
    await userEvent.click(screen.getAllByText('Choose')[0]);
    for (let visit = 0; visit < 3; visit += 1) {
      await userEvent.click(screen.getByText(/^Next: Your palette/));
      await userEvent.click(screen.getByText('Back'));
    }
    const palette = await finalPalette();
    expect(palette.length).toBeLessThanOrEqual(4);
    expect(palette).toHaveLength(2); // base + the pairing's partner, exactly as chosen
  });

  it('lets the color be added back', async () => {
    render(<App />);
    await goToStep2();
    const base = wheelSwatch(0).dataset.hex;
    await userEvent.click(wheelSwatch(0));
    await userEvent.click(wheelSwatch(0));
    expect(isChecked(wheelSwatch(0))).toBe(true);
    expect(await finalPalette()).toContain(base);
  });
});

describe('choosing a suggested pairing on step 2', () => {
  const FOUR: [string, number][] = [['#cc3333', 40], ['#33cc33', 30], ['#3333cc', 20], ['#cccc33', 10]];
  const toStep2 = () => userEvent.click(screen.getByText(/^Next: Pick your colors/));
  const wheel = () => [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')];
  const inPalette = stackColors;
  const chip = (id: string) => [...document.querySelectorAll<HTMLElement>(`[data-suggestion="${id}"] .swatches__item`)].map((el) => el.dataset.hex);
  const cards = () => [...document.querySelectorAll<HTMLElement>('[data-suggestion]')].map((el) => `${el.dataset.suggestion}:${chip(el.dataset.suggestion!).join(',')}`);
  const finalPalette = async () => {
    await userEvent.click(screen.getByText(/^Next: Your palette/));
    return [...document.querySelectorAll<HTMLElement>('.palette .swatches__item')].map((el) => el.dataset.hex);
  };

  const imageWithFourColors = async () => {
    globalThis.createImageBitmap = vi.fn(async () => ({ width: 100, height: 1, close() {} })) as unknown as typeof createImageBitmap;
    const pixels = FOUR.flatMap(([hex, n]) => {
      const v = parseInt(hex.slice(1), 16);
      return Array.from({ length: n }, () => [(v >> 16) & 255, (v >> 8) & 255, v & 255, 255]).flat();
    });
    const context = new Proxy({}, { get: (_t, name) => (name === 'getImageData' ? () => ({ data: new Uint8ClampedArray(pixels), width: 100, height: 1 }) : () => {}), set: () => true });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    render(<App />);
    const event = new Event('paste');
    Object.defineProperty(event, 'clipboardData', { value: { items: [{ type: 'image/png', getAsFile: () => new Blob(['x'], { type: 'image/png' }) }] } });
    await act(async () => { document.dispatchEvent(event); });
    await screen.findByText('Colors in this image');
    await userEvent.click(screen.getByText('Add all to palette')); // palette is now the four image colors
  };

  it('resets the final palette to exactly the colors of the suggestion', async () => {
    await imageWithFourColors();
    await toStep2();
    expect(screen.getByText(/4 of 4 colors in your palette/)).toBeTruthy();

    const suggested = chip('best-match');
    await userEvent.click(screen.getAllByText('Choose')[0]);

    const palette = await finalPalette();
    expect(palette).toEqual(suggested);
    ['#33cc33', '#3333cc', '#cccc33'].forEach((imageColor) => expect(palette).not.toContain(imageColor));
  });

  it('works while the palette is full: no pairing is disabled', async () => {
    await imageWithFourColors();
    await toStep2();
    expect(screen.getByText(/4 of 4 colors in your palette/)).toBeTruthy();
    expect(screen.queryByText('No room')).toBeNull();
    screen.getAllByText('Choose').forEach((button) => expect(button.closest('button')!.disabled).toBe(false));
    expect(screen.queryByText(/Your palette is full/)).toBeNull();
  });

  it('shows the pairing as the palette on step 2: counter, checkmarks and the stack', async () => {
    await imageWithFourColors();
    await toStep2();
    const suggested = chip('balanced-pair');
    await userEvent.click(screen.getAllByText('Choose')[1]);

    expect(screen.getByText(new RegExp(`${suggested.length} of 4 colors in your palette`))).toBeTruthy();
    expect(inPalette().sort()).toEqual([...suggested].sort());
    expect(document.querySelectorAll<HTMLElement>('.swatches__item--locked')).toHaveLength(0); // there is room again
  });

  it('keeps the suggestions as they were, with the chosen one still marked', async () => {
    await imageWithFourColors();
    await toStep2();
    const before = cards();
    await userEvent.click(screen.getAllByText('Choose')[0]);

    expect(cards()).toEqual(before);
    const picked = document.querySelectorAll<HTMLElement>('.suggestions__item--picked');
    expect(picked).toHaveLength(1);
    expect(picked[0].dataset.suggestion).toBe('best-match');
  });

  it('choosing another pairing replaces the first', async () => {
    await imageWithFourColors();
    await toStep2();
    await userEvent.click(screen.getAllByText('Choose')[0]);
    const second = chip('balanced-pair');
    await userEvent.click(screen.getAllByText('Choose')[0]); // the first row is now "Chosen"; the next "Choose" is row two
    expect(inPalette().sort()).toEqual([...second].sort());
  });

  it('clearing the pairing brings the earlier picks back', async () => {
    await imageWithFourColors();
    await toStep2();
    const before = inPalette().sort();
    await userEvent.click(screen.getAllByText('Choose')[0]);
    expect(inPalette().sort()).not.toEqual(before);

    await userEvent.click(screen.getByText('✓ Chosen')); // choose it again to clear
    expect(inPalette().sort()).toEqual(before);
    expect(document.querySelectorAll<HTMLElement>('.suggestions__item--picked')).toHaveLength(0);
  });

  it('keeps the palette as the pairing when you leave step 2 and come back', async () => {
    await imageWithFourColors();
    await toStep2();
    const suggested = chip('best-match');
    await userEvent.click(screen.getAllByText('Choose')[0]);
    await userEvent.click(screen.getByText(/^Next: Your palette/));
    await userEvent.click(screen.getByText('Back'));
    expect(inPalette().sort()).toEqual([...suggested].sort());
  });
});

describe('clicking the progress bar', () => {
  const bar = (n: number) => screen.getByRole<HTMLButtonElement>('button', { name: new RegExp(`^Step ${n}:`) });
  const onStep = (n: number) => expect(screen.getByText(`Step ${n} of 3`)).toBeTruthy();
  const next = () => userEvent.click(screen.getByText(/^Next: /));

  it('starts with only the first step reachable', () => {
    render(<App />);
    expect(bar(1).disabled).toBe(false);
    expect(bar(2).disabled).toBe(true);
    expect(bar(3).disabled).toBe(true);
  });

  it('unlocks each step as it is reached', async () => {
    render(<App />);
    await next();
    expect(bar(2).disabled).toBe(false);
    expect(bar(3).disabled).toBe(true);
    await next();
    expect(bar(3).disabled).toBe(false);
  });

  it('goes straight back to step 1 from the last step in one click', async () => {
    render(<App />);
    await next();
    await next();
    onStep(3);
    await userEvent.click(bar(1));
    onStep(1);
    expect(document.title).toBe('Get a color · Color Wheel');
  });

  it('goes straight forward again to a step reached before', async () => {
    render(<App />);
    await next();
    await next();
    await userEvent.click(bar(1));
    await userEvent.click(bar(3));
    onStep(3);
    expect(screen.getByText('Start over')).toBeTruthy();
  });

  it('jumps to the middle step too', async () => {
    render(<App />);
    await next();
    await next();
    await userEvent.click(bar(2));
    onStep(2);
    expect(screen.getByText(/of 4 colors in your palette/)).toBeTruthy();
  });

  it('cannot reach a step that has not been reached yet', async () => {
    render(<App />);
    await userEvent.click(bar(3)); // locked
    onStep(1);
    await next();
    await userEvent.click(bar(3)); // still locked
    onStep(2);
  });

  it('keeps the palette when jumping around', async () => {
    render(<App />);
    await next();
    const before = stackColors();
    expect(before.length).toBeGreaterThan(0);
    await userEvent.click(bar(1));
    await userEvent.click(bar(2));
    expect(stackColors()).toEqual(before);
  });

  it('keeps choices made on step 2 when jumping back and forth', async () => {
    render(<App />);
    await next();
    await userEvent.click(screen.getAllByText('Choose')[0]);
    const chosen = stackColors();
    await userEvent.click(bar(1));
    await userEvent.click(bar(2));
    expect(stackColors()).toEqual(chosen);
    expect(document.querySelectorAll<HTMLElement>('.suggestions__item--picked')).toHaveLength(1);
  });

  it('still selects the wheel colors on arrival at step 2 by clicking the bar', async () => {
    render(<App />);
    await next();
    await userEvent.click(bar(1));
    await userEvent.click(bar(2));
    expect(stackColors().length).toBeGreaterThan(0);
  });

  it('locks the later steps again after Reset', async () => {
    render(<App />);
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Reset and start over' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm reset' }));
    onStep(1);
    expect(bar(2).disabled).toBe(true);
    expect(bar(3).disabled).toBe(true);
  });

  it('locks the later steps again after Start over', async () => {
    render(<App />);
    await next();
    await next();
    await userEvent.click(screen.getByText('Start over'));
    expect(bar(2).disabled).toBe(true);
    expect(bar(3).disabled).toBe(true);
  });
});

describe('random colors on step 1', () => {
  const randomRow = () => [...document.querySelectorAll<HTMLElement>('.source__random .swatches__item')].map((el) => el.dataset.hex!);
  const field = () => screen.getByLabelText<HTMLInputElement>('Hex value');

  it('shows a row of random colors as soon as the app loads', () => {
    render(<App />);
    expect(randomRow()).toHaveLength(6);
    expect(new Set(randomRow()).size).toBe(6);
    expect(screen.getByText('Or start from a color')).toBeTruthy();
  });

  it('makes the tapped color the base color', async () => {
    render(<App />);
    const target = randomRow()[3];
    await userEvent.click(screen.getByTitle(`Use ${target}`));
    expect(field().value).toBe(target);
  });

  it('builds the next step on the chosen color', async () => {
    render(<App />);
    const target = randomRow()[1];
    await userEvent.click(screen.getByTitle(`Use ${target}`));
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    expect(document.querySelector<HTMLElement>('.harmony .swatches__item')!.dataset.hex).toBe(target);
    expect(stackColors()[0]).toBe(target);
  });

  it('marks the chosen color in the row, and moves the mark when another is chosen', async () => {
    render(<App />);
    const [first, second] = randomRow();
    await userEvent.click(screen.getByTitle(`Use ${first}`));
    expect([...document.querySelectorAll<HTMLElement>('.source__random .swatches__item--active')].map((el) => el.dataset.hex)).toEqual([first]);
    await userEvent.click(screen.getByTitle(`Use ${second}`));
    expect([...document.querySelectorAll<HTMLElement>('.source__random .swatches__item--active')].map((el) => el.dataset.hex)).toEqual([second]);
  });

  it('keeps the same random colors while you move between steps', async () => {
    render(<App />);
    const before = randomRow();
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getByRole('button', { name: /^Step 1:/ }));
    expect(randomRow()).toEqual(before);
  });

  it('draws a new set when you shuffle, without changing the chosen color', async () => {
    render(<App />);
    const before = randomRow();
    const base = field().value;
    await userEvent.click(screen.getByRole('button', { name: 'Shuffle random colors' }));
    expect(randomRow()).not.toEqual(before);
    expect(field().value).toBe(base);
  });

  it('gives a fresh set after Reset', async () => {
    render(<App />);
    const before = randomRow();
    await userEvent.click(screen.getByRole('button', { name: 'Reset and start over' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm reset' }));
    expect(randomRow()).toHaveLength(6);
    expect(randomRow()).not.toEqual(before);
  });
});

describe('the color field on step 1', () => {
  const css = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };
  const dot = () => document.querySelector<HTMLElement>('.color-picker__dot')!;
  const field = () => screen.getByLabelText<HTMLInputElement>('Hex value');

  it('shows the current color once next to the choices: a dot inside the field, no separate swatch', () => {
    render(<App />);
    expect(document.querySelector('.color-picker__swatch')).toBeNull();
    expect(document.querySelectorAll('.color-picker__dot')).toHaveLength(1);
    expect(dot().style.backgroundColor).toBe(css(field().value));
  });

  it('keeps the dot in step with a random swatch that is picked', async () => {
    render(<App />);
    const target = document.querySelectorAll<HTMLElement>('.source__random .swatches__item')[2].dataset.hex!;
    await userEvent.click(screen.getByTitle(`Use ${target}`));
    expect(field().value).toBe(target);
    expect(dot().style.backgroundColor).toBe(css(target));
  });

  it('keeps the dot in step with typed text', async () => {
    render(<App />);
    await userEvent.clear(field());
    await userEvent.type(field(), '#e91e63');
    expect(dot().style.backgroundColor).toBe(css('#e91e63'));
  });

  it('opens the sliders from Fine-tune and applies the result to the field and the dot', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Fine-tune color' }));
    fireEvent.change(screen.getByLabelText<HTMLInputElement>('Hue'), { target: { value: '0' } });
    await userEvent.click(screen.getByText('Select'));
    expect(field().value).toBe('#cc3333');
    expect(dot().style.backgroundColor).toBe(css('#cc3333'));
    expect(screen.queryByText('Select')).toBeNull();
  });

  it('still marks which random swatch is chosen, but never marks the dot as a choice', async () => {
    render(<App />);
    const [first] = [...document.querySelectorAll<HTMLElement>('.source__random .swatches__item')];
    await userEvent.click(first);
    expect(document.querySelectorAll('.source__random .swatches__item--active')).toHaveLength(1);
    expect(dot().className).not.toMatch(/swatches/);
  });
});

describe('App reset', () => {
  const resetOnce = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Reset and start over' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm reset' }));
  };

  it('offers Reset on steps 1 and 2, but not on the last step (which has Start over)', async () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Reset and start over' })).toBeTruthy();
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    expect(screen.getByRole('button', { name: 'Reset and start over' })).toBeTruthy();
    await userEvent.click(screen.getByText(/^Next: Your palette/));
    expect(screen.queryByRole('button', { name: /reset/i })).toBeNull();
    expect(screen.getByText('Start over')).toBeTruthy();
  });

  it('on step 1 clears the color back to the default', async () => {
    render(<App />);
    const field = screen.getByLabelText<HTMLInputElement>('Hex value');
    await userEvent.clear(field);
    await userEvent.type(field, '#e91e63');
    expect(screen.getByLabelText<HTMLInputElement>('Hex value').value).toBe('#e91e63');

    await resetOnce();
    expect(screen.getByLabelText<HTMLInputElement>('Hex value').value).toBe('#3366cc');
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
  });

  it('on step 2 clears the palette and wheel type and returns to step 1', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getAllByText('Choose')[0]); // a pairing is chosen
    expect(document.querySelectorAll<HTMLElement>('.suggestions__item--picked')).toHaveLength(1);

    await resetOnce();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();

    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    expect(document.querySelectorAll<HTMLElement>('.suggestions__item--picked')).toHaveLength(0);
  });

  it('a single tap does not reset anything', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getByRole('button', { name: 'Reset and start over' }));
    expect(screen.getByText('Step 2 of 3')).toBeTruthy();
  });
});

describe('App with colors picked from an image', () => {
  const GREEN = '#33cc33';
  const BLUE = '#3333cc';
  const RED = '#cc3333';

  /**
   * A fake image: a canvas context whose pixels come from [hex, count] runs. Defaults to mostly red,
   * some green and a little blue, so red is clearly the most common color.
   */
  const installFakeImage = (runs: [string, number][] = [[RED, 60], [GREEN, 30], [BLUE, 10]], alpha = 255) => {
    const pixels = runs.flatMap(([hex, count]) => {
      const value = parseInt(hex.slice(1), 16);
      return Array.from({ length: count }, () => [(value >> 16) & 255, (value >> 8) & 255, value & 255, alpha]).flat();
    });
    const context = new Proxy({}, {
      get: (_target, name) => (name === 'getImageData' ? () => ({ data: new Uint8ClampedArray(pixels), width: pixels.length / 4, height: 1 }) : () => {}),
      set: () => true,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    globalThis.createImageBitmap = vi.fn(async () => ({ width: pixels.length / 4, height: 1, close() {} })) as unknown as typeof createImageBitmap;
  };

  const pasteImage = async ({ expectColors = true } = {}) => {
    const event = new Event('paste');
    Object.defineProperty(event, 'clipboardData', {
      value: { items: [{ type: 'image/png', getAsFile: () => new Blob(['x'], { type: 'image/png' }) }] },
    });
    await act(async () => {
      document.dispatchEvent(event);
    });
    if (expectColors) await screen.findByText('Colors in this image');
    else await act(async () => {}); // let the image load settle
  };

  const addAll = () => userEvent.click(screen.getByText(/^Add (all|top \d+) to palette$/));

  it("builds step 2 on the image's first color, which stays the base after adding them all", async () => {
    installFakeImage();
    render(<App />);
    await pasteImage();
    await addAll();

    expect(screen.getByLabelText<HTMLInputElement>('Hex value').value).toBe(RED);

    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    const swatches = [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')];
    expect(swatches[0].dataset.hex).toBe(RED); // the wheel is built on the base, which comes first
  });

  it('moves the base to the first image color when a hand-typed color is not among them', async () => {
    installFakeImage();
    render(<App />);
    await pasteImage();
    const field = screen.getByLabelText<HTMLInputElement>('Hex value');
    await userEvent.clear(field);
    await userEvent.type(field, '#e91e63');
    await addAll();
    expect(screen.getByLabelText<HTMLInputElement>('Hex value').value).toBe(RED);
  });

  it('shows the other picked colors on step 2 and tailors the pairings to them', async () => {
    installFakeImage();
    render(<App />);
    await pasteImage();
    await addAll();
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));

    // all three image colors are in the stacked preview, RED (the base) first
    expect(stackColors()).toEqual([RED, GREEN, BLUE]);
    expect(screen.getByText('3 of 4 colors in your palette')).toBeTruthy();
    expect(screen.getByTitle<HTMLButtonElement>(`Remove ${GREEN} from your palette`)).toBeTruthy();
    expect(screen.getByTitle<HTMLButtonElement>(`Remove ${BLUE} from your palette`)).toBeTruthy();
    expect(document.querySelector<HTMLElement>('.suggestions__reason')!.textContent).toMatch(/your 3 colors/);
    expect(screen.getByText(/Small dots on the wheel are your other colors/)).toBeTruthy();
  });

  it('keeps the current base when it is among the colors added', async () => {
    installFakeImage();
    render(<App />);
    await pasteImage();
    await userEvent.click(screen.getByTitle<HTMLButtonElement>(`Use ${BLUE}`)); // base becomes blue
    await addAll();
    expect(screen.getByLabelText<HTMLInputElement>('Hex value').value).toBe(BLUE);
  });

  it('pairings fall back to base-only suggestions when no other colors were picked', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    expect(screen.queryByText(/Small dots on the wheel/)).toBeNull(); // nothing beyond the wheel's own colors
    expect(document.querySelector<HTMLElement>('.suggestions__reason')!.textContent).not.toMatch(/your \d colors/);
  });

  describe('a new image starts over', () => {
    // Chosen so that neither color, nor the orange's complement (#3388cc), matches anything from the first image.
    const ORANGE = '#cc8833';
    const PURPLE = '#8833cc';
    const field = () => screen.getByLabelText<HTMLInputElement>('Hex value');
    const nextStep = () => userEvent.click(screen.getByText(/^Next: /));
    const loadSecondImage = async () => {
      vi.restoreAllMocks();
      installFakeImage([[ORANGE, 70], [PURPLE, 30]]);
      await pasteImage();
    };

    /** Image 1: add all its colors, then choose a pairing on step 2 and go back to step 1. */
    const useFirstImage = async () => {
      installFakeImage();
      render(<App />);
      await pasteImage();
      await addAll();
      await nextStep();
      await userEvent.click(screen.getAllByText('Choose')[0]);
      await userEvent.click(screen.getByText('Back'));
    };

    it('drops the colors carried from the previous image on step 2', async () => {
      await useFirstImage();
      await loadSecondImage();
      await nextStep();

      expect(stackColors()).not.toContain(BLUE);
      expect(stackColors()).not.toContain(GREEN);
      expect(screen.queryByTitle(`Remove ${BLUE} from your palette`)).toBeNull();
      expect(screen.queryByTitle(`Remove ${GREEN} from your palette`)).toBeNull();
    });

    it('clears the chosen pairing', async () => {
      await useFirstImage();
      await loadSecondImage();
      await nextStep();
      expect(document.querySelectorAll<HTMLElement>('.suggestions__item--picked')).toHaveLength(0);
    });

    it('builds step 2 on the new image: base, wheel and pairings', async () => {
      await useFirstImage();
      await loadSecondImage();
      expect(field().value).toBe(ORANGE);
      await nextStep();
      const swatches = [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')];
      expect(swatches[0].dataset.hex).toBe(ORANGE);
      expect(document.querySelector<HTMLElement>('.suggestions__reason')!.textContent).not.toMatch(/your \d colors/); // no leftover context
    });

    it('leaves nothing from the old image on the last step', async () => {
      await useFirstImage();
      await loadSecondImage();
      await nextStep(); // step 2: auto-selects the new wheel only
      await nextStep(); // step 3
      const palette = [...document.querySelectorAll<HTMLElement>('.palette .swatches__item')].map((swatch) => swatch.dataset.hex);
      [RED, GREEN, BLUE].forEach((old) => expect(palette).not.toContain(old));
      expect(palette).toContain(ORANGE);
    });

    it('also clears the palette when the new image yields no colors', async () => {
      await useFirstImage();
      vi.restoreAllMocks();
      installFakeImage([[RED, 50]], 0); // fully transparent: nothing to extract
      await pasteImage({ expectColors: false });
      expect(field().value).toBe(RED); // base unchanged: image 1's first color

      await nextStep();
      // image 1's picks are gone: the stack holds only what the wheel selected on arrival
      const wheelColors = [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')].map((el) => el.dataset.hex);
      expect(stackColors()).toEqual(wheelColors);
      expect(stackColors()).not.toContain(GREEN);
      expect(stackColors()).not.toContain(BLUE);
      expect(document.querySelectorAll<HTMLElement>('.suggestions__item--picked')).toHaveLength(0);
    });

    it('keeps the wheel type the user chose', async () => {
      await useFirstImage();
      await loadSecondImage();
      await nextStep();
      expect(screen.getByRole('combobox', { name: /wheel type/i }).textContent).toBe('Complementary');
    });
  });

  describe('wheel types for an image whose main color is white or grey', () => {
    const WHITE = '#ffffff';
    const GREY = '#808080';

    const wheelSwatches = () => [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')].map((swatch) => swatch.dataset.hex);

    it.each([WHITE, GREY, '#000000'])('shows distinct, colorful swatches when the base is %s', async (neutral) => {
      installFakeImage([[neutral, 70], [RED, 30]]);
      render(<App />);
      await pasteImage();
      expect(screen.getByLabelText<HTMLInputElement>('Hex value').value).toBe(neutral);

      await userEvent.click(screen.getByText(/^Next: Pick your colors/));
      const swatches = wheelSwatches();
      expect(swatches[0]).toBe(neutral);
      expect(swatches.length).toBeGreaterThan(2);
      expect(new Set(swatches).size).toBe(swatches.length); // no repeated copies of the neutral
    });

    it('gives the suggestions real colors too', async () => {
      installFakeImage([[WHITE, 70], [GREY, 30]]);
      render(<App />);
      await pasteImage();
      await userEvent.click(screen.getByText(/^Next: Pick your colors/));
      const chips = [...document.querySelectorAll<HTMLElement>('.suggestions__item .swatches__item')].map((chip) => chip.dataset.hex);
      expect(new Set(chips).size).toBeGreaterThan(2);
    });
  });

  describe('the four-color palette limit', () => {
    // The two least common colors must not match anything else on screen (red's complement is #33cccc, so avoid it).
    const SIX: [string, number][] = [['#cc3333', 30], ['#33cc33', 25], ['#3333cc', 20], ['#cccc33', 12], ['#cc8833', 8], ['#8833cc', 5]];
    const paletteSize = () => document.querySelectorAll<HTMLElement>('.palette .swatches__item').length;
    const toStep = (label: string) => userEvent.click(screen.getByText(new RegExp(`^Next: ${label}`)));

    it('adds only the four most common image colors and says so', async () => {
      installFakeImage(SIX);
      render(<App />);
      await pasteImage();
      expect(screen.getAllByTitle<HTMLButtonElement>(/^Use #/)).toHaveLength(6);
      expect(screen.getByText('Add top 4 to palette')).toBeTruthy();

      await addAll();
      expect(screen.getByText('Added 4 of 6 (palette holds 4) ✓')).toBeTruthy();

      await toStep('Pick your colors');
      expect(screen.getByText(/4 of 4 colors in your palette/)).toBeTruthy();
      // the two least common colors were left out of the palette (they may still appear as suggestions)
      expect(stackColors()).toEqual(['#cc3333', '#33cc33', '#3333cc', '#cccc33']);
    });

    it('keeps the final palette at four colors', async () => {
      installFakeImage(SIX);
      render(<App />);
      await pasteImage();
      await addAll();
      await toStep('Pick your colors');
      await toStep('Your palette');
      expect(paletteSize()).toBe(4);
    });

    it('blocks new swatches on step 2 while full, but never the pairings, and frees swatches when one is removed', async () => {
      installFakeImage(SIX);
      render(<App />);
      await pasteImage();
      await addAll();
      await toStep('Pick your colors');

      // full: every wheel color that is not in the palette is locked...
      const locked = () => [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item--locked')];
      expect(locked().length).toBeGreaterThan(0);
      // ...but the pairings are all available
      expect(screen.queryByText('No room')).toBeNull();
      screen.getAllByText('Choose').forEach((button) => expect(button.closest('button')!.disabled).toBe(false));

      const lockedHex = locked()[0].dataset.hex;
      await userEvent.click(locked()[0]); // does nothing
      expect(screen.getByText(/4 of 4 colors in your palette/)).toBeTruthy();
      expect(screen.queryByTitle(`Remove ${lockedHex}`)).toBeNull();

      // remove one color from the stack: there is room again
      await userEvent.click(document.querySelector<HTMLElement>('.stack__segment[data-hex]')!);
      expect(screen.getByText(/3 of 4 colors in your palette/)).toBeTruthy();
      expect(locked()).toHaveLength(0);
      await userEvent.click(screen.getByTitle<HTMLButtonElement>(`Add ${lockedHex}`));
      expect(screen.getByText(/4 of 4 colors in your palette/)).toBeTruthy();
    });

    it('selects at most four of a five-color wheel on arrival', async () => {
      // Radix's dropdown needs these pointer APIs, which jsdom does not implement.
      Element.prototype.hasPointerCapture = () => false;
      Element.prototype.setPointerCapture = () => {};
      Element.prototype.releasePointerCapture = () => {};
      Element.prototype.scrollIntoView = () => {};
      installFakeImage([['#808080', 70], ['#cc3333', 30]]); // a grey base gives a five-color square scheme
      render(<App />);
      await pasteImage();
      await userEvent.click(screen.getByText(/^Next: Pick your colors/));
      await userEvent.click(screen.getByRole('combobox', { name: /wheel type/i }));
      await userEvent.click(await screen.findByRole('option', { name: 'Square' }));
      const swatches = [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')];
      expect(swatches).toHaveLength(5);
      expect(swatches.filter((el) => el.getAttribute('aria-pressed') === 'true')).toHaveLength(4);
      expect(screen.getByText(/4 of 4 colors in your palette/)).toBeTruthy();
    });

    it('lets a pairing replace a full auto-selected palette', async () => {
      render(<App />);
      await toStep('Pick your colors'); // auto-selects the wheel colors
      await userEvent.click(screen.getAllByText('Choose')[0]);
      expect(document.querySelectorAll<HTMLElement>('.suggestions__item--picked')).toHaveLength(1);
      await toStep('Your palette');
      expect(paletteSize()).toBeLessThanOrEqual(4);
    });
  });

  describe('step 2 swatches have no "active" ring', () => {
    // Step 1 stays mounted but hidden, so look only inside step 2.
    const noRing = () => {
      const step = document.querySelector<HTMLElement>('.pick-colors')!;
      expect(step.querySelectorAll<HTMLElement>('.swatches__item--active')).toHaveLength(0);
      expect(step.querySelectorAll<HTMLElement>('[aria-current]')).toHaveLength(0);
    };

    it('shows no thick ring on the wheel swatches, the stack or the pairing chips', async () => {
      installFakeImage();
      render(<App />);
      await pasteImage();
      await addAll();
      await userEvent.click(screen.getByText(/^Next: Pick your colors/));
      expect(document.querySelectorAll<HTMLElement>('.harmony .swatches__item').length).toBeGreaterThan(1);
      expect(document.querySelectorAll<HTMLElement>('.stack__segment[data-hex]').length).toBeGreaterThan(0);
      expect(document.querySelectorAll<HTMLElement>('.suggestions__item .swatches__item').length).toBeGreaterThan(0);
      noRing();
    });

    it('gives every selected color the same marking: the selected style, with a check, and nothing else', async () => {
      render(<App />);
      await userEvent.click(screen.getByText(/^Next: Pick your colors/)); // both wheel colors are auto-selected
      const selected = [...document.querySelectorAll<HTMLElement>('.harmony .swatches__item')].filter((el) => el.getAttribute('aria-pressed') === 'true');
      expect(selected).toHaveLength(2);
      selected.forEach((el) => {
        expect(el.className).toContain('swatches__item--selected');
        expect(el.className).not.toContain('swatches__item--active');
      });
      // the base and the partner look alike
      expect(selected[0].className).toBe(selected[1].className);
      noRing();
    });

    it('still shows no ring after tapping swatches and choosing a pairing', async () => {
      render(<App />);
      await userEvent.click(screen.getByText(/^Next: Pick your colors/));
      await userEvent.click(screen.getAllByTitle<HTMLButtonElement>(/^Remove #/)[0]);
      await userEvent.click(screen.getAllByText('Choose')[0]);
      noRing();
    });

    it('keeps the ring on step 1, where it marks the current base color among the image colors', async () => {
      installFakeImage();
      render(<App />);
      await pasteImage();
      expect(document.querySelectorAll<HTMLElement>('.source__colors .swatches__item--active')).toHaveLength(1);
    });
  });

  describe('the progress bar after a new image', () => {
    const bar = (n: number) => screen.getByRole<HTMLButtonElement>('button', { name: new RegExp(`^Step ${n}:`) });

    it('keeps step 2 reachable but locks step 3, which was built on the old image', async () => {
      installFakeImage();
      render(<App />);
      await pasteImage();
      await userEvent.click(screen.getByText(/^Next: Pick your colors/));
      await userEvent.click(screen.getByText(/^Next: Your palette/));
      expect(bar(3).disabled).toBe(false);

      await userEvent.click(bar(1));
      vi.restoreAllMocks();
      installFakeImage([['#cc8833', 70], ['#8833cc', 30]]);
      await pasteImage();

      expect(bar(2).disabled).toBe(false);
      expect(bar(3).disabled).toBe(true);
    });

    it('goes to step 2 from the bar and builds it on the new image', async () => {
      installFakeImage();
      render(<App />);
      await pasteImage();
      await userEvent.click(screen.getByText(/^Next: Pick your colors/));
      await userEvent.click(bar(1));
      vi.restoreAllMocks();
      installFakeImage([['#cc8833', 70], ['#8833cc', 30]]);
      await pasteImage();
      await userEvent.click(bar(2));
      expect(document.querySelector<HTMLElement>('.harmony .swatches__item')!.dataset.hex).toBe('#cc8833');
    });
  });

  describe('random colors and a loaded image', () => {
    const randomRow = () => document.querySelectorAll('.source__random .swatches__item');

    it('are replaced by the image\'s own colors once an image is loaded', async () => {
      installFakeImage();
      render(<App />);
      expect(randomRow()).toHaveLength(6);
      await pasteImage();
      expect(randomRow()).toHaveLength(0);
      expect(screen.queryByText('Or start from a color')).toBeNull();
      expect(screen.getByText('Colors in this image')).toBeTruthy();
    });

    it('come back when the image has no colors to extract', async () => {
      installFakeImage([[RED, 50]], 0); // fully transparent
      render(<App />);
      await pasteImage({ expectColors: false });
      expect(randomRow()).toHaveLength(6);
    });
  });

  describe('the color field with an image loaded', () => {
    const css = (hex: string) => `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;

    it('stays in the same place, showing the image color as a dot and as text', async () => {
      installFakeImage();
      render(<App />);
      await pasteImage();
      expect(document.querySelectorAll('.color-picker')).toHaveLength(1);
      expect(document.querySelector<HTMLElement>('.color-picker__dot')!.style.backgroundColor).toBe(css(RED));
      expect(screen.getByLabelText<HTMLInputElement>('Hex value').value).toBe(RED);
      expect(document.querySelector('.color-picker__swatch')).toBeNull();
    });
  });

  describe('base color for a new image', () => {
    const field = () => screen.getByLabelText<HTMLInputElement>('Hex value');

    it('takes the first (most common) extracted color when an image is loaded', async () => {
      installFakeImage();
      render(<App />);
      expect(field().value).toBe('#3366cc');
      await pasteImage();
      expect(field().value).toBe(RED);
      expect(screen.getByTitle<HTMLButtonElement>(`Use ${RED}`).getAttribute('aria-current')).toBe('true');
    });

    it('replaces a color the user typed or picked earlier', async () => {
      installFakeImage();
      render(<App />);
      await userEvent.clear(field());
      await userEvent.type(field(), '#e91e63');
      await pasteImage();
      expect(field().value).toBe(RED);
    });

    it('follows each new image, not just the first', async () => {
      installFakeImage();
      render(<App />);
      await pasteImage();
      expect(field().value).toBe(RED);

      vi.restoreAllMocks();
      installFakeImage([[BLUE, 70], [GREEN, 30]]);
      await pasteImage();
      expect(field().value).toBe(BLUE);
    });

    it('leaves the color alone when nothing can be extracted (e.g. a fully transparent image)', async () => {
      installFakeImage([[RED, 50], [GREEN, 50]], 0);
      render(<App />);
      await pasteImage({ expectColors: false });
      expect(field().value).toBe('#3366cc');
      expect(screen.queryByText('Colors in this image')).toBeNull();
    });

    it('keeps the base when a different swatch is tapped afterwards', async () => {
      installFakeImage();
      render(<App />);
      await pasteImage();
      await userEvent.click(screen.getByTitle<HTMLButtonElement>(`Use ${GREEN}`));
      expect(field().value).toBe(GREEN);
    });
  });
});

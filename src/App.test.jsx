import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

beforeEach(() => {
  // jsdom has no canvas; the wheel and image sampler only need a null context.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

describe('App flow', () => {
  it('restarts from the last step with an empty palette and default color', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getAllByText('Choose')[0]);
    await userEvent.click(screen.getByText(/^Next: Your palette/));
    expect(document.querySelectorAll('.palette .swatches__item').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByText('Start over'));
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    expect(screen.getByLabelText('Hex value').value).toBe('#3366cc');
    // Nothing is chosen any more, so there is nothing to skip to.
    expect(screen.queryByText('Skip to palette')).toBeNull();
  });

  it('selects the wheel colors on arrival when nothing is chosen', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    const swatches = document.querySelectorAll('.harmony .swatches__item');
    expect(swatches.length).toBeGreaterThan(1);
    swatches.forEach((swatch) => expect(swatch.getAttribute('aria-pressed')).toBe('true'));
  });

  it('keeps manual choices instead of re-selecting the wheel', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getAllByTitle(/^Remove #/)[1]); // user drops the second color
    await userEvent.click(screen.getByText('Back'));
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    const pressed = [...document.querySelectorAll('.harmony .swatches__item')].map((s) => s.getAttribute('aria-pressed'));
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
    const field = screen.getByLabelText('Hex value');
    await userEvent.clear(field);
    await userEvent.type(field, '#e91e63');
    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getByText('Back'));
    expect(screen.getByLabelText('Hex value').value).toBe('#e91e63');
  });

  it('skips from step 1 straight to the palette once colors have been chosen', async () => {
    render(<App />);
    expect(screen.queryByText('Skip to palette')).toBeNull();

    await userEvent.click(screen.getByText(/^Next: Pick your colors/));
    await userEvent.click(screen.getByText('Back'));

    await userEvent.click(screen.getByText('Skip to palette'));
    expect(screen.getByText('Step 3 of 3')).toBeTruthy();
    expect(document.querySelectorAll('.palette .swatches__item')).toHaveLength(2);
  });
});

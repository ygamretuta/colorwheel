import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { hexToRgb } from '@/shared/color/convert';

import ColorPicker from './ColorPicker';

const openPanel = () => userEvent.click(screen.getByRole('button', { name: 'Fine-tune color' }));

describe('ColorPicker', () => {
  it('opens a panel with a Select button when the swatch is tapped', async () => {
    render(<ColorPicker hex="#3366cc" onChange={() => {}} />);
    expect(screen.queryByText('Select')).toBeNull();
    await openPanel();
    expect(screen.getByText('Select')).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('Hue')).toBeTruthy();
  });

  it('applies the new color and closes the panel on Select', async () => {
    const onChange = vi.fn();
    render(<ColorPicker hex="#ff0000" onChange={onChange} />);
    await openPanel();
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText<HTMLInputElement>('Hue'), { target: { value: '120' } });
    await userEvent.click(screen.getByText('Select'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('#00ff00');
    expect(screen.queryByText('Select')).toBeNull();
  });

  it('discards edits when the panel is dismissed without Select', async () => {
    const onChange = vi.fn();
    render(<ColorPicker hex="#ff0000" onChange={onChange} />);
    await openPanel();
    fireEvent.change(screen.getByLabelText<HTMLInputElement>('Hue'), { target: { value: '120' } });
    await userEvent.keyboard('{Escape}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('Select')).toBeNull();
  });

  it('starts the sliders from the current color each time it opens', async () => {
    render(<ColorPicker hex="#0000ff" onChange={() => {}} />);
    await openPanel();
    expect(screen.getByLabelText<HTMLInputElement>('Hue').value).toBe('240');
  });

  it('still accepts a typed hex value', async () => {
    const onChange = vi.fn();
    render(<ColorPicker hex="#3366cc" onChange={onChange} />);
    const field = screen.getByLabelText<HTMLInputElement>('Hex value');
    await userEvent.clear(field);
    await userEvent.type(field, '#abc');
    expect(onChange).toHaveBeenLastCalledWith('#aabbcc');
  });
});

const css = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
};
const dot = () => document.querySelector<HTMLElement>('.color-picker__dot')!;

describe('ColorPicker as one field', () => {
  it('has no separate swatch button: the color is shown once, as a dot', () => {
    render(<ColorPicker hex="#3366cc" onChange={() => {}} />);
    expect(document.querySelector('.color-picker__swatch')).toBeNull();
    expect(screen.queryByLabelText(/^Pick a color/)).toBeNull();
    expect(document.querySelectorAll('.color-picker__dot')).toHaveLength(1);
  });

  it('keeps the dot, the hex text and the Fine-tune button in a single field', () => {
    render(<ColorPicker hex="#3366cc" onChange={() => {}} />);
    const field = document.querySelector('.color-picker')!;
    expect(field.contains(dot())).toBe(true);
    expect(field.contains(screen.getByLabelText('Hex value'))).toBe(true);
    expect(field.contains(screen.getByRole('button', { name: 'Fine-tune color' }))).toBe(true);
  });

  it('paints the dot with the current color and follows it when the color changes', () => {
    const { rerender } = render(<ColorPicker hex="#3366cc" onChange={() => {}} />);
    expect(dot().style.backgroundColor).toBe(css('#3366cc'));
    rerender(<ColorPicker hex="#e91e63" onChange={() => {}} />);
    expect(dot().style.backgroundColor).toBe(css('#e91e63'));
  });

  it('does not change the dot while a half-typed value is invalid', async () => {
    render(<ColorPicker hex="#3366cc" onChange={() => {}} />);
    const field = screen.getByLabelText<HTMLInputElement>('Hex value');
    await userEvent.clear(field);
    await userEvent.type(field, '#12');
    expect(dot().style.backgroundColor).toBe(css('#3366cc'));
  });

  it('the dot is decoration only: hidden from assistive tech, not a button, and tapping it does nothing', async () => {
    render(<ColorPicker hex="#3366cc" onChange={() => {}} />);
    expect(dot().getAttribute('aria-hidden')).toBe('true');
    expect(dot().tagName).toBe('SPAN');
    await userEvent.click(dot());
    expect(screen.queryByText('Select')).toBeNull();
  });

  it('opens the slider panel from the labeled Fine-tune button', async () => {
    render(<ColorPicker hex="#3366cc" onChange={() => {}} />);
    const tune = screen.getByRole('button', { name: 'Fine-tune color' });
    expect(tune.textContent).toBe('Fine-tune');
    expect(screen.queryByText('Select')).toBeNull();
    await userEvent.click(tune);
    expect(screen.getByText('Select')).toBeTruthy();
  });

  it('typing in the hex text does not open the panel', async () => {
    render(<ColorPicker hex="#3366cc" onChange={() => {}} />);
    await userEvent.type(screen.getByLabelText('Hex value'), 'a');
    expect(screen.queryByText('Select')).toBeNull();
  });

  it('applies a fine-tuned color to the field and closes the panel', async () => {
    const onChange = vi.fn();
    render(<ColorPicker hex="#ff0000" onChange={onChange} />);
    await openPanel();
    fireEvent.change(screen.getByLabelText<HTMLInputElement>('Hue'), { target: { value: '120' } });
    await userEvent.click(screen.getByText('Select'));
    expect(onChange).toHaveBeenCalledWith('#00ff00');
    expect(screen.queryByText('Select')).toBeNull();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ColorPicker from './ColorPicker';

const openPanel = () => userEvent.click(screen.getByLabelText(/^Pick a color/));

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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Palette from './Palette.jsx';

describe('Palette', () => {
  it('shows an empty hint, then removes and clears', async () => {
    const onRemove = vi.fn();
    const onClear = vi.fn();
    const { rerender } = render(<Palette colors={[]} onRemove={onRemove} onClear={onClear} />);
    expect(screen.getByText(/pick colors or a pairing/i)).toBeTruthy();

    rerender(<Palette colors={['#ff0000']} onRemove={onRemove} onClear={onClear} />);
    await userEvent.click(screen.getByTitle('Remove #ff0000'));
    expect(onRemove).toHaveBeenCalledWith('#ff0000');
    await userEvent.click(screen.getByText('Clear'));
    expect(onClear).toHaveBeenCalled();
  });
});

describe('Palette copy', () => {
  it('copies the hex codes and confirms', async () => {
    const user = userEvent.setup();
    render(<Palette colors={['#ff0000', '#00ff00']} onRemove={() => {}} onClear={() => {}} />);
    await user.click(screen.getByText('Copy hex codes'));
    expect(await screen.findByText('Copied ✓')).toBeTruthy();
    expect(await navigator.clipboard.readText()).toBe('#ff0000, #00ff00');
  });

  it('reports a failed copy', async () => {
    const user = userEvent.setup();
    render(<Palette colors={['#ff0000']} onRemove={() => {}} onClear={() => {}} />);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    await user.click(screen.getByText('Copy hex codes'));
    expect(await screen.findByText(/Copy failed/)).toBeTruthy();
  });
});

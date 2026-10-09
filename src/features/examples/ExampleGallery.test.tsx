import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ExampleGallery from './ExampleGallery';

const PALETTE = ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#e63946'];

describe('ExampleGallery', () => {
  it('renders nothing for an empty palette', () => {
    const { container } = render(<ExampleGallery colors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows a movie poster, fashion look, event poster and business cards', () => {
    const { container } = render(<ExampleGallery colors={PALETTE} />);
    const ids = [...container.querySelectorAll<HTMLElement>('[data-example]')].map(
      (el) => el.dataset.example,
    );
    expect(ids).toEqual(['movie', 'fashion', 'event', 'brand']);
    expect(container.querySelectorAll<HTMLElement>('svg[role="img"]')).toHaveLength(4);
  });

  it('paints every example with colors from the palette', () => {
    const { container } = render(<ExampleGallery colors={PALETTE} />);
    container.querySelectorAll<HTMLElement>('[data-example]').forEach((item) => {
      const html = item.innerHTML.toLowerCase();
      const used = PALETTE.filter((color) => html.includes(color));
      expect(used.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('works with a single color', () => {
    const { container } = render(<ExampleGallery colors={['#3366cc']} />);
    expect(container.querySelectorAll<HTMLElement>('[data-example]')).toHaveLength(4);
  });

  it('updates when the palette changes', () => {
    const { container, rerender } = render(<ExampleGallery colors={PALETTE} />);
    const before = container.innerHTML;
    rerender(<ExampleGallery colors={['#ff8800', '#222222', '#fafafa', '#00aa88']} />);
    expect(container.innerHTML).not.toBe(before);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FourColorRule from './FourColorRule';
import { assignFourColor } from './roles';

const PALETTE = ['#1d3557', '#457b9d', '#a8dadc', '#e63946'];

describe('FourColorRule', () => {
  it('renders nothing for an empty palette', () => {
    const { container } = render(<FourColorRule colors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('names the rule and explains the tapered shares', () => {
    render(<FourColorRule colors={PALETTE} />);
    expect(screen.getByRole('heading', { name: 'The four-color rule: 60-25-10-5' })).toBeTruthy();
    expect(screen.getByText(/just 5% a highlight/)).toBeTruthy();
  });

  it('shows a 60 / 25 / 10 / 5 bar and a four-item legend', () => {
    const { container } = render(<FourColorRule colors={PALETTE} />);
    const segments = [...container.querySelectorAll<HTMLElement>('.rule__segment')];
    expect(segments.map((s) => s.dataset.role)).toEqual([
      'dominant',
      'secondary',
      'accent',
      'highlight',
    ]);
    expect(segments.map((s) => s.textContent)).toEqual(['60%', '25%', '10%', '5%']);
    expect(container.querySelectorAll('.rule__legend-item')).toHaveLength(4);
  });

  it('gives the same colors to the bar as the roles say', () => {
    const roles = assignFourColor(PALETTE)!;
    const { container } = render(<FourColorRule colors={PALETTE} />);
    const legend = [...container.querySelectorAll('.rule__hex')].map((el) => el.textContent);
    expect(legend).toEqual([roles.dominant, roles.secondary, roles.accent, roles.highlight]);
  });

  it('shows a website screen and a menu poster', () => {
    const { container } = render(<FourColorRule colors={PALETTE} />);
    const ids = [...container.querySelectorAll<HTMLElement>('[data-example]')].map(
      (el) => el.dataset.example,
    );
    expect(ids).toEqual(['four-landing', 'four-poster']);
    expect(
      screen.getByRole('img', { name: 'Website screen following the four-color rule' }),
    ).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Poster following the four-color rule' })).toBeTruthy();
  });

  it('paints every example with exactly the four rule colors', () => {
    const roles = assignFourColor(PALETTE)!;
    const { container } = render(<FourColorRule colors={PALETTE} />);
    container.querySelectorAll('svg').forEach((svg) => {
      const fills = new Set(
        [...svg.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill')),
      );
      expect(fills).toEqual(
        new Set([roles.dominant, roles.secondary, roles.accent, roles.highlight]),
      );
    });
  });

  it('uses the highlight color only in small places', () => {
    const roles = assignFourColor(PALETTE)!;
    const { container } = render(<FourColorRule colors={PALETTE} />);
    container.querySelectorAll('svg').forEach((svg) => {
      const highlighted = [...svg.querySelectorAll('rect')].filter(
        (rect) => rect.getAttribute('fill') === roles.highlight,
      );
      const area = highlighted.reduce(
        (sum, rect) =>
          sum + Number(rect.getAttribute('width')) * Number(rect.getAttribute('height')),
        0,
      );
      expect(area / (200 * 300)).toBeCloseTo(0.05, 4);
    });
  });

  it('works with a single color by padding the palette', () => {
    const { container } = render(<FourColorRule colors={['#3366cc']} />);
    expect(container.querySelectorAll('.rule__segment')).toHaveLength(4);
    expect(
      new Set([...container.querySelectorAll('.rule__hex')].map((el) => el.textContent)).size,
    ).toBe(4);
  });

  it('updates when the palette changes', () => {
    const { container, rerender } = render(<FourColorRule colors={PALETTE} />);
    const before = container.innerHTML;
    rerender(<FourColorRule colors={['#ff8800', '#222222', '#fafafa', '#00aa88']} />);
    expect(container.innerHTML).not.toBe(before);
  });
});

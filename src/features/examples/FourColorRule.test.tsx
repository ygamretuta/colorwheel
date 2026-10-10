import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('FourColorRule shuffle', () => {
  const legend = (container: HTMLElement) =>
    [...container.querySelectorAll('.rule__hex')].map((el) => el.textContent);
  const fills = (container: HTMLElement) =>
    [...container.querySelectorAll('svg')].map((svg) =>
      [...svg.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill')).join(),
    );
  const shuffleButton = () =>
    screen.getByRole('button', { name: 'Shuffle the colors in the four-color rule' });

  it('starts on the suggested colors, with no Suggested button', () => {
    render(<FourColorRule colors={PALETTE} />);
    expect(screen.queryByRole('button', { name: /suggested colors/ })).toBeNull();
  });

  it('changes the legend and every example when shuffled', async () => {
    const { container } = render(<FourColorRule colors={PALETTE} />);
    const before = { legend: legend(container), fills: fills(container) };
    await userEvent.click(shuffleButton());
    expect(legend(container)).not.toEqual(before.legend);
    expect(fills(container)).not.toEqual(before.fills);
  });

  it('keeps the legend and the examples in agreement after a shuffle', async () => {
    const { container } = render(<FourColorRule colors={PALETTE} />);
    await userEvent.click(shuffleButton());
    const hexes = legend(container);
    container.querySelectorAll('svg').forEach((svg) => {
      const painted = new Set(
        [...svg.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill')),
      );
      hexes.forEach((hex) => expect(painted.has(hex)).toBe(true));
    });
    expect(new Set(hexes).size).toBe(hexes.length);
    hexes.forEach((hex) => expect(PALETTE).toContain(hex));
  });

  it('goes back to the suggested colors with Suggested', async () => {
    const { container } = render(<FourColorRule colors={PALETTE} />);
    const before = legend(container);
    await userEvent.click(shuffleButton());
    await userEvent.click(screen.getByRole('button', { name: /Back to the suggested colors/ }));
    expect(legend(container)).toEqual(before);
    expect(screen.queryByRole('button', { name: /suggested colors/ })).toBeNull();
  });

  it('can be shuffled again and again', async () => {
    const { container } = render(<FourColorRule colors={PALETTE} />);
    for (let i = 0; i < 5; i += 1) {
      const before = legend(container);
      await userEvent.click(shuffleButton());
      expect(legend(container)).not.toEqual(before);
    }
  });

  it('forgets the shuffle when the palette changes', async () => {
    const { container, rerender } = render(<FourColorRule colors={PALETTE} />);
    await userEvent.click(shuffleButton());
    const other = ['#222222', '#dddddd', '#cc3300', '#33aa66'];
    rerender(<FourColorRule colors={other} />);
    expect(legend(container)).toEqual(
      (() => {
        const fresh = render(<FourColorRule colors={other} />);
        return legend(fresh.container);
      })(),
    );
    expect(screen.queryByRole('button', { name: /suggested colors/ })).toBeNull();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { chroma } from '@/shared/color/convert';

import { assignSixtyThirtyTen } from './roles';
import SixtyThirtyTen from './SixtyThirtyTen';

const PALETTE = ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#e63946'];

describe('assignSixtyThirtyTen', () => {
  it('returns null for an empty palette', () => {
    expect(assignSixtyThirtyTen([])).toBeNull();
  });

  it('gives the accent to the most vivid color and the dominant role to the calmest', () => {
    const roles = assignSixtyThirtyTen(PALETTE)!;
    expect(roles.accent).toBe('#e63946');
    expect(roles.dominant).toBe('#f1faee');
    expect(chroma(roles.accent)).toBeGreaterThan(chroma(roles.secondary));
    expect(chroma(roles.dominant)).toBeLessThanOrEqual(chroma(roles.secondary));
  });

  it('uses three different colors from the palette', () => {
    const roles = assignSixtyThirtyTen(PALETTE)!;
    expect(new Set([roles.dominant, roles.secondary, roles.accent]).size).toBe(3);
    [roles.dominant, roles.secondary, roles.accent].forEach((color) =>
      expect(PALETTE).toContain(color),
    );
  });

  it('chooses a secondary that contrasts with the dominant color', () => {
    const roles = assignSixtyThirtyTen(PALETTE)!;
    expect(roles.secondary).toBe('#1d3557');
  });

  it('works with a single color by padding the palette', () => {
    const roles = assignSixtyThirtyTen(['#3366cc'])!;
    expect(new Set([roles.dominant, roles.secondary, roles.accent]).size).toBe(3);
  });
});

describe('SixtyThirtyTen', () => {
  it('renders nothing for an empty palette', () => {
    const { container } = render(<SixtyThirtyTen colors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows a 60/30/10 bar with the three roles and two examples', () => {
    const { container } = render(<SixtyThirtyTen colors={PALETTE} />);
    const segments = [...container.querySelectorAll<HTMLElement>('.rule__segment')];
    expect(segments.map((s) => s.dataset.role)).toEqual(['dominant', 'secondary', 'accent']);
    expect(segments.map((s) => s.textContent)).toEqual(['60%', '30%', '10%']);
    expect(segments.map((s) => s.style.flexGrow)).toEqual(['60', '30', '10']);
    expect(
      [...container.querySelectorAll<HTMLElement>('[data-example]')].map(
        (el) => el.dataset.example,
      ),
    ).toEqual(['rule-landing', 'rule-poster']);
  });

  it('paints the examples with exactly the three rule colors', () => {
    const { container } = render(<SixtyThirtyTen colors={PALETTE} />);
    const roles = assignSixtyThirtyTen(PALETTE)!;
    container.querySelectorAll<HTMLElement>('svg').forEach((svg) => {
      const fills = new Set(
        [...svg.querySelectorAll<HTMLElement>('rect')].map((rect) => rect.getAttribute('fill')),
      );
      expect(fills).toEqual(new Set([roles.dominant, roles.secondary, roles.accent]));
    });
  });
});

describe('SixtyThirtyTen shuffle', () => {
  const legend = (container: HTMLElement) =>
    [...container.querySelectorAll('.rule__hex')].map((el) => el.textContent);
  const fills = (container: HTMLElement) =>
    [...container.querySelectorAll('svg')].map((svg) =>
      [...svg.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill')).join(),
    );
  const shuffleButton = () =>
    screen.getByRole('button', { name: 'Shuffle the colors in the 60-30-10 rule' });

  it('starts on the suggested colors, with no Suggested button', () => {
    render(<SixtyThirtyTen colors={PALETTE} />);
    expect(screen.queryByRole('button', { name: /suggested colors/ })).toBeNull();
  });

  it('changes the legend and every example when shuffled', async () => {
    const { container } = render(<SixtyThirtyTen colors={PALETTE} />);
    const before = { legend: legend(container), fills: fills(container) };
    await userEvent.click(shuffleButton());
    expect(legend(container)).not.toEqual(before.legend);
    expect(fills(container)).not.toEqual(before.fills);
  });

  it('keeps the legend and the examples in agreement after a shuffle', async () => {
    const { container } = render(<SixtyThirtyTen colors={PALETTE} />);
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
    const { container } = render(<SixtyThirtyTen colors={PALETTE} />);
    const before = legend(container);
    await userEvent.click(shuffleButton());
    await userEvent.click(screen.getByRole('button', { name: /Back to the suggested colors/ }));
    expect(legend(container)).toEqual(before);
    expect(screen.queryByRole('button', { name: /suggested colors/ })).toBeNull();
  });

  it('can be shuffled again and again', async () => {
    const { container } = render(<SixtyThirtyTen colors={PALETTE} />);
    for (let i = 0; i < 5; i += 1) {
      const before = legend(container);
      await userEvent.click(shuffleButton());
      expect(legend(container)).not.toEqual(before);
    }
  });

  it('forgets the shuffle when the palette changes', async () => {
    const { container, rerender } = render(<SixtyThirtyTen colors={PALETTE} />);
    await userEvent.click(shuffleButton());
    const other = ['#222222', '#dddddd', '#cc3300', '#33aa66'];
    rerender(<SixtyThirtyTen colors={other} />);
    expect(legend(container)).toEqual(
      (() => {
        const fresh = render(<SixtyThirtyTen colors={other} />);
        return legend(fresh.container);
      })(),
    );
    expect(screen.queryByRole('button', { name: /suggested colors/ })).toBeNull();
  });
});

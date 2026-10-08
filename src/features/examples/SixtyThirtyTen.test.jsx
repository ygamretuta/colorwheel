import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SixtyThirtyTen from './SixtyThirtyTen.jsx';
import { assignSixtyThirtyTen, chroma } from './roles.js';

const PALETTE = ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#e63946'];

describe('assignSixtyThirtyTen', () => {
  it('returns null for an empty palette', () => {
    expect(assignSixtyThirtyTen([])).toBeNull();
  });

  it('gives the accent to the most vivid color and the dominant role to the calmest', () => {
    const roles = assignSixtyThirtyTen(PALETTE);
    expect(roles.accent).toBe('#e63946');
    expect(roles.dominant).toBe('#f1faee');
    expect(chroma(roles.accent)).toBeGreaterThan(chroma(roles.secondary));
    expect(chroma(roles.dominant)).toBeLessThanOrEqual(chroma(roles.secondary));
  });

  it('uses three different colors from the palette', () => {
    const roles = assignSixtyThirtyTen(PALETTE);
    expect(new Set([roles.dominant, roles.secondary, roles.accent]).size).toBe(3);
    [roles.dominant, roles.secondary, roles.accent].forEach((color) => expect(PALETTE).toContain(color));
  });

  it('chooses a secondary that contrasts with the dominant color', () => {
    const roles = assignSixtyThirtyTen(PALETTE);
    expect(roles.secondary).toBe('#1d3557');
  });

  it('works with a single color by padding the palette', () => {
    const roles = assignSixtyThirtyTen(['#3366cc']);
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
    const segments = [...container.querySelectorAll('.rule__segment')];
    expect(segments.map((s) => s.dataset.role)).toEqual(['dominant', 'secondary', 'accent']);
    expect(segments.map((s) => s.textContent)).toEqual(['60%', '30%', '10%']);
    expect(segments.map((s) => s.style.flexGrow)).toEqual(['60', '30', '10']);
    expect([...container.querySelectorAll('[data-example]')].map((el) => el.dataset.example)).toEqual(['rule-landing', 'rule-poster']);
  });

  it('paints the examples with exactly the three rule colors', () => {
    const { container } = render(<SixtyThirtyTen colors={PALETTE} />);
    const roles = assignSixtyThirtyTen(PALETTE);
    container.querySelectorAll('svg').forEach((svg) => {
      const fills = new Set([...svg.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill')));
      expect(fills).toEqual(new Set([roles.dominant, roles.secondary, roles.accent]));
    });
  });
});

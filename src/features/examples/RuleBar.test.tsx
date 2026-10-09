import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RuleBar, { type RuleShare } from './RuleBar';

const SHARES: RuleShare[] = [
  { role: 'dominant', label: 'Dominant', percent: 60, color: '#f1faee', textColor: '#000000' },
  { role: 'secondary', label: 'Secondary', percent: 25, color: '#1d3557', textColor: '#ffffff' },
  { role: 'accent', label: 'Accent', percent: 10, color: '#e63946', textColor: '#000000' },
  { role: 'highlight', label: 'Highlight', percent: 5, color: '#a8dadc', textColor: '#000000' },
];

describe('RuleBar', () => {
  it('draws one segment per share, sized by its percent', () => {
    const { container } = render(<RuleBar shares={SHARES} />);
    const segments = [...container.querySelectorAll<HTMLElement>('.rule__segment')];
    expect(segments.map((s) => s.dataset.role)).toEqual([
      'dominant',
      'secondary',
      'accent',
      'highlight',
    ]);
    expect(segments.map((s) => s.style.flexGrow)).toEqual(['60', '25', '10', '5']);
    expect(segments.map((s) => s.textContent)).toEqual(['60%', '25%', '10%', '5%']);
  });

  it('paints each segment with its color and a readable text color', () => {
    const { container } = render(<RuleBar shares={SHARES} />);
    const [first, second] = [...container.querySelectorAll<HTMLElement>('.rule__segment')];
    expect(first.style.backgroundColor).toBe('rgb(241, 250, 238)');
    expect(first.style.color).toBe('rgb(0, 0, 0)');
    expect(second.style.color).toBe('rgb(255, 255, 255)');
  });

  it('lists every role with its percent and hex in a legend', () => {
    const { container } = render(<RuleBar shares={SHARES} />);
    const items = [...container.querySelectorAll('.rule__legend-item')].map((li) => li.textContent);
    expect(items).toEqual([
      'Dominant 60% #f1faee',
      'Secondary 25% #1d3557',
      'Accent 10% #e63946',
      'Highlight 5% #a8dadc',
    ]);
  });

  it('describes the proportions for assistive technology', () => {
    render(<RuleBar shares={SHARES} />);
    expect(
      screen.getByRole('img', {
        name: '60 percent dominant, 25 percent secondary, 10 percent accent, 5 percent highlight',
      }),
    ).toBeTruthy();
  });

  it('works with three shares too', () => {
    const { container } = render(<RuleBar shares={SHARES.slice(0, 3)} />);
    expect(container.querySelectorAll('.rule__segment')).toHaveLength(3);
    expect(container.querySelectorAll('.rule__legend-item')).toHaveLength(3);
  });
});

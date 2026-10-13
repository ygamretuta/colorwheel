import { render, screen, waitFor } from '@testing-library/react';
import { domAnimation, LazyMotion } from 'motion/react';
import { describe, expect, it } from 'vitest';

import { PointerHighlight } from './pointer-highlight';

describe('PointerHighlight', () => {
  it('keeps the highlighted text readable and in the flow of the sentence', () => {
    render(
      <p>
        About <PointerHighlight>60%</PointerHighlight> calm color.
      </p>,
    );
    expect(screen.getByText('60%').tagName).toBe('SPAN');
    expect(screen.getByText(/About/).textContent).toBe('About 60% calm color.');
  });

  it('adds a box and a pointer that assistive technology skips', () => {
    render(<PointerHighlight>60%</PointerHighlight>);
    const decoration = screen.getByText('60%').querySelectorAll('[aria-hidden="true"]');
    expect(decoration).toHaveLength(2);
  });

  it('draws the box and moves the pointer to its corner once in view', async () => {
    render(
      <LazyMotion features={domAnimation}>
        <PointerHighlight>60%</PointerHighlight>
      </LazyMotion>,
    );
    const [box, pointer] = [
      ...screen.getByText('60%').querySelectorAll<HTMLElement>('[aria-hidden="true"]'),
    ];
    await waitFor(
      () => {
        expect(parseFloat(box.style.width)).toBeCloseTo(100, 0);
        expect(parseFloat(pointer.style.left)).toBeCloseTo(100, 0);
      },
      { timeout: 3000 },
    );
    expect(parseFloat(box.style.height)).toBeCloseTo(100, 0);
    expect(parseFloat(pointer.style.top)).toBeCloseTo(100, 0);
  });
});

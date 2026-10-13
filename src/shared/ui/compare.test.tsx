import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Compare } from './compare';

const setup = () =>
  render(
    <Compare
      before={<span>old</span>}
      after={<span>new</span>}
      beforeLabel="Suggested"
      afterLabel="Shuffled"
      label="Compare the two"
    />,
  );
const slider = () => screen.getByRole('slider', { name: 'Compare the two' });

describe('Compare', () => {
  it('shows both versions and their labels', () => {
    setup();
    expect(screen.getByText('old')).toBeTruthy();
    expect(screen.getByText('new')).toBeTruthy();
    expect(screen.getByText('Suggested')).toBeTruthy();
    expect(screen.getByText('Shuffled')).toBeTruthy();
  });

  it('starts in the middle', () => {
    setup();
    expect(slider().getAttribute('aria-valuenow')).toBe('50');
    expect(slider().getAttribute('aria-valuetext')).toBe('50% Suggested');
  });

  it('moves with the arrow keys, in steps', async () => {
    setup();
    slider().focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(slider().getAttribute('aria-valuenow')).toBe('55');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(slider().getAttribute('aria-valuenow')).toBe('45');
  });

  it('jumps to the ends with Home and End, and never goes past them', async () => {
    setup();
    slider().focus();
    await userEvent.keyboard('{Home}{ArrowLeft}');
    expect(slider().getAttribute('aria-valuenow')).toBe('0');
    await userEvent.keyboard('{End}{ArrowRight}');
    expect(slider().getAttribute('aria-valuenow')).toBe('100');
  });

  it('clips the first version to the divider', async () => {
    setup();
    slider().focus();
    await userEvent.keyboard('{Home}');
    const clipped = screen.getByText('old').parentElement;
    expect(clipped?.style.clipPath).toBe('inset(0 100% 0 0)');
    await userEvent.keyboard('{End}');
    expect(clipped?.style.clipPath).toBe('inset(0 0% 0 0)');
  });

  it('follows a pointer drag across the frame', () => {
    setup();
    const frame = slider();
    frame.getBoundingClientRect = () =>
      ({ left: 100, width: 200, top: 0, height: 100, right: 300, bottom: 100 }) as DOMRect;
    frame.setPointerCapture = () => {};
    frame.hasPointerCapture = () => true;

    fireEvent.pointerDown(frame, { clientX: 250, pointerId: 1 });
    expect(frame.getAttribute('aria-valuenow')).toBe('75');
    fireEvent.pointerMove(frame, { clientX: 140, pointerId: 1 });
    expect(frame.getAttribute('aria-valuenow')).toBe('20');
    fireEvent.pointerMove(frame, { clientX: 900, pointerId: 1 });
    expect(frame.getAttribute('aria-valuenow')).toBe('100');
  });

  it('ignores pointer movement when no drag is in progress', () => {
    setup();
    const frame = slider();
    frame.getBoundingClientRect = () =>
      ({ left: 0, width: 200, top: 0, height: 100, right: 200, bottom: 100 }) as DOMRect;
    frame.hasPointerCapture = () => false;
    fireEvent.pointerMove(frame, { clientX: 10, pointerId: 1 });
    expect(frame.getAttribute('aria-valuenow')).toBe('50');
  });
});

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useShuffledRoles } from './useShuffledRoles';

/** Roles here are plain strings: the hook does not care what they are. */
const shuffle = vi.fn((colors: string[], current: string) => `${current}>${colors.join('')}`);

describe('useShuffledRoles', () => {
  it('starts with the suggested roles, not shuffled', () => {
    const { result } = renderHook(() => useShuffledRoles(['#a', '#b'], 'suggested', shuffle));
    expect(result.current.roles).toBe('suggested');
    expect(result.current.isShuffled).toBe(false);
  });

  it('shuffles from the roles on screen and reports it', () => {
    shuffle.mockClear();
    const { result } = renderHook(() => useShuffledRoles(['#a', '#b'], 'suggested', shuffle));
    act(() => {
      result.current.shuffle();
    });
    expect(shuffle).toHaveBeenCalledWith(['#a', '#b'], 'suggested');
    expect(result.current.roles).toBe('suggested>#a#b');
    expect(result.current.isShuffled).toBe(true);
  });

  it('feeds each shuffle the previous result, so it keeps moving on', () => {
    const { result } = renderHook(() => useShuffledRoles(['#a'], 'one', shuffle));
    act(() => {
      result.current.shuffle();
    });
    act(() => {
      result.current.shuffle();
    });
    expect(result.current.roles).toBe('one>#a>#a');
  });

  it('goes back to the suggested roles on reset', () => {
    const { result } = renderHook(() => useShuffledRoles(['#a'], 'suggested', shuffle));
    act(() => {
      result.current.shuffle();
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.roles).toBe('suggested');
    expect(result.current.isShuffled).toBe(false);
  });

  it('drops a shuffle when the palette changes, so it never shows colors that are gone', () => {
    const { result, rerender } = renderHook(
      ({ colors, suggested }) => useShuffledRoles(colors, suggested, shuffle),
      { initialProps: { colors: ['#a', '#b'], suggested: 'first' } },
    );
    act(() => {
      result.current.shuffle();
    });
    expect(result.current.isShuffled).toBe(true);

    rerender({ colors: ['#c', '#d'], suggested: 'second' });
    expect(result.current.isShuffled).toBe(false);
    expect(result.current.roles).toBe('second');
  });

  it('keeps a shuffle across re-renders with the same palette', () => {
    const { result, rerender } = renderHook(
      ({ colors }) => useShuffledRoles(colors, 'suggested', shuffle),
      { initialProps: { colors: ['#a', '#b'] } },
    );
    act(() => {
      result.current.shuffle();
    });
    rerender({ colors: ['#a', '#b'] });
    expect(result.current.isShuffled).toBe(true);
  });

  it('does nothing when there are no suggested roles (an empty palette)', () => {
    shuffle.mockClear();
    const { result } = renderHook(() => useShuffledRoles([], null, shuffle));
    act(() => {
      result.current.shuffle();
    });
    expect(shuffle).not.toHaveBeenCalled();
    expect(result.current.roles).toBeNull();
    expect(result.current.isShuffled).toBe(false);
  });
});

import { useState } from 'react';

interface Shuffled<T> {
  paletteKey: string;
  roles: T;
  /** Whether the suggested arrangement is shown next to the shuffled one. */
  comparing: boolean;
}

/**
 * Holds a shuffled arrangement of roles on top of the suggested one. A shuffle belongs to the palette it
 * was made for: if the palette changes, the suggested roles are back, so a shuffle never shows colors
 * that are no longer in the palette. Comparing belongs to the shuffle in the same way.
 */
export function useShuffledRoles<T>(
  colors: string[],
  suggested: T | null,
  shuffle: (colors: string[], current: T) => T,
) {
  const paletteKey = colors.join();
  const [state, setState] = useState<Shuffled<T> | null>(null);

  const current = state?.paletteKey === paletteKey ? state : null;
  const roles = current?.roles ?? suggested;

  return {
    /** The roles to show: the shuffled ones if there are any for this palette, else the suggested ones. */
    roles,
    /** The suggested roles, which stay available to compare against once shuffled. */
    suggested,
    isShuffled: current !== null,
    isComparing: current?.comparing ?? false,
    /** Draw a new arrangement, different from the one on screen. */
    shuffle: () => {
      if (roles) {
        setState({
          paletteKey,
          roles: shuffle(colors, roles),
          comparing: current?.comparing ?? false,
        });
      }
    },
    /** Show or hide the suggested arrangement next to the shuffled one. */
    toggleCompare: () => {
      setState((previous) =>
        previous?.paletteKey === paletteKey
          ? { ...previous, comparing: !previous.comparing }
          : previous,
      );
    },
    /** Go back to the suggested arrangement. */
    reset: () => {
      setState(null);
    },
  };
}

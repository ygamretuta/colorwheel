import { useState } from 'react';

/**
 * Holds a shuffled arrangement of roles on top of the suggested one. A shuffle belongs to the palette it
 * was made for: if the palette changes, the suggested roles are back, so a shuffle never shows colors
 * that are no longer in the palette.
 */
export function useShuffledRoles<T>(
  colors: string[],
  suggested: T | null,
  shuffle: (colors: string[], current: T) => T,
) {
  const paletteKey = colors.join();
  const [shuffled, setShuffled] = useState<{ paletteKey: string; roles: T } | null>(null);

  const current = shuffled?.paletteKey === paletteKey ? shuffled.roles : null;
  const roles = current ?? suggested;

  return {
    /** The roles to show: the shuffled ones if there are any for this palette, else the suggested ones. */
    roles,
    isShuffled: current !== null,
    /** Draw a new arrangement, different from the one on screen. */
    shuffle: () => {
      if (roles) setShuffled({ paletteKey, roles: shuffle(colors, roles) });
    },
    /** Go back to the suggested arrangement. */
    reset: () => {
      setShuffled(null);
    },
  };
}

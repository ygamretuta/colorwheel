import { useState } from 'react';
import './color-source.css';
import Swatches from '@/shared/components/Swatches';
import { Button } from '@/shared/ui/button';
import { randomSwatches } from './random-colors';

interface RandomColorsProps {
  activeHex?: string;
  onPick: (hex: string) => void;
}

/**
 * A row of random, clearly different colors to start from when there is no image yet. The set is
 * drawn once when the step loads and stays put; "Shuffle" draws a new one. Tap a color to use it.
 */
export default function RandomColors({ activeHex, onPick }: RandomColorsProps) {
  const [colors, setColors] = useState(() => randomSwatches());

  return (
    <section className="source__random" aria-label="Random colors">
      <div className="source__random-header">
        <h3 className="source__colors-title">Or start from a color</h3>
        <Button
          className="source__shuffle"
          variant="ghost"
          size="sm"
          aria-label="Shuffle random colors"
          onClick={() => setColors(randomSwatches())}
        >
          Shuffle
        </Button>
      </div>
      <Swatches colors={colors} activeHex={activeHex} onSelect={onPick} size="tile" />
    </section>
  );
}

import { useState } from 'react';
import './color-source.css';
import Swatches from '@/shared/components/Swatches';
import { MAX_PALETTE_COLORS } from '@/shared/palette-limit';
import { Button } from '@/shared/ui/button';

/** How many of the offered colors fit in the palette. */
export interface AddResult {
  added: number;
  total: number;
}

interface ExtractedColorsProps {
  colors: string[];
  activeHex?: string;
  onPick: (hex: string) => void;
  onAdd: (colors: string[]) => AddResult | undefined;
}

/**
 * Colors found in an image. Tapping one makes it the base color (`onPick`); the button adds them to the
 * palette (`onAdd(colors)`). The palette holds a few colors only, so with more than that the button adds the
 * most common ones, and `onAdd` reports how many fit as `{ added, total }`.
 */
export default function ExtractedColors({ colors, activeHex, onPick, onAdd }: ExtractedColorsProps) {
  const [result, setResult] = useState<AddResult | null>(null);

  return (
    <div className="source__colors">
      <p className="source__colors-title">Colors in this image</p>
      <Swatches colors={colors} activeHex={activeHex} onSelect={onPick} size="tile" />
      <Button
        className="source__button source__add"
        variant="outline"
        onClick={() => setResult(onAdd(colors) ?? { added: colors.length, total: colors.length })}
      >
        {label(colors.length, result)}
      </Button>
    </div>
  );
}

function label(count: number, result: AddResult | null): string {
  if (!result) return count > MAX_PALETTE_COLORS ? `Add top ${MAX_PALETTE_COLORS} to palette` : 'Add all to palette';
  if (result.added === 0) return 'Palette is full: remove a color first';
  if (result.added < result.total) return `Added ${result.added} of ${result.total} (palette holds ${MAX_PALETTE_COLORS}) ✓`;
  return 'Added to palette ✓';
}

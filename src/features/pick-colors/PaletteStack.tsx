import './pick-colors.css';

import { readableTextColor } from '@/shared/color/contrast';
import { MAX_PALETTE_COLORS } from '@/shared/palette-limit';

interface PaletteStackProps {
  colors: string[];
  onRemove: (hex: string) => void;
}

/**
 * A live preview of the palette: its colors stacked edge to edge in one bar with no borders between
 * them, followed by empty slots for the room that is left. Tap a color to remove it.
 */
export default function PaletteStack({ colors, onRemove }: PaletteStackProps) {
  const emptySlots = Math.max(0, MAX_PALETTE_COLORS - colors.length);

  return (
    <section className="stack" aria-label="Your palette">
      <h3 className="stack__title">
        {colors.length} of {MAX_PALETTE_COLORS} colors in your palette
      </h3>
      <div className="stack__bar">
        {colors.map((hex) => (
          <button
            key={hex}
            type="button"
            className="stack__segment"
            style={{ backgroundColor: hex, color: readableTextColor(hex) }}
            title={`Remove ${hex} from your palette`}
            data-hex={hex}
            onClick={() => onRemove(hex)}
          >
            <span className="stack__label">{hex}</span>
          </button>
        ))}
        {Array.from({ length: emptySlots }, (_, index) => (
          <div
            key={`empty-${index}`}
            className="stack__segment stack__segment--empty"
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="stack__hint">
        {colors.length > 0
          ? 'Tap a color to remove it.'
          : 'Pick colors above, or choose a pairing below.'}
      </p>
    </section>
  );
}

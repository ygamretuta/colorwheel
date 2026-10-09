import './palette.css';

import Swatches from '@/shared/components/Swatches';
import { Button } from '@/shared/ui/button';

import CopyCodesButton from './CopyCodesButton';

interface PaletteProps {
  colors: string[];
  onRemove: (hex: string) => void;
  onClear: () => void;
}

/** The colors the user has chosen from the harmonies; click one to remove it. */
export default function Palette({ colors, onRemove, onClear }: PaletteProps) {
  if (colors.length === 0) {
    return (
      <p className="palette__empty">
        Your palette is empty. Go back and pick colors or a pairing to add them here.
      </p>
    );
  }
  return (
    <div className="palette">
      <Swatches colors={colors} selected={colors} onSelect={onRemove} />
      <div className="palette__actions">
        {/* Keyed by the colors so the "Copied" state resets whenever the palette changes. */}
        <CopyCodesButton key={colors.join()} colors={colors} className="palette__button" />
        <Button className="palette__button" variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

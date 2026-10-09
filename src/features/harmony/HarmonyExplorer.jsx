import './harmony.css';
import Swatches from '@/shared/components/Swatches.jsx';
import { MAX_PALETTE_COLORS } from '@/shared/palette-limit.js';
import ColorWheel from './ColorWheel.jsx';
import HarmonySelector from './HarmonySelector.jsx';
import { generateHarmony } from './harmony.js';

/**
 * Wheel beside the harmony type, with swatches below; tapping a swatch toggles it in the palette.
 * `others` are the user's other chosen colors, shown as small dots on the wheel. `paletteCount` decides
 * whether the hint says the palette is full; `lockedColors` are swatches that can't be added because the palette is full.
 */
export default function HarmonyExplorer({ hex, harmony, onHarmonyChange, palette, onToggle, others = [], paletteCount = 0, lockedColors = [] }) {
  const colors = generateHarmony(hex, harmony);

  return (
    <div className="harmony">
      <div className="harmony__top">
        <ColorWheel colors={colors} others={others} />
        <div className="harmony__controls">
          <HarmonySelector value={harmony} onChange={onHarmonyChange} />
        </div>
      </div>
      <Swatches colors={colors} selected={palette} onSelect={onToggle} disabledColors={lockedColors} size="compact" />
      <p className="harmony__hint">
        {paletteCount >= MAX_PALETTE_COLORS ? 'Full: tap a ✓ color to swap it out.' : 'Tap a color to add it.'}
        {others.length > 0 && ' Small dots on the wheel are your other colors.'}
      </p>
    </div>
  );
}

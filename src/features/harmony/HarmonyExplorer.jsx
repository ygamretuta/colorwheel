import './harmony.css';
import Swatches from '@/shared/components/Swatches.jsx';
import ColorWheel from './ColorWheel.jsx';
import HarmonySelector from './HarmonySelector.jsx';
import { generateHarmony } from './harmony.js';

/** Wheel beside the harmony type, with swatches below; tapping a swatch toggles it in the palette. */
export default function HarmonyExplorer({ hex, harmony, onHarmonyChange, palette, onToggle }) {
  const colors = generateHarmony(hex, harmony);

  return (
    <div className="harmony">
      <div className="harmony__top">
        <ColorWheel colors={colors} />
        <div className="harmony__controls">
          <HarmonySelector value={harmony} onChange={onHarmonyChange} />
        </div>
      </div>
      <Swatches colors={colors} activeHex={hex} selected={palette} onSelect={onToggle} size="compact" />
      <p className="harmony__hint">Tap a color to add it to your palette.</p>
    </div>
  );
}

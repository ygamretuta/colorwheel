import type { HarmonyId } from '@/features/harmony/harmony';
import { useRef } from 'react';
import './pick-colors.css';
import HarmonyExplorer from '@/features/harmony/HarmonyExplorer';
import { generateHarmony } from '@/features/harmony/harmony';
import Suggestions from '@/features/suggestions/Suggestions';
import { scrollToIfNeeded } from '@/shared/dom/scroll';
import { MAX_PALETTE_COLORS } from '@/shared/palette-limit';
import PaletteStack from './PaletteStack';

interface PickColorsStepProps {
  hex: string;
  harmony: HarmonyId;
  onHarmonyChange: (id: HarmonyId) => void;
  context?: string[];
  pairing: string[];
  palette: string[];
  onTogglePick: (hex: string) => void;
  onChoosePairing: (colors: string[]) => void;
  onRemoveColor: (hex: string) => void;
}

/**
 * Harmony exploration and the single suggested pairing, together on one screen; both follow
 * `harmony`. `context` is the colors the user chose themselves (pairings are tailored to them).
 * `palette` is everything chosen so far, shown as a stacked preview under the wheel swatches; the
 * colors the wheel doesn't show also appear as small dots on the wheel. On short phones, picking a
 * swatch scrolls down to the pairings, and choosing a pairing scrolls down to the end of the step
 * so the Next button is in reach.
 */
export default function PickColorsStep({
  hex,
  harmony,
  onHarmonyChange,
  context = [],
  pairing,
  palette,
  onTogglePick,
  onChoosePairing,
  onRemoveColor,
}: PickColorsStepProps) {
  const harmonyColors = generateHarmony(hex, harmony);
  const full = palette.length >= MAX_PALETTE_COLORS;
  const lockedColors = full ? harmonyColors.filter((color) => !palette.includes(color)) : [];
  const carried = palette.filter((color) => !harmonyColors.includes(color));
  const pairingsRef = useRef(null);
  const endRef = useRef(null);

  return (
    <div className="pick-colors">
      <HarmonyExplorer
        hex={hex}
        harmony={harmony}
        onHarmonyChange={onHarmonyChange}
        palette={palette}
        others={carried}
        paletteCount={palette.length}
        lockedColors={lockedColors}
        onToggle={(color) => {
          onTogglePick(color);
          scrollToIfNeeded(pairingsRef.current);
        }}
      />
      <PaletteStack colors={palette} onRemove={onRemoveColor} />
      <div ref={pairingsRef} className="pick-colors__pairings">
        <Suggestions
          hex={hex}
          harmony={harmony}
          context={context}
          chosen={pairing}
          onChoose={(colors) => {
            onChoosePairing(colors);
            scrollToIfNeeded(endRef.current);
          }}
        />
      </div>
      <div ref={endRef} className="pick-colors__end" aria-hidden="true" />
    </div>
  );
}

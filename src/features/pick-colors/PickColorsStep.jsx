import { useRef } from 'react';
import './pick-colors.css';
import HarmonyExplorer from '@/features/harmony/HarmonyExplorer.jsx';
import Suggestions from '@/features/suggestions/Suggestions.jsx';
import { scrollToIfNeeded } from '@/shared/dom/scroll.js';

/**
 * Harmony exploration and the single suggested pairing, together on one screen; both follow `harmony`.
 * On short phones, picking a swatch scrolls down to the pairings, and choosing a pairing
 * scrolls down to the end of the step so the Next button is in reach.
 */
export default function PickColorsStep({ hex, harmony, onHarmonyChange, picks, pairing, onTogglePick, onChoosePairing }) {
  const pairingsRef = useRef(null);
  const endRef = useRef(null);

  return (
    <div className="pick-colors">
      <HarmonyExplorer
        hex={hex}
        harmony={harmony}
        onHarmonyChange={onHarmonyChange}
        palette={picks}
        onToggle={(color) => {
          onTogglePick(color);
          scrollToIfNeeded(pairingsRef.current);
        }}
      />
      <div ref={pairingsRef} className="pick-colors__pairings">
        <Suggestions
          hex={hex}
          harmony={harmony}
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

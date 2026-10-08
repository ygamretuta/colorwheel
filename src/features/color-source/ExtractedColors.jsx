import { useState } from 'react';
import './color-source.css';
import Swatches from '@/shared/components/Swatches.jsx';
import { Button } from '@/shared/ui/button.jsx';

/**
 * Colors found in an image. By default tapping one makes it the base color (`onPick`).
 * "Select multiple" switches the swatches to toggles so a subset can be sent to the
 * palette together; outside that mode the button adds every color. `onAdd(colors)`.
 */
export default function ExtractedColors({ colors, activeHex, onPick, onAdd }) {
  const [multi, setMulti] = useState(false);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null); // null | 'all' | number of colors just added

  const toggle = (hex) => {
    setResult(null);
    setSelected((current) => (current.includes(hex) ? current.filter((c) => c !== hex) : [...current, hex]));
  };
  const toggleMode = () => {
    setMulti((current) => !current);
    setSelected([]);
    setResult(null);
  };
  const addSelected = () => {
    onAdd(selected);
    setResult(selected.length);
    setSelected([]);
  };
  const addAll = () => {
    onAdd(colors);
    setResult('all');
  };

  return (
    <div className="source__colors">
      <div className="source__colors-header">
        <p className="source__colors-title">Colors in this image</p>
        <Button className="source__mode" variant="ghost" size="sm" aria-pressed={multi} onClick={toggleMode}>
          {multi ? 'Done selecting' : 'Select multiple'}
        </Button>
      </div>
      <Swatches
        colors={colors}
        activeHex={activeHex}
        selected={multi ? selected : undefined}
        onSelect={multi ? toggle : onPick}
        size="tile"
      />
      {multi && <p className="source__legend">Ring = current color · ✓ = selected</p>}
      {multi ? (
        <Button className="source__button source__add" disabled={selected.length === 0} onClick={addSelected}>
          {selected.length > 0 || result === null ? `Add selected (${selected.length}) to palette` : `Added ${result} to palette ✓`}
        </Button>
      ) : (
        <Button className="source__button source__add" variant="outline" onClick={addAll}>
          {result === 'all' ? 'Added to palette ✓' : 'Add all to palette'}
        </Button>
      )}
    </div>
  );
}

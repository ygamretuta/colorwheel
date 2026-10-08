import { useState } from 'react';
import './color-picker.css';
import { hexToHsl, hslToHex, normalizeHex } from '@/shared/color/convert.js';
import { Button } from '@/shared/ui/button.jsx';
import { Input } from '@/shared/ui/input.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover.jsx';

const SLIDERS = [
  { key: 'h', label: 'Hue', max: 360 },
  { key: 's', label: 'Saturation', max: 100 },
  { key: 'l', label: 'Lightness', max: 100 },
];

/** Gradient behind each slider so the track previews what dragging does. */
function trackGradient(key, { h, s, l }) {
  if (key === 'h') {
    return `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((deg) => hslToHex({ h: deg, s, l })).join(', ')})`;
  }
  if (key === 's') return `linear-gradient(to right, ${hslToHex({ h, s: 0, l })}, ${hslToHex({ h, s: 100, l })})`;
  return `linear-gradient(to right, #000000, ${hslToHex({ h, s, l: 50 })}, #ffffff)`;
}

/** Slider panel that edits a draft color; "Select" commits it and closes the panel. */
function SwatchPanel({ hex, onSelect }) {
  const [hsl, setHsl] = useState(() => hexToHsl(hex));
  const draftHex = hslToHex(hsl);

  return (
    <div className="color-panel">
      <div className="color-panel__preview" style={{ backgroundColor: draftHex }}>
        <span className="color-panel__hex">{draftHex}</span>
      </div>
      {SLIDERS.map(({ key, label, max }) => (
        <label key={key} className="color-panel__row">
          <span className="color-panel__label">{label}</span>
          <input
            className="color-panel__slider"
            type="range"
            min={0}
            max={max}
            step={1}
            value={Math.round(hsl[key])}
            style={{ backgroundImage: trackGradient(key, hsl) }}
            aria-label={label}
            onChange={(event) => setHsl((current) => ({ ...current, [key]: Number(event.target.value) }))}
          />
        </label>
      ))}
      <Button className="color-panel__select" onClick={() => onSelect(draftHex)}>Select</Button>
    </div>
  );
}

/** Swatch that opens a color panel, plus a hex text field; `onChange` gets a normalized hex. */
export default function ColorPicker({ hex, onChange }) {
  const [draft, setDraft] = useState(hex);
  const [syncedHex, setSyncedHex] = useState(hex);
  const [open, setOpen] = useState(false);

  if (hex !== syncedHex) {
    setSyncedHex(hex);
    // Leave the field alone when the change came from typing (e.g. "#e91" is already valid shorthand).
    if (normalizeHex(draft) !== hex) setDraft(hex);
  }

  return (
    <div className="color-picker">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="color-picker__swatch"
            style={{ backgroundColor: hex }}
            aria-label={`Pick a color, currently ${hex}`}
          />
        </PopoverTrigger>
        <PopoverContent className="color-panel__popover" align="start">
          {/* Remounts on open so the sliders always start from the current color. */}
          <SwatchPanel
            hex={hex}
            onSelect={(selected) => {
              onChange(selected);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <Input
        className="color-picker__hex"
        value={draft}
        maxLength={7}
        spellCheck={false}
        aria-label="Hex value"
        onChange={(e) => {
          setDraft(e.target.value);
          const normalized = normalizeHex(e.target.value);
          if (normalized) onChange(normalized);
        }}
        onBlur={() => setDraft(hex)}
      />
    </div>
  );
}

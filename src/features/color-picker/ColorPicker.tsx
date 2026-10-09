import { useState } from 'react';
import './color-picker.css';
import { hexToHsl, hslToHex, normalizeHex, type Hsl } from '@/shared/color/convert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

const SLIDERS: { key: keyof Hsl; label: string; max: number }[] = [
  { key: 'h', label: 'Hue', max: 360 },
  { key: 's', label: 'Saturation', max: 100 },
  { key: 'l', label: 'Lightness', max: 100 },
];

/** Gradient behind each slider so the track previews what dragging does. */
function trackGradient(key: keyof Hsl, { h, s, l }: Hsl): string {
  if (key === 'h') {
    return `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((deg) => hslToHex({ h: deg, s, l })).join(', ')})`;
  }
  if (key === 's')
    return `linear-gradient(to right, ${hslToHex({ h, s: 0, l })}, ${hslToHex({ h, s: 100, l })})`;
  return `linear-gradient(to right, #000000, ${hslToHex({ h, s, l: 50 })}, #ffffff)`;
}

interface SwatchPanelProps {
  hex: string;
  onSelect: (hex: string) => void;
}

/** Slider panel that edits a draft color; "Select" commits it and closes the panel. */
function SwatchPanel({ hex, onSelect }: SwatchPanelProps) {
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
            onChange={(event) =>
              setHsl((current) => ({ ...current, [key]: Number(event.target.value) }))
            }
          />
        </label>
      ))}
      <Button className="color-panel__select" onClick={() => onSelect(draftHex)}>
        Select
      </Button>
    </div>
  );
}

interface ColorPickerProps {
  hex: string;
  onChange: (hex: string) => void;
}

/**
 * One field for the current color: a dot showing it, the hex text to type into, and a "Fine-tune"
 * button that opens the slider panel. `onChange` gets a normalized hex.
 */
export default function ColorPicker({ hex, onChange }: ColorPickerProps) {
  const [draft, setDraft] = useState(hex);
  const [syncedHex, setSyncedHex] = useState(hex);
  const [open, setOpen] = useState(false);

  if (hex !== syncedHex) {
    setSyncedHex(hex);
    // Leave the field alone when the change came from typing (e.g. "#e91" is already valid
    // shorthand).
    if (normalizeHex(draft) !== hex) setDraft(hex);
  }

  return (
    <div className="color-picker">
      {/*
        The current color, shown once, as a dot: it is not a control, so nothing here competes with
        the swatches above.
      */}
      <span className="color-picker__dot" style={{ backgroundColor: hex }} aria-hidden="true" />
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            className="color-picker__tune"
            variant="ghost"
            size="sm"
            aria-label="Fine-tune color"
          >
            Fine-tune
          </Button>
        </PopoverTrigger>
        <PopoverContent className="color-panel__popover" align="end">
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
    </div>
  );
}

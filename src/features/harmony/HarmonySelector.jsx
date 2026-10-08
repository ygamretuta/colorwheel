import { useId } from 'react';
import { Label } from '@/shared/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select.jsx';
import { HARMONIES } from './harmony.js';

export default function HarmonySelector({ value, onChange }) {
  const id = useId();
  return (
    <>
      <Label className="harmony__label" htmlFor={id}>Wheel type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="harmony__select w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(HARMONIES).map(([id, { label }]) => (
            <SelectItem key={id} value={id}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="harmony__description">{HARMONIES[value].description}</p>
    </>
  );
}

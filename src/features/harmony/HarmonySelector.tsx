import type { HarmonyId } from './harmony';
import { useId } from 'react';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { HARMONIES } from './harmony';

interface HarmonySelectorProps {
  value: HarmonyId;
  onChange: (id: HarmonyId) => void;
}

export default function HarmonySelector({ value, onChange }: HarmonySelectorProps) {
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

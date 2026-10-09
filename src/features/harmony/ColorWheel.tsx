import './harmony.css';
import { useEffect, useRef } from 'react';
import { drawWheel } from './draw-wheel';

interface ColorWheelProps {
  colors: string[];
  others?: string[];
}

export default function ColorWheel({ colors, others = [] }: ColorWheelProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawWheel(ref.current, colors, others);
  }, [colors, others]);
  return <canvas ref={ref} className="harmony__wheel" width="240" height="240" aria-label={others.length ? "Color wheel showing the selected harmony and your other chosen colors" : "Color wheel showing the selected harmony"} />;
}

import { cn } from 'cn';
import { GripVertical } from 'lucide-react';
import * as React from 'react';

interface CompareProps {
  /** Shown on the left of the divider. */
  before: React.ReactNode;
  /** Shown on the right of the divider; it sets the size of the whole component. */
  after: React.ReactNode;
  beforeLabel: string;
  afterLabel: string;
  /** Accessible name of the slider. */
  label: string;
  className?: string;
}

const KEY_STEP = 5;
const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Two versions of the same thing split by a draggable divider (Aceternity "Compare"). The divider is a
 * real slider: drag it, or focus it and use the arrow keys, Home and End.
 */
export function Compare({
  before,
  after,
  beforeLabel,
  afterLabel,
  label,
  className,
}: CompareProps) {
  const frame = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState(50);

  const moveTo = (clientX: number) => {
    const box = frame.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    setPosition(clamp(((clientX - box.left) / box.width) * 100));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowLeft: position - KEY_STEP,
      ArrowRight: position + KEY_STEP,
      Home: 0,
      End: 100,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    setPosition(clamp(keys[event.key]));
  };

  return (
    <div
      ref={frame}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      aria-valuetext={`${Math.round(position)}% ${beforeLabel}`}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        moveTo(event.clientX);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) moveTo(event.clientX);
      }}
      className={cn(
        'relative touch-pan-y overflow-hidden rounded-[inherit] outline-none select-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
    >
      {after}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${String(100 - position)}% 0 0)` }}
      >
        {before}
      </div>

      <span className="pointer-events-none absolute top-1 left-1 rounded bg-background/85 px-1 text-[10px] leading-4 font-medium text-foreground">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute top-1 right-1 rounded bg-background/85 px-1 text-[10px] leading-4 font-medium text-foreground">
        {afterLabel}
      </span>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.25)]"
        style={{ left: `${String(position)}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow">
          <GripVertical className="size-4" />
        </span>
      </span>
    </div>
  );
}

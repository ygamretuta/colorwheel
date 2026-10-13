import { cn } from 'cn';
import * as React from 'react';

interface GlareCardProps {
  children: React.ReactNode;
  className?: string;
}

const TILT_DEGREES = 6;

/**
 * Tilts slightly toward the pointer and shows a soft sheen under it (Aceternity "Glare Card"). Mouse
 * and pen only: touch input never triggers it, so it cannot get in the way of scrolling.
 */
export function GlareCard({ children, className }: GlareCardProps) {
  const card = React.useRef<HTMLDivElement>(null);

  const follow = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = card.current;
    if (!element || event.pointerType === 'touch') return;
    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    element.style.setProperty('--glare-x', `${x * 100}%`);
    element.style.setProperty('--glare-y', `${y * 100}%`);
    element.style.setProperty('--tilt-x', `${(0.5 - y) * TILT_DEGREES}deg`);
    element.style.setProperty('--tilt-y', `${(x - 0.5) * TILT_DEGREES}deg`);
  };

  const settle = () => {
    for (const name of ['--glare-x', '--glare-y', '--tilt-x', '--tilt-y']) {
      card.current?.style.removeProperty(name);
    }
  };

  return (
    <div className="[perspective:700px]">
      <div
        ref={card}
        onPointerMove={follow}
        onPointerLeave={settle}
        className={cn(
          'group/glare relative overflow-hidden rounded-[inherit] transition-transform duration-200 ease-out',
          '[transform:rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))] motion-reduce:transform-none',
          className,
        )}
      >
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/glare:opacity-100 motion-reduce:hidden [background:radial-gradient(circle_at_var(--glare-x,50%)_var(--glare-y,50%),rgb(255_255_255/0.38),transparent_60%)]"
        />
      </div>
    </div>
  );
}

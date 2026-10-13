import { cn } from 'cn';
import { m, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface PointerHighlightProps {
  children: ReactNode;
  className?: string;
}

/**
 * Draws a box around a word and "points" at its corner as it scrolls into view (Aceternity "Pointer
 * Highlight"). It plays once; the finished box and pointer stay put. With reduced motion there is no
 * drawing, only the finished box.
 */
export function PointerHighlight({ children, className }: PointerHighlightProps) {
  const reduceMotion = useReducedMotion();
  const once = { once: true, amount: 'all' as const };

  return (
    <span className={cn('relative inline-block px-0.5', className)}>
      {children}
      <m.span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 size-full rounded-sm border border-current"
        initial={reduceMotion ? false : { width: '0%', height: '0%' }}
        whileInView={{ width: '100%', height: '100%' }}
        viewport={once}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
      <m.span
        aria-hidden
        className="pointer-events-none absolute top-full left-full size-3 translate-x-0.5 translate-y-0.5"
        initial={reduceMotion ? false : { left: '0%', top: '0%', opacity: 0 }}
        whileInView={{ left: '100%', top: '100%', opacity: 1 }}
        viewport={once}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 16 16" className="size-full -rotate-90 fill-current">
          <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
        </svg>
      </m.span>
    </span>
  );
}

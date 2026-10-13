import type { ReactNode } from 'react';

import { Compare } from '@/shared/ui/compare';

interface RuleFigureProps {
  caption: string;
  /** What the figure is called to a screen reader while comparing. */
  name: string;
  isComparing: boolean;
  /** The example painted with the suggested colors. */
  suggested: ReactNode;
  /** The example painted with the colors on screen (shuffled or not). */
  shown: ReactNode;
}

/** One example in a rule section: the art with its caption, or a slider between suggested and shuffled. */
export default function RuleFigure({
  caption,
  name,
  isComparing,
  suggested,
  shown,
}: RuleFigureProps) {
  return (
    <figure className="examples__figure">
      {isComparing ? (
        <Compare
          before={suggested}
          after={shown}
          beforeLabel="Suggested"
          afterLabel="Shuffled"
          label={`Compare suggested and shuffled colors in the ${name}`}
        />
      ) : (
        shown
      )}
      <figcaption className="examples__caption">{caption}</figcaption>
    </figure>
  );
}

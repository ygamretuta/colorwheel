import type { Block, Role } from './layouts';

interface BlocksProps<R extends Role> {
  rects: Block<R>[];
  colors: Record<R, string>;
}

/** The colored blocks of an example layout, drawn over its dominant-colored background. */
export default function Blocks<R extends Role>({ rects, colors }: BlocksProps<R>) {
  return rects.map(({ role, ...box }) => (
    <rect key={`${role}-${box.x}-${box.y}`} {...box} fill={colors[role]} />
  ));
}

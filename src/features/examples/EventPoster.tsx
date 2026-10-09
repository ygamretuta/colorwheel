import type { Roles } from './roles';
interface EventPosterProps {
  roles: Roles;
}

/** Bold geometric festival poster (graphic design) drawn with the palette roles. */
export default function EventPoster({ roles }: EventPosterProps) {
  const cell = 66;
  const tiles = [
    { x: 0, y: 0, color: roles.dark, d: `M0 ${cell} A${cell} ${cell} 0 0 1 ${cell} 0 V${cell} Z` },
    { x: 1, y: 0, color: roles.accent, d: `M0 0 H${cell} V${cell} A${cell} ${cell} 0 0 1 0 0 Z` },
    { x: 2, y: 0, color: roles.mid, d: `M0 0 A${cell} ${cell} 0 0 1 ${cell} ${cell} H0 Z` },
    {
      x: 0,
      y: 1,
      color: roles.accent,
      d: `M0 ${cell / 2} a${cell / 2} ${cell / 2} 0 1 0 ${cell} 0 a${cell / 2} ${cell / 2} 0 1 0 ${-cell} 0 Z`,
    },
    { x: 1, y: 1, color: roles.dark, d: `M0 0 H${cell} L0 ${cell} Z` },
    {
      x: 2,
      y: 1,
      color: roles.dark,
      d: `M${cell} 0 V${cell} H0 A${cell} ${cell} 0 0 1 ${cell} 0 Z`,
    },
  ];
  return (
    <svg
      viewBox="0 0 200 300"
      role="img"
      aria-label="Event poster in your palette"
      className="examples__art"
    >
      <rect width="200" height="300" fill={roles.light} />
      {tiles.map((tile) => (
        <path
          key={`${tile.x}-${tile.y}`}
          d={tile.d}
          fill={tile.color}
          transform={`translate(${1 + tile.x * cell} ${8 + tile.y * cell})`}
        />
      ))}
      <rect x="1" y="150" width="198" height="2" fill={roles.onLight} opacity="0.2" />
      <text x="10" y="196" fontSize="30" fontWeight="900" fill={roles.onLight}>
        FORM &amp;
      </text>
      <text x="10" y="226" fontSize="30" fontWeight="900" fill={roles.accent}>
        COLOR
      </text>
      <text x="10" y="248" fontSize="9" letterSpacing="3" fill={roles.onLight}>
        DESIGN FESTIVAL 2026
      </text>
      <rect x="10" y="262" width="62" height="18" rx="9" fill={roles.dark} />
      <text
        x="41"
        y="274"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        letterSpacing="1"
        fill={roles.onDark}
      >
        12–14 OCT
      </text>
    </svg>
  );
}

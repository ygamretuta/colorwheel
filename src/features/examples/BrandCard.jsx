/** Business cards (back and front) with a logo mark, drawn with the palette roles. */
export default function BrandCard({ roles }) {
  return (
    <svg viewBox="0 0 200 300" role="img" aria-label="Business cards in your palette" className="examples__art">
      <rect width="200" height="300" fill={roles.mid} />
      <g transform="rotate(-8 100 90)">
        <rect x="24" y="44" width="152" height="92" rx="6" fill={roles.dark} />
        <circle cx="100" cy="86" r="18" fill={roles.accent} />
        <path d="M82 86 a18 18 0 0 0 36 0 Z" fill={roles.light} />
        <text x="100" y="122" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="3" fill={roles.onDark}>ATELIER NOVA</text>
      </g>
      <g transform="rotate(5 100 210)">
        <rect x="24" y="166" width="152" height="92" rx="6" fill={roles.light} />
        <rect x="24" y="166" width="8" height="92" rx="2" fill={roles.accent} />
        <text x="44" y="194" fontSize="11" fontWeight="800" fill={roles.onLight}>Alex Rivera</text>
        <text x="44" y="206" fontSize="7" letterSpacing="1" fill={roles.accent}>COLOR DIRECTOR</text>
        <text x="44" y="236" fontSize="6.5" fill={roles.onLight} opacity="0.75">alex@ateliernova.studio</text>
        <text x="44" y="246" fontSize="6.5" fill={roles.onLight} opacity="0.75">+1 555 010 2026</text>
      </g>
    </svg>
  );
}

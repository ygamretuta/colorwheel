import { useId } from 'react';

/** Landscape-at-dusk movie poster drawn with the palette roles. */
export default function MoviePoster({ roles }) {
  const sky = useId();
  return (
    <svg viewBox="0 0 200 300" role="img" aria-label="Movie poster in your palette" className="examples__art">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={roles.dark} />
          <stop offset="1" stopColor={roles.mid} />
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill={`url(#${sky})`} />
      <circle cx="100" cy="112" r="44" fill={roles.light} />
      <circle cx="100" cy="112" r="44" fill={roles.accent} opacity="0.35" />
      <path d="M0 196 L48 148 L88 190 L136 140 L200 200 V300 H0Z" fill={roles.mid} />
      <path d="M0 232 L58 192 L116 238 L200 200 V300 H0Z" fill={roles.accent} />
      <rect y="228" width="200" height="72" fill={roles.dark} />
      <text x="100" y="22" textAnchor="middle" fontSize="8" letterSpacing="3" fill={roles.light} opacity="0.85">A FILM BY NOVA STUDIO</text>
      <text x="100" y="256" textAnchor="middle" fontSize="19" fontWeight="800" letterSpacing="1.5" fill={roles.onDark}>NIGHT HORIZON</text>
      <text x="100" y="272" textAnchor="middle" fontSize="8" letterSpacing="2" fill={roles.accent}>THE LAST LIGHT OF SUMMER</text>
      <text x="100" y="288" textAnchor="middle" fontSize="6" letterSpacing="1" fill={roles.onDark} opacity="0.7">IN THEATERS THIS AUTUMN</text>
    </svg>
  );
}

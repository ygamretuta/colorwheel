/** Flat-lay style outfit on a neutral mannequin, colored from the palette roles. */
export default function FashionLook({ roles }) {
  return (
    <svg viewBox="0 0 200 300" role="img" aria-label="Fashion outfit in your palette" className="examples__art">
      <rect width="200" height="300" fill={roles.light} />
      <circle cx="100" cy="150" r="104" fill={roles.mid} opacity="0.35" />
      {/* mannequin */}
      <circle cx="100" cy="46" r="15" fill="#d9d4cf" />
      <rect x="94" y="58" width="12" height="14" fill="#d9d4cf" />
      {/* trousers */}
      <path d="M70 156 H130 L136 268 H106 L100 192 L94 268 H64 Z" fill={roles.mid} />
      {/* inner top */}
      <path d="M72 76 H128 L132 160 H68 Z" fill={roles.accent} />
      {/* jacket: two panels with an open front */}
      <path d="M72 72 L52 84 L46 168 H80 L88 76 Z" fill={roles.dark} />
      <path d="M128 72 L148 84 L154 168 H120 L112 76 Z" fill={roles.dark} />
      <path d="M88 76 L100 100 L112 76" fill="none" stroke={roles.onDark} strokeWidth="1.5" opacity="0.6" />
      {/* shoes */}
      <ellipse cx="78" cy="274" rx="19" ry="7" fill={roles.dark} />
      <ellipse cx="122" cy="274" rx="19" ry="7" fill={roles.dark} />
      {/* bag */}
      <path d="M44 160 C44 140 74 140 74 160" fill="none" stroke={roles.dark} strokeWidth="2" />
      <rect x="38" y="160" width="42" height="30" rx="4" fill={roles.accent} />
      <rect x="38" y="166" width="42" height="3" fill={roles.onAccent} opacity="0.4" />
      <text x="100" y="294" textAnchor="middle" fontSize="7" letterSpacing="2" fill={roles.onLight} opacity="0.7">AUTUMN LOOK 01</text>
    </svg>
  );
}

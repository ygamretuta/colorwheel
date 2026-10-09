import type { Block } from './layouts';
import type { RuleRoles } from './roles';
import './examples.css';
import { CANVAS, LANDING_RECTS, POSTER_RECTS } from './layouts';
import { assignSixtyThirtyTen } from './roles';

type RuleRole = 'dominant' | 'secondary' | 'accent';

const SHARES: { role: RuleRole; label: string; percent: number }[] = [
  { role: 'dominant', label: 'Dominant', percent: 60 },
  { role: 'secondary', label: 'Secondary', percent: 30 },
  { role: 'accent', label: 'Accent', percent: 10 },
];

interface BlocksProps {
  rects: Block[];
  colors: RuleRoles;
}

/** The text color that reads on each role's color. */
const TEXT_ON: Record<RuleRole, 'onDominant' | 'onSecondary' | 'onAccent'> = {
  dominant: 'onDominant',
  secondary: 'onSecondary',
  accent: 'onAccent',
};

function Blocks({ rects, colors }: BlocksProps) {
  return rects.map(({ role, ...box }) => (
    <rect key={`${role}-${box.x}-${box.y}`} {...box} fill={colors[role]} />
  ));
}

interface ExampleProps {
  colors: RuleRoles;
}

/** A website screen: a calm background, a contrasting header and footer, one vivid button. */
function LandingExample({ colors }: ExampleProps) {
  return (
    <svg
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      role="img"
      aria-label="Website screen following the 60-30-10 rule"
      className="examples__art"
    >
      <rect {...CANVAS} fill={colors.dominant} />
      <Blocks rects={LANDING_RECTS} colors={colors} />
      <text x="14" y="25" fontSize="11" fontWeight="800" fill={colors.onSecondary}>
        nova
      </text>
      {[120, 142, 164].map((x) => (
        <line
          key={x}
          x1={x}
          y1="20"
          x2={x + 16}
          y2="20"
          stroke={colors.onSecondary}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
      ))}
      <text x="20" y="92" fontSize="19" fontWeight="800" fill={colors.onDominant}>
        Design with
      </text>
      <text x="20" y="114" fontSize="19" fontWeight="800" fill={colors.onDominant}>
        confidence.
      </text>
      {[136, 146, 156].map((y, i) => (
        <line
          key={y}
          x1="20"
          y1={y}
          x2={i === 2 ? 110 : 160}
          y2={y}
          stroke={colors.onDominant}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.25"
        />
      ))}
      <text
        x="100"
        y="190"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        letterSpacing="1"
        fill={colors.onAccent}
      >
        GET STARTED
      </text>
      <text x="20" y="280" fontSize="7" fill={colors.onSecondary} opacity="0.8">
        © 2026 Nova Studio · Privacy · Terms
      </text>
    </svg>
  );
}

/** A menu poster: a banded layout with a single accent price tag and stripe. */
function PosterExample({ colors }: ExampleProps) {
  return (
    <svg
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      role="img"
      aria-label="Poster following the 60-30-10 rule"
      className="examples__art"
    >
      <rect {...CANVAS} fill={colors.dominant} />
      <Blocks rects={POSTER_RECTS} colors={colors} />
      <text
        x="100"
        y="62"
        textAnchor="middle"
        fontSize="26"
        fontWeight="900"
        fill={colors.onDominant}
      >
        FRESH
      </text>
      <text
        x="100"
        y="92"
        textAnchor="middle"
        fontSize="26"
        fontWeight="900"
        fill={colors.onDominant}
      >
        ROAST
      </text>
      <text
        x="100"
        y="140"
        textAnchor="middle"
        fontSize="8"
        letterSpacing="3"
        fill={colors.onSecondary}
        opacity="0.85"
      >
        SINGLE ORIGIN
      </text>
      <text
        x="100"
        y="168"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill={colors.onSecondary}
      >
        Ethiopia Guji
      </text>
      <text
        x="100"
        y="186"
        textAnchor="middle"
        fontSize="8"
        fill={colors.onSecondary}
        opacity="0.8"
      >
        Small batch · Medium roast
      </text>
      <text x="16" y="236" fontSize="9" fontWeight="700" fill={colors.onDominant}>
        Open daily
      </text>
      <text x="16" y="248" fontSize="9" fill={colors.onDominant} opacity="0.7">
        7am – 5pm
      </text>
      <text
        x="160"
        y="238"
        textAnchor="middle"
        fontSize="20"
        fontWeight="900"
        fill={colors.onAccent}
      >
        $4
      </text>
      <text
        x="160"
        y="250"
        textAnchor="middle"
        fontSize="6"
        letterSpacing="1"
        fill={colors.onAccent}
      >
        PER CUP
      </text>
    </svg>
  );
}

interface SixtyThirtyTenProps {
  colors: string[];
}

/** Teaches and demonstrates the 60-30-10 rule using the final palette. */
export default function SixtyThirtyTen({ colors }: SixtyThirtyTenProps) {
  const assigned = assignSixtyThirtyTen(colors);
  if (!assigned) return null;

  return (
    <section className="examples rule" aria-label="The 60-30-10 rule">
      <h3 className="examples__title">The 60-30-10 rule</h3>
      <p className="rule__lead">
        A balanced design is about 60% one calm color, 30% a second that contrasts with it, and 10%
        a bold accent.
      </p>

      <div
        className="rule__bar"
        role="img"
        aria-label="60 percent dominant, 30 percent secondary, 10 percent accent"
      >
        {SHARES.map(({ role, percent }) => (
          <div
            key={role}
            className="rule__segment"
            data-role={role}
            style={{
              flexGrow: percent,
              backgroundColor: assigned[role],
              color: assigned[TEXT_ON[role]],
            }}
          >
            {percent}%
          </div>
        ))}
      </div>
      <ul className="rule__legend">
        {SHARES.map(({ role, label, percent }) => (
          <li key={role} className="rule__legend-item">
            <span className="rule__dot" style={{ backgroundColor: assigned[role] }} />
            <span>
              {label} {percent}% <code className="rule__hex">{assigned[role]}</code>
            </span>
          </li>
        ))}
      </ul>

      <ul className="examples__list rule__examples">
        <li className="examples__item" data-example="rule-landing">
          <figure className="examples__figure">
            <LandingExample colors={assigned} />
            <figcaption className="examples__caption">Website screen</figcaption>
          </figure>
        </li>
        <li className="examples__item" data-example="rule-poster">
          <figure className="examples__figure">
            <PosterExample colors={assigned} />
            <figcaption className="examples__caption">Menu poster</figcaption>
          </figure>
        </li>
      </ul>
    </section>
  );
}

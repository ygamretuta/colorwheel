import './examples.css';

import Blocks from './Blocks';
import { CANVAS, FOUR_LANDING_RECTS, FOUR_POSTER_RECTS } from './layouts';
import type { FourColorRoles } from './roles';
import { assignFourColor } from './roles';
import RuleBar, { type RuleShare } from './RuleBar';

/** The four colors and how much of a design each should cover. */
function sharesFor(colors: FourColorRoles): RuleShare[] {
  return [
    {
      role: 'dominant',
      label: 'Dominant',
      percent: 60,
      color: colors.dominant,
      textColor: colors.onDominant,
    },
    {
      role: 'secondary',
      label: 'Secondary',
      percent: 25,
      color: colors.secondary,
      textColor: colors.onSecondary,
    },
    {
      role: 'accent',
      label: 'Accent',
      percent: 10,
      color: colors.accent,
      textColor: colors.onAccent,
    },
    {
      role: 'highlight',
      label: 'Highlight',
      percent: 5,
      color: colors.highlight,
      textColor: colors.onHighlight,
    },
  ];
}

interface ExampleProps {
  colors: FourColorRoles;
}

/** A website screen: a calm background, a contrasting header and footer, a vivid button, a tiny "new" badge. */
function LandingExample({ colors }: ExampleProps) {
  return (
    <svg
      viewBox={`0 0 ${CANVAS.width.toString()} ${CANVAS.height.toString()}`}
      role="img"
      aria-label="Website screen following the four-color rule"
      className="examples__art"
    >
      <rect {...CANVAS} fill={colors.dominant} />
      <Blocks rects={FOUR_LANDING_RECTS} colors={colors} />
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
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        letterSpacing="1"
        fill={colors.onHighlight}
      >
        NEW
      </text>
      <text x="20" y="112" fontSize="19" fontWeight="800" fill={colors.onDominant}>
        Design with
      </text>
      <text x="20" y="134" fontSize="19" fontWeight="800" fill={colors.onDominant}>
        confidence.
      </text>
      {[154, 164, 174].map((y, i) => (
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
        y="209"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        letterSpacing="1"
        fill={colors.onAccent}
      >
        GET STARTED
      </text>
      <text x="20" y="285" fontSize="7" fill={colors.onSecondary} opacity="0.8">
        © 2026 Nova Studio · Privacy · Terms
      </text>
    </svg>
  );
}

/** A menu poster: a banded layout with an accent price tag and stripe, and a small highlight ribbon. */
function PosterExample({ colors }: ExampleProps) {
  return (
    <svg
      viewBox={`0 0 ${CANVAS.width.toString()} ${CANVAS.height.toString()}`}
      role="img"
      aria-label="Poster following the four-color rule"
      className="examples__art"
    >
      <rect {...CANVAS} fill={colors.dominant} />
      <Blocks rects={FOUR_POSTER_RECTS} colors={colors} />
      <text x="14" y="33" fontSize="9" fontWeight="800" letterSpacing="2" fill={colors.onHighlight}>
        NEW ROAST
      </text>
      <text
        x="100"
        y="76"
        textAnchor="middle"
        fontSize="26"
        fontWeight="900"
        fill={colors.onDominant}
      >
        FRESH
      </text>
      <text
        x="100"
        y="104"
        textAnchor="middle"
        fontSize="26"
        fontWeight="900"
        fill={colors.onDominant}
      >
        ROAST
      </text>
      <text
        x="100"
        y="132"
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
        y="156"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill={colors.onSecondary}
      >
        Ethiopia Guji
      </text>
      <text
        x="100"
        y="174"
        textAnchor="middle"
        fontSize="8"
        fill={colors.onSecondary}
        opacity="0.8"
      >
        Small batch · Medium roast
      </text>
      <text x="16" y="222" fontSize="9" fontWeight="700" fill={colors.onDominant}>
        Open daily
      </text>
      <text x="16" y="234" fontSize="9" fill={colors.onDominant} opacity="0.7">
        7am – 5pm
      </text>
      <text
        x="160"
        y="228"
        textAnchor="middle"
        fontSize="20"
        fontWeight="900"
        fill={colors.onAccent}
      >
        $4
      </text>
      <text
        x="160"
        y="240"
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

interface FourColorRuleProps {
  colors: string[];
}

/**
 * Teaches and demonstrates the four-color rule (60-25-10-5) using the final palette. Not a standard
 * rule like 60-30-10, but a common way to extend it: taper the shares so each color has a clear job.
 */
export default function FourColorRule({ colors }: FourColorRuleProps) {
  const assigned = assignFourColor(colors);
  if (!assigned) return null;

  return (
    <section className="examples rule" aria-label="The four-color rule">
      <h3 className="examples__title">The four-color rule: 60-25-10-5</h3>
      <p className="rule__lead">
        With four colors, taper the shares: about 60% a calm dominant, 25% a contrasting secondary,
        10% a bold accent, and just 5% a highlight for the smallest touches.
      </p>

      <RuleBar shares={sharesFor(assigned)} />

      <ul className="examples__list rule__examples">
        <li className="examples__item" data-example="four-landing">
          <figure className="examples__figure">
            <LandingExample colors={assigned} />
            <figcaption className="examples__caption">Website screen</figcaption>
          </figure>
        </li>
        <li className="examples__item" data-example="four-poster">
          <figure className="examples__figure">
            <PosterExample colors={assigned} />
            <figcaption className="examples__caption">Menu poster</figcaption>
          </figure>
        </li>
      </ul>
    </section>
  );
}

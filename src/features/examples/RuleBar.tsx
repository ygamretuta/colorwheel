import './examples.css';

export interface RuleShare {
  role: string;
  label: string;
  percent: number;
  color: string;
  /** A text color that reads on `color`. */
  textColor: string;
}

interface RuleBarProps {
  shares: RuleShare[];
}

/** A bar split in proportion to each color's share, with a legend giving each role, percent and hex. */
export default function RuleBar({ shares }: RuleBarProps) {
  const summary = shares
    .map(({ percent, role }) => `${percent.toString()} percent ${role}`)
    .join(', ');

  return (
    <>
      <div className="rule__bar" role="img" aria-label={summary}>
        {shares.map(({ role, percent, color, textColor }) => (
          <div
            key={role}
            className="rule__segment"
            data-role={role}
            style={{ flexGrow: percent, backgroundColor: color, color: textColor }}
          >
            {percent}%
          </div>
        ))}
      </div>
      <ul className="rule__legend">
        {shares.map(({ role, label, percent, color }) => (
          <li key={role} className="rule__legend-item">
            <span className="rule__dot" style={{ backgroundColor: color }} />
            <span>
              {label} {percent}% <code className="rule__hex">{color}</code>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

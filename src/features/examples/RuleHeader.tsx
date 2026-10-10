import './examples.css';

import { Button } from '@/shared/ui/button';

interface RuleHeaderProps {
  title: string;
  /** How the rule is named in button labels, e.g. "60-30-10 rule". */
  ruleName: string;
  isShuffled: boolean;
  onShuffle: () => void;
  onReset: () => void;
}

/** A rule section's heading, with Shuffle (new colors for each role) and, once shuffled, Suggested. */
export default function RuleHeader({
  title,
  ruleName,
  isShuffled,
  onShuffle,
  onReset,
}: RuleHeaderProps) {
  return (
    <div className="rule__header">
      <h3 className="examples__title">{title}</h3>
      <div className="rule__actions">
        {isShuffled && (
          <Button
            className="rule__button"
            variant="ghost"
            size="sm"
            aria-label={`Back to the suggested colors for the ${ruleName}`}
            onClick={onReset}
          >
            Suggested
          </Button>
        )}
        <Button
          className="rule__button"
          variant="ghost"
          size="sm"
          aria-label={`Shuffle the colors in the ${ruleName}`}
          onClick={onShuffle}
        >
          Shuffle
        </Button>
      </div>
    </div>
  );
}

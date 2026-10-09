import './suggestions.css';
import Swatches from '@/shared/components/Swatches.jsx';
import { Button } from '@/shared/ui/button.jsx';
import { suggestPairings } from './suggest.js';

const sameColors = (a, b) => a.length === b.length && a.every((color, i) => color === b[i]);

/**
 * Pairing ideas for the base color within the chosen wheel type (`harmony`), as compact rows. `context` is the
 * user's other chosen colors, so the ideas suit the whole combination. Exactly one can be chosen: click the row
 * (or its button) to choose it, which makes it the whole palette, and click again to clear it.
 * `onChoose(colors)` toggles it. A pairing is never disabled: choosing one replaces whatever was in the palette.
 */
export default function Suggestions({ hex, harmony, context = [], chosen, onChoose }) {
  const pairings = suggestPairings(hex, harmony, context);
  return (
    <section className="suggestions" aria-label="Suggested pairings">
      <h3 className="suggestions__heading">Or choose one suggested pairing</h3>
      {pairings.map(({ id, label, reason, colors }) => {
        const set = [hex, ...colors];
        const isChosen = sameColors(set, chosen);
        return (
          <div
            key={id}
            className={`suggestions__item${isChosen ? ' suggestions__item--picked' : ''}`}
            data-suggestion={id}
            onClick={() => onChoose(set)}
          >
            <div className="suggestions__info">
              <p className="suggestions__label">{label}</p>
              <Swatches colors={set} size="chip" />
              <p className="suggestions__reason">{reason}</p>
            </div>
            <Button
              className="suggestions__button"
              variant={isChosen ? 'outline' : 'default'}
              aria-pressed={isChosen}
              aria-label={`${isChosen ? 'Clear' : 'Choose'} ${label}`}
              onClick={(event) => {
                event.stopPropagation();
                onChoose(set);
              }}
            >
              {isChosen ? '✓ Chosen' : 'Choose'}
            </Button>
          </div>
        );
      })}
    </section>
  );
}

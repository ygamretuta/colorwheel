import { readableTextColor } from '@/shared/color/contrast.js';
import './swatches.css';

/**
 * Row of clickable swatches. When `selected` is given the swatches act as
 * toggles (aria-pressed); `onSelect(hex)` fires on every click. Without
 * `onSelect` they render as plain, non-interactive chips. `size` is 'default',
 * 'compact' (short tiles), 'tile' (one even row, label hidden) or 'chip' (small, label hidden).
 */
export default function Swatches({ colors, activeHex, selected, onSelect, size = 'default' }) {
  const toggleable = Array.isArray(selected);
  return (
    <div className={`swatches${size === 'default' ? '' : ` swatches--${size}`}`}>
      {colors.map((hex) => {
        const isSelected = toggleable && selected.includes(hex);
        const modifiers = [
          hex === activeHex && 'swatches__item--active',
          isSelected && 'swatches__item--selected',
        ].filter(Boolean);
        const Tag = onSelect ? 'button' : 'div';
        return (
          <Tag
            key={hex}
            type={onSelect ? 'button' : undefined}
            className={['swatches__item', ...modifiers].join(' ')}
            style={{ backgroundColor: hex, color: readableTextColor(hex) }}
            title={onSelect ? (toggleable ? `${isSelected ? 'Remove' : 'Add'} ${hex}` : `Use ${hex}`) : hex}
            aria-pressed={onSelect && toggleable ? isSelected : undefined}
            aria-current={hex === activeHex ? 'true' : undefined}
            data-hex={hex}
            onClick={() => onSelect?.(hex)}
          >
            <span className="swatches__label">{hex}</span>
          </Tag>
        );
      })}
    </div>
  );
}

import './swatches.css';

import { readableTextColor } from '@/shared/color/contrast';

interface SwatchesProps {
  colors: string[];
  activeHex?: string;
  selected?: string[];
  onSelect?: (hex: string) => void;
  disabledColors?: string[];
  size?: 'default' | 'compact' | 'chip' | 'tile';
}

/**
 * Row of clickable swatches. When `selected` is given the swatches act as
 * toggles (aria-pressed); `onSelect(hex)` fires on every click. Without
 * `onSelect` they render as plain, non-interactive chips. `disabledColors` are shown dimmed and
 * can't be tapped. `size` is 'default', 'compact' (short tiles), 'tile' (one even row, label
 * hidden) or 'chip' (small, label hidden).
 */
export default function Swatches({
  colors,
  activeHex,
  selected,
  onSelect,
  disabledColors = [],
  size = 'default',
}: SwatchesProps) {
  const toggleable = Array.isArray(selected);
  return (
    <div className={`swatches${size === 'default' ? '' : ` swatches--${size}`}`}>
      {colors.map((hex) => {
        const isSelected = toggleable && selected.includes(hex);
        const isLocked = Boolean(onSelect) && disabledColors.includes(hex);
        const modifiers = [
          hex === activeHex && 'swatches__item--active',
          isSelected && 'swatches__item--selected',
          isLocked && 'swatches__item--locked',
        ].filter(Boolean);
        const Tag = onSelect ? 'button' : 'div';
        return (
          <Tag
            key={hex}
            type={onSelect ? 'button' : undefined}
            className={['swatches__item', ...modifiers].join(' ')}
            style={{ backgroundColor: hex, color: readableTextColor(hex) }}
            title={
              isLocked
                ? `Palette is full: remove a color to add ${hex}`
                : onSelect
                  ? toggleable
                    ? `${isSelected ? 'Remove' : 'Add'} ${hex}`
                    : `Use ${hex}`
                  : hex
            }
            disabled={isLocked || undefined}
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

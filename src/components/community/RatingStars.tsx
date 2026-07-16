import { useId, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Star } from '../PremiumIcons';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  /** Accessible name for the radiogroup (e.g. dimension label). */
  label?: string;
  /** When true, stars are non-interactive and show the read-only average. */
  readOnly?: boolean;
}

/**
 * Premium star rating control.
 * - Hover preview (desktop) without committing
 * - Keyboard: arrows / Home / End when focused inside the group
 * - Proper radiogroup semantics for screen readers
 */
export default function RatingStars({
  value,
  onChange,
  size = 18,
  label = 'Оценка',
  readOnly = false,
}: RatingStarsProps) {
  const interactive = Boolean(onChange) && !readOnly;
  const [hover, setHover] = useState<number | null>(null);
  const groupId = useId();
  const display = hover ?? value;

  const commit = (score: number) => {
    if (!interactive) return;
    onChange?.(score);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    let next: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(5, (value || 0) + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(1, (value || 1) - 1);
        break;
      case 'Home':
        next = 1;
        break;
      case 'End':
        next = 5;
        break;
      default:
        return;
    }
    event.preventDefault();
    commit(next);
  };

  return (
    <div
      id={groupId}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={label}
      aria-valuenow={interactive ? undefined : value || undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
      className={`inline-flex items-center gap-1 ${interactive ? 'outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061018] rounded-md' : ''}`}
    >
      {[1, 2, 3, 4, 5].map((score) => {
        const active = score <= display;
        return (
          <button
            key={score}
            type="button"
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? score === value : undefined}
            aria-label={`${score} из 5`}
            tabIndex={-1}
            disabled={!interactive}
            onClick={() => commit(score)}
            onMouseEnter={() => interactive && setHover(score)}
            onFocus={() => interactive && setHover(score)}
            className={`rounded-sm transition-transform duration-150 ${
              interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
            } disabled:cursor-default`}
          >
            <Star
              size={size}
              className={
                active
                  ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,212,255,0.55)]'
                  : 'text-cyan-900/80'
              }
            />
          </button>
        );
      })}
    </div>
  );
}

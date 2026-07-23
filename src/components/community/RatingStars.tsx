import { useRef } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  label?: string;
}

const scores = [1, 2, 3, 4, 5] as const;

export default function RatingStars({ value, onChange, size = 18, label = 'Оценка' }: RatingStarsProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const star = (score: number) => {
    const active = score <= value;
    return (
      <Star
        size={size}
        aria-hidden="true"
        className={active ? 'fill-cyan-300 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,212,255,0.55)]' : 'text-cyan-900'}
      />
    );
  };

  if (!onChange) {
    return (
      <div className="flex items-center gap-1" role="img" aria-label={`${label}: ${value} из 5`}>
        {scores.map((score) => (
          <span key={score} className="inline-flex" aria-hidden="true">
            {star(score)}
          </span>
        ))}
      </div>
    );
  }

  const selectAndFocus = (next: number) => {
    const clamped = Math.max(1, Math.min(5, next));
    onChange(clamped);
    window.requestAnimationFrame(() => buttonsRef.current[clamped - 1]?.focus());
  };

  return (
    <div
      className="flex items-center gap-0.5"
      role="radiogroup"
      aria-label={label}
      onKeyDown={(event) => {
        const current = value || 1;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault();
          selectAndFocus(current === 5 ? 1 : current + 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault();
          selectAndFocus(current === 1 ? 5 : current - 1);
        } else if (event.key === 'Home') {
          event.preventDefault();
          selectAndFocus(1);
        } else if (event.key === 'End') {
          event.preventDefault();
          selectAndFocus(5);
        }
      }}
    >
      {scores.map((score) => (
        <button
          key={score}
          ref={(element) => { buttonsRef.current[score - 1] = element; }}
          type="button"
          role="radio"
          aria-checked={score === value}
          tabIndex={score === value || (value === 0 && score === 1) ? 0 : -1}
          onClick={() => onChange(score)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061018] active:scale-95"
          aria-label={`${score} из 5`}
        >
          {star(score)}
        </button>
      ))}
    </div>
  );
}

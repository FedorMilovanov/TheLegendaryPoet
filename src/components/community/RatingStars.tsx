import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export default function RatingStars({ value, onChange, size = 18 }: RatingStarsProps) {
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
      <div className="flex items-center gap-1" role="img" aria-label={`Оценка: ${value} из 5`}>
        {[1, 2, 3, 4, 5].map((score) => (
          <span key={score} className="inline-flex" aria-hidden="true">
            {star(score)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Оценка">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={score === value}
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

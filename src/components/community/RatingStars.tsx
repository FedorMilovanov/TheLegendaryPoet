import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export default function RatingStars({ value, onChange, size = 18 }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Оценка">
      {[1, 2, 3, 4, 5].map((score) => {
        const active = score <= value;
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange?.(score)}
            disabled={!onChange}
            className={`transition-all ${onChange ? 'hover:scale-110' : ''}`}
            aria-label={`${score} из 5`}
          >
            <Star
              size={size}
              className={active ? 'fill-cyan-300 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,212,255,0.55)]' : 'text-cyan-900'}
            />
          </button>
        );
      })}
    </div>
  );
}
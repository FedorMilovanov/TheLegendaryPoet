import type { RatingDimension } from '../../types/community';

interface RatingBarsProps {
  dimensions: RatingDimension[];
  values: Record<string, number>;
}

export default function RatingBars({ dimensions, values }: RatingBarsProps) {
  return (
    <div className="space-y-3" role="list" aria-label="Оценки по шкалам">
      {dimensions.map((dimension) => {
        const value = values[dimension.key] || 0;
        const pct = Math.min(100, (value / 5) * 100);
        return (
          <div key={dimension.key} role="listitem">
            <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-cyan-100/55">
              <span>{dimension.label}</span>
              <span className="tabular-nums">{value ? value.toFixed(1) : '—'}</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-cyan-950/50"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={value || 0}
              aria-label={dimension.label}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(0,212,255,0.45)] transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

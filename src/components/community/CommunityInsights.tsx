import { Sparkles, TrendingDown, TrendingUp } from '../PremiumIcons';
import type { RatingDimension } from '../../types/community';
import {
  getRatedDimensions,
  getStrongestDimension,
  getTopDimensionLabels,
  getWeakestDimension,
} from '../../utils/ratingInsights';

interface CommunityInsightsProps {
  dimensions: RatingDimension[];
  values: Record<string, number>;
}

export default function CommunityInsights({ dimensions, values }: CommunityInsightsProps) {
  const rated = getRatedDimensions(values, dimensions);
  const strongest = getStrongestDimension(rated);
  const weakest = getWeakestDimension(rated);
  const topLabels = getTopDimensionLabels(rated, 3);

  if (!rated.length) {
    return (
      <div className="rounded-3xl border border-cyan-400/10 bg-black/20 p-4 text-sm text-cyan-100/35">
        Когда появятся первые оценки, здесь автоматически соберутся самые заметные сигналы читателей.
      </div>
    );
  }

  // Don't show "weakest" if it's the same as "strongest" (single dimension rated, or all equal).
  const showWeakest = weakest && strongest && weakest.key !== strongest.key;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {topLabels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-full border border-cyan-400/12 bg-cyan-950/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/70"
          >
            <Sparkles size={11} className="text-cyan-300" />
            {label}
          </span>
        ))}
      </div>
      <div className={`grid gap-2 ${showWeakest ? 'sm:grid-cols-2' : ''}`}>
        {strongest && (
          <div className="rounded-2xl border border-cyan-400/10 bg-black/20 px-3 py-3 text-[11px] text-cyan-100/58">
            <div className="mb-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-cyan-300">
              <TrendingUp size={12} /> Сильная сторона
            </div>
            <div>
              {strongest.label}
              <span className="ml-2 tabular-nums text-cyan-200/50">{strongest.value.toFixed(1)}</span>
            </div>
          </div>
        )}
        {showWeakest && weakest && (
          <div className="rounded-2xl border border-cyan-400/10 bg-black/20 px-3 py-3 text-[11px] text-cyan-100/58">
            <div className="mb-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-cyan-300">
              <TrendingDown size={12} /> Слабее всего
            </div>
            <div>
              {weakest.label}
              <span className="ml-2 tabular-nums text-cyan-200/50">{weakest.value.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

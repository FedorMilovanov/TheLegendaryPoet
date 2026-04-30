import { Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { RatingDimension } from '../../types/community';
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

export default function CommunityInsights({
  dimensions,
  values,
}: CommunityInsightsProps) {
  const rated = getRatedDimensions(values, dimensions);
  const strongest = getStrongestDimension(rated);
  const weakest = getWeakestDimension(rated);
  const topLabels = getTopDimensionLabels(rated, 3);

  if (!rated.length) {
    return (
      <div className="rounded-3xl border border-cyan-400/10 bg-black/20 p-4 text-sm text-cyan-100/35">
        Когда появятся первые оценки, здесь автоматически соберутся самые заметные сигналы сообщества.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {topLabels.map((label) => (
          <span
            key={label}
            className="rounded-full border border-cyan-400/12 bg-cyan-950/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/70"
          >
            <Sparkles size={11} className="mr-1 inline-block text-cyan-300" />
            {label}
          </span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {strongest && (
          <div className="rounded-2xl border border-cyan-400/10 bg-black/20 px-3 py-3 text-[11px] text-cyan-100/58">
            <div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-cyan-300">
              <TrendingUp size={12} className="mr-1 inline-block" /> Сильная сторона
            </div>
            <div>{strongest.label}</div>
          </div>
        )}
        {weakest && (
          <div className="rounded-2xl border border-cyan-400/10 bg-black/20 px-3 py-3 text-[11px] text-cyan-100/58">
            <div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-cyan-300">
              <TrendingDown size={12} className="mr-1 inline-block" /> Слабее всего
            </div>
            <div>{weakest.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}

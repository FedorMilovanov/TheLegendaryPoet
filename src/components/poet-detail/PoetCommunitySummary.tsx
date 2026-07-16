import { ShieldCheck, Star } from '../PremiumIcons';
import { poetRatingDimensions } from '../../data/ratingDimensions';
import { useCommunityFeedback } from '../../hooks/useCommunityFeedback';
import { pluralRu } from '../../utils/feedbackValidation';

interface PoetCommunitySummaryProps {
  poetId: string;
}

export default function PoetCommunitySummary({ poetId }: PoetCommunitySummaryProps) {
  const feedback = useCommunityFeedback('poet', poetId);
  const sorted = poetRatingDimensions
    .map((dimension) => ({ ...dimension, value: feedback.summary.dimensions[dimension.key] || 0 }))
    .sort((a, b) => b.value - a.value);
  const strongest = sorted.find((item) => item.value > 0);
  const weakest = [...sorted].reverse().find((item) => item.value > 0);
  const showWeakest = strongest && weakest && strongest.key !== weakest.key;

  return (
    <div className="luxury-card rounded-3xl border border-cyan-400/10 bg-[#061018]/65 p-6">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
        <ShieldCheck size={12} /> Сводка сообщества
      </div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="font-serif text-3xl font-bold tabular-nums text-white">
            {feedback.ratings.length ? feedback.summary.overall.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-cyan-100/38">
            {feedback.ratings.length}{' '}
            {pluralRu(feedback.ratings.length, 'оценка', 'оценки', 'оценок')} · {feedback.trust}
          </div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-cyan-400/15 px-3 py-1 text-cyan-300">
          <Star size={14} className="text-cyan-300" />
          <span className="text-sm font-bold tabular-nums">{feedback.comments.length}</span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-cyan-100/35">мнений</span>
        </div>
      </div>
      {(strongest || showWeakest) && (
        <div className="mb-4 grid gap-2">
          {strongest && (
            <div className="rounded-2xl border border-cyan-400/10 bg-black/20 px-3 py-2 text-[11px] text-cyan-100/58">
              <span className="mr-2 uppercase tracking-[0.12em] text-cyan-300">Сильная сторона</span>
              {strongest.label}
            </div>
          )}
          {showWeakest && weakest && (
            <div className="rounded-2xl border border-cyan-400/10 bg-black/20 px-3 py-2 text-[11px] text-cyan-100/58">
              <span className="mr-2 uppercase tracking-[0.12em] text-cyan-300">Слабее всего</span>
              {weakest.label}
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        {poetRatingDimensions.map((dimension) => {
          const value = feedback.summary.dimensions[dimension.key] || 0;
          return (
            <div key={dimension.key}>
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-cyan-100/45">
                <span>{dimension.label}</span>
                <span className="tabular-nums">{value ? value.toFixed(1) : '—'}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cyan-950/45">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, (value / 5) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

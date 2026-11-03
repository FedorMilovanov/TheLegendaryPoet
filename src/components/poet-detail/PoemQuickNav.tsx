import { MessageSquare, Star } from 'lucide-react';
import { Poem } from '../../types/poet';
import { useCommunityFeedback } from '../../hooks/useCommunityFeedback';

function PoemQuickRow({ poem }: { poem: Poem }) {
  const feedback = useCommunityFeedback('poem', poem.id, { mode: 'passive' });

  return (
    <a href={`#poem-${poem.id}`} className="theme-elevated-surface block rounded-2xl border p-3 transition hover:border-cyan-400/25">
      <div className="theme-text mb-1 text-sm font-semibold">{poem.title}</div>
      <div className="theme-functional-muted flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.14em]">
        <span>{poem.year || 'год не указан'}</span>
        {feedback.ratingCount > 0 && (
          <span className="inline-flex items-center gap-1 text-cyan-300">
            <Star size={11} className="fill-cyan-300" /> {feedback.summary.overall.toFixed(1)}
          </span>
        )}
        {feedback.commentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={11} className="text-cyan-300" /> {feedback.commentCount}
          </span>
        )}
      </div>
    </a>
  );
}

interface PoemQuickNavProps {
  poems: Poem[];
}

export default function PoemQuickNav({ poems }: PoemQuickNavProps) {
  return (
    <div className="luxury-card rounded-3xl border border-cyan-400/10 p-6">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Навигация по лирике</h3>
      <div className="space-y-3">
        {poems.map((poem) => (
          <PoemQuickRow key={poem.id} poem={poem} />
        ))}
      </div>
    </div>
  );
}

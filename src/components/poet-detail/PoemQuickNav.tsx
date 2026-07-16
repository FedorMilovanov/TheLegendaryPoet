import type { MouseEvent } from 'react';
import { MessageSquare, Star } from '../PremiumIcons';
import type { Poem } from '../../types/poet';
import { useCommunityFeedback } from '../../hooks/useCommunityFeedback';
import { scrollToId } from '../../utils/smoothScroll';

function PoemQuickRow({ poem }: { poem: Poem }) {
  const feedback = useCommunityFeedback('poem', poem.id);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToId(`poem-${poem.id}`);
  };

  return (
    <a
      href={`#poem-${poem.id}`}
      onClick={handleClick}
      className="block rounded-2xl border border-cyan-400/10 bg-black/20 p-3 transition hover:border-cyan-400/25 hover:bg-cyan-400/5"
    >
      <div className="mb-1 text-sm font-semibold text-white">{poem.title}</div>
      <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-cyan-100/40">
        <span>{poem.year || 'год не указан'}</span>
        {feedback.ratings.length > 0 && (
          <span className="inline-flex items-center gap-1 text-cyan-300">
            <Star size={11} className="text-cyan-300" />
            <span className="tabular-nums">{feedback.summary.overall.toFixed(1)}</span>
          </span>
        )}
        {feedback.comments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={11} className="text-cyan-300" />
            <span className="tabular-nums">{feedback.comments.length}</span>
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
    <div className="luxury-card rounded-3xl border border-cyan-400/10 bg-[#061018]/65 p-6">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
        Навигация по лирике
      </h3>
      <div className="space-y-3">
        {poems.map((poem) => (
          <PoemQuickRow key={poem.id} poem={poem} />
        ))}
      </div>
    </div>
  );
}

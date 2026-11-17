import { MessageSquare, Star } from 'lucide-react';
import { Poem } from '../../types/poet';
import { useCommunityFeedback } from '../../hooks/useCommunityFeedback';

function PoemQuickRow({ poem }: { poem: Poem }) {
  const feedback = useCommunityFeedback('poem', poem.id, { mode: 'passive' });

  return (
    <a href={`#poem-${poem.id}`} className="poet-reading-link block min-w-0 rounded-2xl border p-3 transition">
      <div className="theme-text mb-1 text-sm font-semibold">{poem.title}</div>
      <div className="theme-functional-muted flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.14em]">
        <span>{poem.year || 'год не указан'}{poem.editionYear ? ` · редакция ${poem.editionYear} г.` : ''}</span>
        {poem.yearNote && <span data-poem-year-note className="normal-case tracking-normal">{poem.yearNote}</span>}
        {poem.cycle && <span data-poem-cycle>{poem.cycle}</span>}
        {feedback.ratingCount > 0 && (
          <span className="inline-flex items-center gap-1 text-luxury-gold">
            <Star size={11} className="fill-luxury-gold" /> {feedback.summary.overall.toFixed(1)}
          </span>
        )}
        {feedback.commentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={11} className="text-luxury-gold" /> {feedback.commentCount}
          </span>
        )}
      </div>
    </a>
  );
}

interface PoemQuickNavProps {
  poems: Poem[];
  id: string;
}

export default function PoemQuickNav({ poems, id }: PoemQuickNavProps) {
  if (poems.length === 0) return null;
  return (
    <nav id={id} aria-label="Навигация по лирике" className="poet-reading-index rounded-3xl border p-6">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em]">Навигация по лирике</h3>
      <ol className="grid gap-3 sm:grid-cols-2">
        {poems.map((poem) => (
          <li key={poem.id}><PoemQuickRow poem={poem} /></li>
        ))}
      </ol>
    </nav>
  );
}

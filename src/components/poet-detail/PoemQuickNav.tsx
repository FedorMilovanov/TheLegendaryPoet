import { useEffect, useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { Poem } from '../../types/poet';
import { useCommunityFeedback } from '../../hooks/useCommunityFeedback';

function PoemQuickRow({ poem, current, lastVisited }: { poem: Poem; current: boolean; lastVisited: boolean }) {
  const feedback = useCommunityFeedback('poem', poem.id, { mode: 'passive' });
  const yearDisplay = `${poem.yearLabel ?? (poem.year || 'год не указан')}${poem.editionYear ? ` · редакция ${poem.editionYear} г.` : ''}`;

  return (
    <a href={`#poem-${poem.id}`} aria-current={current ? 'location' : undefined} data-last-visited={lastVisited ? 'true' : undefined} data-poem-date-wrap={yearDisplay.length > 7 ? 'true' : 'false'} className="poet-reading-link block min-w-0 rounded-2xl border p-3 transition">
      <div className="theme-text mb-1 text-sm font-semibold">{poem.title}</div>
      <div className="theme-functional-muted flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.14em]">
        <span data-poem-year-label>{yearDisplay}</span>
        {poem.yearNote && <span data-poem-year-note className="normal-case tracking-normal">{poem.yearNote}</span>}
        {poem.cycle && <span data-poem-cycle>{poem.cycle}</span>}
        {feedback.ratingCount > 0 && (
          <span className="poet-reading-community inline-flex items-center gap-1 text-luxury-gold">
            <Star size={11} className="fill-luxury-gold" /> {feedback.summary.overall.toFixed(1)}
          </span>
        )}
        {feedback.commentCount > 0 && (
          <span className="poet-reading-community inline-flex items-center gap-1">
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [atIndex, setAtIndex] = useState(false);

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1);
      const selected = poems.find((poem) => `poem-${poem.id}` === hash);
      if (selected) {
        setActiveId(selected.id);
        setAtIndex(false);
      } else if (hash === id) {
        // Remember which entry was visited, but do not claim that the URL
        // still points to the poem: aria-current must match the fragment.
        setAtIndex(true);
      } else {
        setActiveId(null);
        setAtIndex(false);
      }
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [id, poems]);

  if (poems.length === 0) return null;
  return (
    <nav id={id} tabIndex={-1} aria-label="Навигация по лирике" className="poet-reading-index rounded-3xl border p-6">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em]">Навигация по лирике <span aria-hidden="true" className="poet-reading-count">{String(poems.length).padStart(2, '0')} <small>в подборке</small></span></h3>
      <ol className="grid gap-3 sm:grid-cols-2">
        {poems.map((poem) => (
          <li key={poem.id}><PoemQuickRow poem={poem} current={!atIndex && activeId === poem.id} lastVisited={atIndex && activeId === poem.id} /></li>
        ))}
      </ol>
    </nav>
  );
}

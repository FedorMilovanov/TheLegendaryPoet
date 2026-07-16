import { Quote, Award } from '../PremiumIcons';
import { Testimony } from '../../types/poet';

function TestimonyCard({ item }: { item: Testimony }) {
  return (
    <div className="rounded-3xl border border-luxury-gold/10 bg-[#0a0a0a] p-6 md:p-8 hover:border-luxury-gold/25 transition-colors">
      <Quote size={20} className="text-luxury-gold/30 mb-3" />
      <p className="text-lg font-serif italic leading-relaxed text-luxury-gray-light mb-4">
        «{item.quote}»
      </p>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-luxury-gold/10 pt-4">
        <div>
          <span className="text-sm font-bold text-white">{item.author}</span>
          <span className="text-xs text-luxury-gray-light/70"> — {item.role}</span>
        </div>
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] uppercase tracking-wider text-luxury-gold/60 hover:text-luxury-gold transition-colors"
          >
            {item.source}
          </a>
        ) : (
          <span className="text-[11px] uppercase tracking-wider text-luxury-gray-light/40">{item.source}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Sourced quotes: people who personally knew the poet, plus assessments from
 * named literary historians. Every item carries a citable source — this is
 * deliberately not generic prose, it's primary-source-grounded material.
 */
export default function Testimonies({ items }: { items: Testimony[] }) {
  if (!items.length) return null;
  const contemporaries = items.filter((t) => t.kind === 'contemporary');
  const historians = items.filter((t) => t.kind === 'historian');

  return (
    <div className="space-y-12">
      {contemporaries.length > 0 && (
        <div>
          <h2 className="text-xs font-bold tracking-[0.2em] text-luxury-gold uppercase border-b border-luxury-dark-300 pb-4 mb-8">
            Свидетельства современников
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contemporaries.map((item, idx) => (
              <TestimonyCard key={idx} item={item} />
            ))}
          </div>
        </div>
      )}

      {historians.length > 0 && (
        <div>
          <h2 className="text-xs font-bold tracking-[0.2em] text-cyan-300 uppercase border-b border-luxury-dark-300 pb-4 mb-8 flex items-center gap-2">
            <Award size={14} /> Оценка историков литературы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {historians.map((item, idx) => (
              <TestimonyCard key={idx} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

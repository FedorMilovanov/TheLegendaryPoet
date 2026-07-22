import { ArrowUpRight, BookOpenText, Clock, Network } from 'lucide-react';
import { getAllEssays } from '../../data/essays';
import type { Essay, EssayClusterRole } from '../../types/essay';
import { titleCase } from '../../utils/titleCase';
import { Link } from '../ui/Link';
import EssayCover from './EssayCover';

const roleLabels: Record<EssayClusterRole, string> = {
  pillar: 'Опорный материал',
  biography: 'Большая биография',
  investigation: 'Документальное расследование',
  work: 'История произведения',
  archive: 'Архив и источники',
  context: 'Исторический контекст',
};

function relatedEntries(essay: Essay): Essay[] {
  const all = getAllEssays();
  const manual = essay.relatedEssayIds ?? [];
  const manualRank = new Map(manual.map((id, index) => [id, index]));

  return all
    .filter((entry) => {
      if (entry.id === essay.id) return false;
      if (manualRank.has(entry.id)) return true;
      return Boolean(essay.cluster?.id && entry.cluster?.id === essay.cluster.id);
    })
    .sort((a, b) => {
      const aManual = manualRank.get(a.id);
      const bManual = manualRank.get(b.id);
      if (aManual !== undefined || bManual !== undefined) {
        if (aManual === undefined) return 1;
        if (bManual === undefined) return -1;
        return aManual - bManual;
      }

      const orderDiff = (a.cluster?.order ?? 999) - (b.cluster?.order ?? 999);
      if (orderDiff !== 0) return orderDiff;
      return b.date.localeCompare(a.date);
    })
    .slice(0, 6);
}

export default function RelatedClusterEssays({ essay }: { essay: Essay }) {
  const related = relatedEntries(essay);
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-cluster-title" className="mt-16 rounded-[2.25rem] border border-cyan-400/12 bg-[#071016]/45 p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-cyan-400/10 pb-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/55">
            <Network size={13} /> Тематический кластер
          </div>
          <h2 id="related-cluster-title" className="font-serif text-3xl font-bold text-white md:text-4xl">
            {titleCase(essay.cluster?.label ?? 'Продолжить исследование')}
          </h2>
        </div>
        {essay.poetId && (
          <Link
            to={`/poets/${essay.poetId}`}
            className="inline-flex min-h-10 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-luxury-gold/60 transition hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/60"
          >
            <BookOpenText size={13} /> Страница поэта
          </Link>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {related.map((entry) => (
          <Link
            key={entry.id}
            to={`/essays/${entry.slug}`}
            className="group overflow-hidden rounded-[1.6rem] border border-white/8 bg-[#080b0d] transition hover:-translate-y-0.5 hover:border-cyan-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          >
            <EssayCover
              src={entry.cardCover || entry.cover}
              alt={entry.coverAlt || entry.title}
              accent={entry.accent}
              kicker={entry.cluster ? roleLabels[entry.cluster.role] : entry.kicker}
              focusY="25%"
              className="aspect-[16/8.5] w-full"
              imgClassName="transition duration-700 ease-out group-hover:scale-[1.025]"
              sharedName={`essay-cover-${entry.id}`}
            />
            <div className="p-5">
              <h3 className="font-serif text-xl font-bold leading-tight text-white/90 transition group-hover:text-cyan-100">
                {entry.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-luxury-gray-light/55">
                {entry.excerpt}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3 text-[10px] uppercase tracking-[0.13em] text-luxury-gray-light/35">
                <span className="inline-flex items-center gap-1.5"><Clock size={11} /> {entry.readTime} мин</span>
                <span className="inline-flex items-center gap-1 text-cyan-300/55 transition group-hover:text-cyan-200">
                  Читать <ArrowUpRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

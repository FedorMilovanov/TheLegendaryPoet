import { ArrowUpRight, Clock, Layers3 } from 'lucide-react';
import { Link } from '../ui/Link';
import TiltCard from '../TiltCard';
import EssayCover from '../essay/EssayCover';
import { getAllEssays } from '../../data/essays';
import { titleCase } from '../../utils/titleCase';

export default function RelatedEssays({ poetId }: { poetId: string }) {
  const related = getAllEssays()
    .filter((essay) => essay.poetId === poetId)
    .sort((a, b) => {
      if (a.series?.id && a.series.id === b.series?.id) {
        return (a.series.part ?? 0) - (b.series.part ?? 0);
      }
      return b.date.localeCompare(a.date);
    });

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="poet-longreads-title" className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-luxury-gold/10 pb-4">
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold/60">
            Большие материалы
          </div>
          <h2 id="poet-longreads-title" className="font-serif text-3xl font-bold text-white md:text-4xl">
            {titleCase('Биография и исследования')}
          </h2>
        </div>
        <Link
          to="/articles"
          className="inline-flex min-h-10 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/65 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
        >
          Все статьи <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {related.map((essay) => (
          <TiltCard key={essay.id} intensity={5}>
            <Link
              to={`/essays/${essay.slug}`}
              className="group block h-full overflow-hidden rounded-[2rem] border border-white/8 bg-[#090909] shadow-[0_22px_65px_rgba(0,0,0,0.34)] transition hover:border-luxury-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/65"
            >
              <EssayCover
                src={essay.cardCover || essay.cover}
                alt={essay.coverAlt || essay.title}
                accent={essay.accent}
                kicker={essay.series ? `Часть ${essay.series.part} из ${essay.series.total}` : essay.kicker}
                focusY="24%"
                className="aspect-[16/10] w-full"
                imgClassName="transition duration-700 ease-out group-hover:scale-[1.025] group-hover:contrast-[1.04]"
                sharedName={`essay-cover-${essay.id}`}
              />
              <div className="p-6">
                {essay.series && (
                  <div className="mb-3 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-luxury-gold/55">
                    <Layers3 size={11} /> {essay.series.label}
                  </div>
                )}
                <h3 className="font-serif text-2xl font-bold leading-tight text-white/92 transition group-hover:text-luxury-gold">
                  {titleCase(essay.title)}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-luxury-gray-light/65">
                  {essay.excerpt}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/6 pt-4 text-[10px] uppercase tracking-[0.14em] text-luxury-gray-light/40">
                  <span className="inline-flex items-center gap-1.5"><Clock size={12} /> {essay.readTime} мин</span>
                  <span className="inline-flex items-center gap-1 text-cyan-300/60 transition group-hover:text-cyan-200">
                    Читать <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

import { Link } from '../ui/Link';
import { ArrowRight, Clock, Network } from 'lucide-react';
import type { Essay, EssayClusterRole } from '../../types/essay';
import { DEFAULT_ACCENT } from './theme';
import TiltCard from '../TiltCard';
import EssayCover from './EssayCover';
import { titleCase } from '../../utils/titleCase';

const roleLabels: Record<EssayClusterRole, string> = {
  pillar: 'Опорный материал',
  biography: 'Большая биография',
  investigation: 'Документальное расследование',
  work: 'История произведения',
  archive: 'Архив и источники',
  context: 'Исторический контекст',
};

/**
 * Featured essay link card with a restrained pointer tilt. Cover motion stays on
 * one raster plane; the global TiltCard supplies the depth rather than stacking
 * a second aggressive zoom on top of it.
 */
export default function EssayCard({ essay, variant = 'default' }: { essay: Essay; variant?: 'default' | 'feature' }) {
  const accent = essay.accent || DEFAULT_ACCENT;
  const feature = variant === 'feature';
  const kicker = essay.cluster ? roleLabels[essay.cluster.role] : essay.kicker;

  return (
    <Link to={`/essays/${essay.slug}`} className="group block h-full" data-testid="essay-card-link">
      <TiltCard intensity={feature ? 4 : 5.5}>
        <div
          className={`luxury-card relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-luxury-gold/15 bg-[#060606] ${feature ? 'md:flex-row' : ''}`}
          data-testid="essay-card"
        >
          <EssayCover
            src={essay.cardCover || essay.cover}
            alt={essay.coverAlt || essay.title}
            accent={accent}
            kicker={kicker}
            focusY="30%"
            overlayFrom="#060606"
            ornamentClass="text-8xl"
            imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-[1.025]"
            className={feature ? 'aspect-[16/10] md:aspect-auto md:w-1/2' : 'aspect-[16/10]'}
            sharedName={`essay-cover-${essay.id}`}
          />

          <div className={`flex flex-1 flex-col p-6 ${feature ? 'md:justify-center md:p-10' : ''}`}>
            {essay.cluster && (
              <div className="mb-3 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300/45">
                <Network size={11} /> {essay.cluster.label}
              </div>
            )}
            <h3 className={`text-balance font-serif font-bold leading-snug text-white transition-colors group-hover:text-luxury-gold ${feature ? 'text-3xl leading-tight md:text-4xl' : 'line-clamp-2 text-xl'}`}>
              {titleCase(essay.title)}
            </h3>
            {essay.subtitle && feature && (
              <p className="text-pretty mt-3 font-serif text-lg italic text-luxury-gray-light">{essay.subtitle}</p>
            )}
            <p className={`text-pretty mt-3 flex-grow text-sm font-light leading-relaxed text-luxury-gray-light/80 ${feature ? 'line-clamp-4 md:text-base' : 'line-clamp-3'}`}>
              {essay.excerpt}
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-luxury-gold/10 pt-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-luxury-gray-light/50">
                <Clock size={12} className="text-luxury-gold/50" /> {essay.readTime} мин
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-luxury-gold transition-colors group-hover:text-luxury-gold-light">
                Читать <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

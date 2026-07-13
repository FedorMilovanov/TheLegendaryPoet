import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { Essay } from '../../types/essay';
import { DEFAULT_ACCENT } from './theme';
import TiltCard from '../TiltCard';
import EssayCover from './EssayCover';

/**
 * Featured essay link card with a 3D-tilt cover, for the Articles listing.
 * `variant="feature"` renders a large hero card; default is a compact card.
 * Cover art (with graceful fallback) comes from the shared EssayCover.
 */
export default function EssayCard({ essay, variant = 'default' }: { essay: Essay; variant?: 'default' | 'feature' }) {
  const accent = essay.accent || DEFAULT_ACCENT;
  const feature = variant === 'feature';

  return (
    <Link to={`/essays/${essay.slug}`} className="group block h-full">
      <TiltCard intensity={feature ? 5 : 7}>
        <div className={`luxury-card relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-luxury-gold/15 bg-[#060606] ${feature ? 'md:flex-row' : ''}`}>
          <EssayCover
            src={essay.cardCover || essay.cover}
            alt={essay.coverAlt || essay.title}
            accent={accent}
            kicker={essay.kicker}
            focusY="30%"
            overlayFrom="#060606"
            ornamentClass="text-8xl"
            imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-105"
            className={feature ? 'md:w-1/2 aspect-[16/10] md:aspect-auto' : 'aspect-[16/10]'}
          />

          <div className={`flex flex-1 flex-col p-6 ${feature ? 'md:p-10 md:justify-center' : ''}`}>
            <h3 className={`font-serif font-bold text-white transition-colors group-hover:text-luxury-gold text-balance ${feature ? 'text-3xl md:text-4xl leading-tight' : 'text-xl leading-snug line-clamp-2'}`}>
              {essay.title}
            </h3>
            {essay.subtitle && feature && (
              <p className="mt-3 font-serif text-lg italic text-luxury-gray-light text-pretty">{essay.subtitle}</p>
            )}
            <p className={`mt-3 flex-grow text-sm leading-relaxed text-luxury-gray-light/80 font-light text-pretty ${feature ? 'line-clamp-4 md:text-base' : 'line-clamp-3'}`}>
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

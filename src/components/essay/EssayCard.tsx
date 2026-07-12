import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { Essay } from '../../types/essay';
import { asset } from '../../utils/asset';
import TiltCard from '../TiltCard';

/**
 * Featured essay link card with a 3D-tilt cover, for the Articles listing.
 * `variant="feature"` renders a large hero card; default is a compact card.
 */
export default function EssayCard({ essay, variant = 'default' }: { essay: Essay; variant?: 'default' | 'feature' }) {
  const [imgOk, setImgOk] = useState(true);
  const accent = essay.accent || '#d4af37';
  const feature = variant === 'feature';

  return (
    <Link to={`/essays/${essay.slug}`} className="group block h-full">
      <TiltCard intensity={feature ? 5 : 7}>
        <div className={`luxury-card relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-luxury-gold/15 bg-[#060606] ${feature ? 'md:flex-row' : ''}`}>
          <div
            className={`relative overflow-hidden ${feature ? 'md:w-1/2 aspect-[16/10] md:aspect-auto' : 'aspect-[16/10]'}`}
            style={{ background: `radial-gradient(circle at 50% 30%, ${accent}22, transparent 60%), linear-gradient(160deg, #07131c, #0a0a0a)` }}
          >
            {imgOk ? (
              <img
                src={asset(essay.cardCover || essay.cover)}
                alt={essay.coverAlt || essay.title}
                onError={() => setImgOk(false)}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-serif text-8xl opacity-10" style={{ color: accent }}>«»</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060606] via-transparent to-transparent" />
            {essay.kicker && (
              <span
                className="absolute left-4 top-4 rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur-md"
                style={{ color: accent, borderColor: `${accent}55`, backgroundColor: `${accent}18` }}
              >
                {essay.kicker}
              </span>
            )}
          </div>

          <div className={`flex flex-1 flex-col p-6 ${feature ? 'md:p-10 md:justify-center' : ''}`}>
            <h3 className={`font-serif font-bold text-white transition-colors group-hover:text-luxury-gold ${feature ? 'text-3xl md:text-4xl leading-tight' : 'text-xl leading-snug line-clamp-2'}`}>
              {essay.title}
            </h3>
            {essay.subtitle && feature && (
              <p className="mt-3 font-serif text-lg italic text-luxury-gray-light">{essay.subtitle}</p>
            )}
            <p className={`mt-3 flex-grow text-sm leading-relaxed text-luxury-gray-light/80 font-light ${feature ? 'line-clamp-4 md:text-base' : 'line-clamp-3'}`}>
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

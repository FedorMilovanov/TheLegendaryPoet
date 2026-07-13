import { motion } from 'framer-motion';
import { Calendar, Clock, PenLine } from 'lucide-react';
import type { Essay } from '../../types/essay';
import { DEFAULT_ACCENT } from './theme';
import TiltCard from '../TiltCard';
import EssayCover from './EssayCover';

/**
 * Essay hero: a 3D-tilt cover banner + a centred title block. The cover art has
 * a graceful themed fallback (shared EssayCover), so the hero looks intentional
 * even before the real artwork is dropped into public/images/essays/.
 */
export default function EssayHero({ essay }: { essay: Essay }) {
  const accent = essay.accent || DEFAULT_ACCENT;

  return (
    <header className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <TiltCard intensity={6}>
          <EssayCover
            src={essay.cover}
            alt={essay.coverAlt || essay.title}
            accent={accent}
            kicker={essay.kicker}
            focusY="20%"
            loading="eager"
            ornamentClass="text-[9rem]"
            className="aspect-[16/9] w-full rounded-[2rem] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
          />
        </TiltCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mt-10 max-w-3xl text-center"
      >
        <h1 className="editorial-title font-serif text-4xl md:text-6xl font-bold leading-[1.02] text-white text-balance">
          {essay.title}
        </h1>
        {essay.subtitle && (
          <p className="mx-auto mt-5 max-w-2xl font-serif text-xl md:text-2xl italic text-luxury-gray-light text-pretty">
            {essay.subtitle}
          </p>
        )}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.16em] text-luxury-gray-light/60">
          <span className="inline-flex items-center gap-1.5"><PenLine size={13} className="text-luxury-gold/60" /> {essay.author}</span>
          <span className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-luxury-gold/60" /> {essay.date}</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-luxury-gold/60" /> {essay.readTime} мин чтения</span>
        </div>
        {essay.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {essay.tags.map((t) => (
              <span key={t} className="rounded-full border border-luxury-gold/15 bg-luxury-gold/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-luxury-gold/70">
                {t}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </header>
  );
}

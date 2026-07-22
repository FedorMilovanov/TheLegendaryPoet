import { motion } from 'framer-motion';
import { Calendar, Clock, Layers3, PenLine } from 'lucide-react';
import type { Essay } from '../../types/essay';
import { DEFAULT_ACCENT } from './theme';
import TiltCard from '../TiltCard';
import EssayCover from './EssayCover';
import { titleCase } from '../../utils/titleCase';

/**
 * Essay hero: a restrained 3D-tilt cover banner + a centred title block. The
 * cover art has a themed fallback, so the hero stays intentional before media
 * is available. Series metadata is compact and editorial rather than app-like.
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
            sharedName={`essay-cover-${essay.id}`}
          />
        </TiltCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mt-10 max-w-3xl text-center"
      >
        {essay.series && (
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-luxury-gold/15 bg-luxury-gold/[0.04] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-luxury-gold/70">
            <Layers3 size={12} /> {essay.series.label} · часть {essay.series.part} из {essay.series.total}
          </div>
        )}
        <h1 className="editorial-title font-serif text-4xl md:text-6xl font-bold leading-[1.02] text-white text-balance">
          {titleCase(essay.title)}
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
            {essay.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-luxury-gold/15 bg-luxury-gold/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-luxury-gold/70">
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </header>
  );
}

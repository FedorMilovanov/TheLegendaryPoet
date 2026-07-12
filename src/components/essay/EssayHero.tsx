import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, PenLine } from 'lucide-react';
import { Essay } from '../../types/essay';
import { asset } from '../../utils/asset';
import TiltCard from '../TiltCard';

/**
 * Essay hero: a 3D-tilt cover banner + a centred title block. The cover has a
 * graceful themed fallback, so the hero looks intentional even before the real
 * artwork is dropped into public/images/essays/.
 */
export default function EssayHero({ essay }: { essay: Essay }) {
  const [imgOk, setImgOk] = useState(true);
  const accent = essay.accent || '#d4af37';

  return (
    <header className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <TiltCard intensity={6}>
          <div
            className="relative aspect-[16/9] w-full overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
            style={{ background: `radial-gradient(circle at 50% 20%, ${accent}22, transparent 60%), linear-gradient(160deg, #07131c 0%, #0a0a0a 70%)` }}
          >
            {imgOk && (
              <img
                src={asset(essay.cover)}
                alt={essay.coverAlt || essay.title}
                className="h-full w-full object-cover"
                onError={() => setImgOk(false)}
                loading="eager"
                decoding="async"
              />
            )}
            {/* Fallback ornament when no artwork yet */}
            {!imgOk && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-[9rem] leading-none opacity-10" style={{ color: accent }}>«»</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
            {essay.kicker && (
              <span
                className="absolute left-5 top-5 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] backdrop-blur-md"
                style={{ color: accent, borderColor: `${accent}55`, backgroundColor: `${accent}18` }}
              >
                {essay.kicker}
              </span>
            )}
          </div>
        </TiltCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mt-10 max-w-3xl text-center"
      >
        <h1 className="editorial-title font-serif text-4xl md:text-6xl font-bold leading-[1.02] text-white">
          {essay.title}
        </h1>
        {essay.subtitle && (
          <p className="mx-auto mt-5 max-w-2xl font-serif text-xl md:text-2xl italic text-luxury-gray-light">
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

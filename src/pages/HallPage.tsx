import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSeo } from '../hooks/useSeo';
import { asset } from '../utils/asset';
import { titleCase } from '../utils/titleCase';

/**
 * Hall of Poets — placeholder while the immersive version is rebuilt.
 *
 * The route stays reachable (nav link / homepage CTA), but instead of loading
 * the heavy R3F scene it shows a blurred glimpse of the target "Храм Русской
 * Поэзии" reference with an explicit "в разработке" message. The 3D hall
 * components remain in the repo (src/components/hall/*) for the future rebuild;
 * they are simply not imported here, so none of three.js ships in this route.
 */
export default function HallPage() {
  useSeo({
    title: 'Зал Поэтов — в разработке — THE LEGENDARY POET',
    description: 'Иммерсивный «Храм Русской Поэзии» сейчас в разработке. Скоро здесь можно будет пройтись по залам поэтов разных эпох.',
    path: '/hall',
  });

  return (
    <div className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#050505]">
      {/* Blurred reference backdrop — a glimpse of where the hall is heading */}
      <div className="absolute inset-0">
        <img
          src={asset('/images/hall-preview.webp')}
          alt="Приблизительный референс будущего зала — купольный храм русской поэзии"
          className="h-full w-full scale-110 object-cover opacity-60 blur-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/55 to-[#050505]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,5,0.55)_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-2xl px-6 text-center"
      >
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-luxury-gold/30 bg-luxury-gold/5 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-luxury-gold">
          <span className="h-2 w-2 animate-pulse rounded-full bg-luxury-gold" />
          В разработке
        </span>

        <h1 className="editorial-title mb-6 font-serif text-5xl font-bold leading-[0.95] text-white md:text-7xl">
          <span className="gold-gradient gold-glow-text">{titleCase('Храм русской поэзии')}</span>
        </h1>

        <p className="mx-auto mb-4 max-w-xl font-serif text-xl italic leading-relaxed text-luxury-gray-light md:text-2xl">
          Иммерсивный зал поэтов сейчас перестраивается.
        </p>
        <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-luxury-gray-light/70">
          Мы делаем его заново — как купольный пантеон с залами разных эпох:
          Золотой век, Серебряный век, советская и современная поэзия. На фоне —
          приблизительный референс того, к чему идём. Пока это только эскиз.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/poets"
            className="inline-flex items-center gap-2 rounded-full bg-luxury-gold px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[#050505] transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
          >
            Перейти к поэтам
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-luxury-gold/40 px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-luxury-gold transition-all hover:border-luxury-gold/70 hover:bg-luxury-gold/5"
          >
            На главную
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

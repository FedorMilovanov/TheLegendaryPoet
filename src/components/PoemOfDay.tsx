import { Link } from 'react-router-dom';
import { getPoemOfDay, getPoemPreview } from '../utils/dailyContent';
import { ArrowRight, Quote } from './PremiumIcons';
import Reveal from './Reveal';

export default function PoemOfDay() {
  const { poem, poet } = getPoemOfDay();
  const preview = getPoemPreview(poem.text, 4);

  return (
    <Reveal direction="up">
      <section className="relative overflow-hidden py-24">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,212,255,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#050505]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-luxury-gold/20 bg-luxury-gold/5 px-4 py-1.5">
                <Quote size={14} className="text-luxury-gold" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-luxury-gold">Стихотворение дня</span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-white sm:text-5xl">
                «{poem.title}»
              </h2>
              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-cyan-100/40">
                {poet.name}{poem.year ? ` · ${poem.year}` : ''}
              </p>
            </div>

            <div className="relative rounded-3xl border border-cyan-400/10 bg-[#061018]/40 p-8 backdrop-blur-sm sm:p-12">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#050505] px-4">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
              </div>
              
              <div className="space-y-4 font-serif text-xl italic leading-relaxed text-cyan-50/80 sm:text-2xl sm:leading-loose">
                {preview.map((line, i) => (
                  <p key={i} className="text-center">{line}</p>
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <Link 
                  to={`/poets/${poet.id}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-6 py-3 text-sm font-bold uppercase tracking-wider text-cyan-300 transition-all hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]"
                >
                  Читать у поэта <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
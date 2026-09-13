import { Link } from './ui/Link';
import { getPoemOfDay, getPoemPreview } from '../utils/dailyContent';
import { ArrowRight, Quote } from './PremiumIcons';
import Reveal from './Reveal';

export default function PoemOfDay() {
  const { poem, poet } = getPoemOfDay();
  const preview = getPoemPreview(poem.text, 4);

  return (
    <Reveal direction="up">
      <section className="theme-poem-feature relative overflow-hidden py-24">

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-luxury-gold/20 bg-luxury-gold/5 px-4 py-1.5">
                <Quote size={14} className="text-luxury-gold" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-luxury-gold">Стихотворение дня</span>
              </div>
              <h2 className="font-serif text-3xl font-bold sm:text-5xl">
                «{poem.title}»
              </h2>
              <p className="theme-functional-subtle mt-3 text-sm uppercase tracking-[0.18em]">
                {poet.name}{poem.year ? ` · ${poem.year}` : ''}
              </p>
            </div>

            <div className="theme-poem-card relative rounded-3xl border p-8 backdrop-blur-sm sm:p-12">
              <div className="theme-poem-divider absolute -top-6 left-1/2 -translate-x-1/2 px-4">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
              </div>
              
              <div className="theme-poem-text space-y-4 font-serif text-xl italic leading-relaxed sm:text-2xl sm:leading-loose">
                {preview.map((line, i) => (
                  <p key={i} className="text-center">{line}</p>
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <Link 
                  to={`/poets/${poet.id}`}
                  className="theme-control-action theme-control-border group inline-flex items-center gap-2 rounded-full border bg-cyan-400/5 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]"
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
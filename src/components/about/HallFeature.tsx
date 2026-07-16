import { Link } from '../ui/Link';
import { Sparkles, ArrowRight } from '../PremiumIcons';
import Reveal from '../Reveal';
import { titleCase } from '../../utils/titleCase';

/**
 * About-page promo for the immersive Hall of Poets ("Храм Русской Поэзии").
 * The Hall is currently an under-development placeholder; this simply invites
 * visitors to peek at where it's heading.
 */
export default function HallFeature() {
  return (
    <Reveal direction="up">
      <section className="my-12">
        <div className="luxury-card relative overflow-hidden rounded-[2rem] border border-luxury-gold/25 bg-gradient-to-br from-[#0e0c07] to-[#050505] p-8 md:p-12">
          <div className="pointer-events-none absolute -right-8 -top-8 text-luxury-gold/5">
            <Sparkles size={220} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-luxury-gold/30 bg-luxury-gold/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-luxury-gold">
              <Sparkles size={13} /> Музейный вестибюль
            </div>
            <h2 className="mb-4 font-serif text-3xl font-bold text-white md:text-4xl">
              {titleCase('Храм Русской')} <span className="gold-gradient gold-glow-text">{titleCase('Поэзии')}</span>
            </h2>
            <p className="mb-8 text-base leading-relaxed text-luxury-gray-light md:text-lg">
              Открыт кураторский зал: четыре крыла по эпохам, золотые ниши, портреты и
              цитаты. Объём купола и прогулка наращиваются отдельными проходами —
              без спешки.
            </p>
            <Link
              to="/hall"
              className="group inline-flex items-center gap-2 rounded-full border border-luxury-gold/40 bg-luxury-gold/10 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-luxury-gold transition-all hover:bg-luxury-gold/20 hover:shadow-[0_0_24px_rgba(212,175,55,0.2)]"
            >
              Войти в Зал
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

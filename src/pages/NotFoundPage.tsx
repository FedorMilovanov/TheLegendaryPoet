import { useLocation } from 'react-router-dom';
import { Link } from '../components/ui/Link';
import { ArrowLeft, Search, Sparkles } from '../components/PremiumIcons';
import { useSeo } from '../hooks/useSeo';
import { titleCase } from '../utils/titleCase';

export default function NotFoundPage() {
  const location = useLocation();

  useSeo({
    title: 'Страница не найдена — THE LEGENDARY POET',
    description: 'Запрошенная страница не существует или была перемещена.',
    path: location.pathname,
    noIndex: true,
  });

  return (
    <div className="min-h-screen bg-[#050505] px-4 pb-24 pt-32 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <div className="section-label">404</div>
        <h1 className="mb-5 font-serif text-5xl font-bold sm:text-7xl">
          {titleCase('Страница')} <span className="neon-blue-gradient neon-glow-text">{titleCase('не найдена')}</span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-cyan-100/55">
          Возможно, ссылка устарела или раздел был перемещён. Вернитесь в каталог, откройте поиск или войдите в Зал Поэтов.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cyan-400/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-cyan-300 transition hover:bg-cyan-400/15">
            <ArrowLeft size={16} /> На главную
          </Link>
          <Link to="/poets" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-cyan-100/70 transition hover:bg-white/8 hover:text-white">
            <Search size={16} /> Каталог
          </Link>
          <Link to="/hall" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-luxury-gold/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-luxury-gold transition hover:bg-luxury-gold/15">
            <Sparkles size={16} /> Зал
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

export default function NotFoundPage() {
  useSeo({
    title: 'Страница не найдена — THE LEGENDARY POET',
    description: 'Запрошенная страница не существует.',
    path: '/404',
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] px-4 text-center text-white">
      <p className="neon-blue-gradient neon-glow-text font-serif text-7xl font-bold">404</p>
      <h1 className="mt-6 font-serif text-3xl">Страница не найдена</h1>
      <p className="mt-3 max-w-md text-cyan-100/60">
        Возможно, ссылка устарела или страница была перемещена.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(0,212,255,0.35)] transition hover:scale-[1.02]"
        >
          На главную
        </Link>
        <Link
          to="/poets"
          className="rounded-full border border-cyan-400/30 px-6 py-3 text-sm font-bold text-cyan-200 transition hover:border-cyan-400/60"
        >
          К поэтам
        </Link>
      </div>
    </div>
  );
}

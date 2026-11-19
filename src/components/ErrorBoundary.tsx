import { Component, useLayoutEffect, type ReactNode } from 'react';
import { useHref, type Location } from 'react-router';
import { Home, RotateCw, WifiOff } from 'lucide-react';
import { Link, useAppNavigate } from './ui/Link';
import { useRestoreRouteScroll } from './SmoothScroll';
import { ownDiscoveryHead } from '../routes/discoveryHead';
import { isChunkLoadFailure, recoverMountedChunk } from '../routes/routeModules';
import { titleCase } from '../utils/titleCase';

interface ErrorBoundaryProps {
  children: ReactNode;
  location: Location;
  variant?: 'root' | 'page';
}

type ErrorBoundaryState = { location?: Location; error: Error | null };

function RecoveryPage({ error, location, pageMode }: { error: Error; location: Location; pageMode: boolean }) {
  const href = useHref(location);
  const navigate = useAppNavigate();
  const chunkFailure = isChunkLoadFailure(error);
  const reload = !pageMode || chunkFailure;
  useRestoreRouteScroll(location.pathname);
  useLayoutEffect(() => {
    const release = ownDiscoveryHead(href, { state: 'error', path: location.pathname }, location.key);
    if (new URL(href, window.location.href).href === window.location.href && location.key === (window.history.state?.key ?? 'default')) {
      recoverMountedChunk(error);
    }
    return release;
  }, [error, href, location]);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const description = offline
    ? 'Соединение прервалось до завершения загрузки. Уже открытая музыка и сохранённые данные не затронуты.'
    : chunkFailure
      ? 'После обновления сайта браузер не смог получить свежий модуль страницы. Повторная загрузка обычно исправляет устаревший кэш.'
      : 'Эта страница не смогла отрисоваться. Остальная оболочка сайта и музыкальная сессия продолжают работать.';

  return (
    <section
      className={`flex items-center justify-center px-4 text-center text-white ${pageMode ? 'min-h-[64vh] py-24' : 'min-h-screen bg-[#050505] py-20'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="theme-dark-island theme-dark-island-text relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-amber-300/15 bg-[#061018] bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.09),transparent_40%)] p-7 shadow-[0_28px_100px_rgba(0,0,0,0.42)] sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/[0.055] text-amber-200">
          {offline ? <WifiOff size={24} /> : <RotateCw size={24} />}
        </div>
        <div className="section-label">{offline ? 'Нет соединения' : 'Страница остановлена безопасно'}</div>
        <h1 data-route-unavailable className="mb-4 font-serif text-3xl font-bold sm:text-4xl">{titleCase(offline ? 'Загрузка не завершилась' : 'Попробуем восстановить страницу')}</h1>
        <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-cyan-100/55">{description}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reload ? window.location.reload() : navigate(location, { replace: true, state: location.state })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
          >
            <RotateCw size={16} /> {reload ? 'Обновить страницу' : 'Повторить попытку'}
          </button>
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cyan-400/15 px-6 text-xs font-bold uppercase tracking-[0.14em] text-cyan-200 transition hover:border-cyan-300/35 hover:bg-cyan-400/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            <Home size={16} /> На главную
          </Link>
        </div>
      </div>
    </section>
  );
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  // Reset a failed visit before rendering its successor. Do not key/remount
  // healthy routes: a filter edit or another hash must retain local controls.
  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: ErrorBoundaryState) {
    return props.location === state.location ? null : { location: props.location, error: null };
  }

  static getDerivedStateFromError(error: Error) { return { error }; }

  render() {
    return this.state.error
      ? <RecoveryPage location={this.props.location} error={this.state.error} pageMode={this.props.variant === 'page'} />
      : this.props.children;
  }
}

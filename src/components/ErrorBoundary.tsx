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
      className={`recovery-view ${pageMode ? 'min-h-[64vh] py-24' : 'min-h-screen bg-[#050505] py-20'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="theme-dark-island theme-dark-island-text recovery-card">
        <div className="recovery-icon">
          {offline ? <WifiOff size={24} /> : <RotateCw size={24} />}
        </div>
        <div className="section-label">{offline ? 'Нет соединения' : 'Страница остановлена безопасно'}</div>
        <h1 data-route-unavailable>{titleCase(offline ? 'Загрузка не завершилась' : 'Попробуем восстановить страницу')}</h1>
        <p>{description}</p>
        <div className="recovery-actions">
          <button
            type="button"
            onClick={() => reload ? window.location.reload() : navigate(location, { replace: true, state: location.state })}
            className="recovery-primary"
          >
            <RotateCw size={16} /> {reload ? 'Обновить страницу' : 'Повторить попытку'}
          </button>
          <Link
            to="/"
            className="recovery-secondary"
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

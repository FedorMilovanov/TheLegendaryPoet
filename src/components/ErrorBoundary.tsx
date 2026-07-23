import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Home, RotateCw, WifiOff } from 'lucide-react';
import { Link } from './ui/Link';
import { titleCase } from '../utils/titleCase';

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
  variant?: 'root' | 'page';
}

interface ErrorBoundaryState {
  hasError: boolean;
  chunkFailure: boolean;
}

function looksLikeChunkFailure(error: Error) {
  return /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(`${error.name}: ${error.message}`);
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, chunkFailure: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, chunkFailure: looksLikeChunkFailure(error) };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Keep production recoverable without exposing stack traces or internals.
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, chunkFailure: false });
    }
  }

  private reload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const pageMode = this.props.variant === 'page';
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const description = offline
        ? 'Соединение прервалось до завершения загрузки. Уже открытая музыка и сохранённые данные не затронуты.'
        : this.state.chunkFailure
          ? 'После обновления сайта браузер не смог получить свежий модуль страницы. Повторная загрузка обычно исправляет устаревший кэш.'
          : 'Эта страница не смогла отрисоваться. Остальная оболочка сайта и музыкальная сессия продолжают работать.';

      return (
        <section
          className={`flex items-center justify-center px-4 text-center text-white ${pageMode ? 'min-h-[64vh] py-24' : 'min-h-screen bg-[#050505] py-20'}`}
          role="alert"
          aria-live="assertive"
        >
          <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-amber-300/15 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.09),transparent_40%),rgba(6,16,24,0.82)] p-7 shadow-[0_28px_100px_rgba(0,0,0,0.42)] sm:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/[0.055] text-amber-200">
              {offline ? <WifiOff size={24} /> : <RotateCw size={24} />}
            </div>
            <div className="section-label">{offline ? 'Нет соединения' : 'Страница остановлена безопасно'}</div>
            <h1 className="mb-4 font-serif text-3xl font-bold sm:text-4xl">{titleCase(offline ? 'Загрузка не завершилась' : 'Попробуем восстановить страницу')}</h1>
            <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-cyan-100/55">{description}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={this.reload}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
              >
                <RotateCw size={16} /> Обновить страницу
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

    return this.props.children;
  }
}

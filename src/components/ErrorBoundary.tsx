import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from './ui/Link';
import { titleCase } from '../utils/titleCase';

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Recoverable full-page error shell.
 * - Resets automatically when the route (`resetKey`) changes.
 * - "Попробовать снова" remounts children without a full page reload.
 * - Never exposes stack traces to the reader.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Intentionally quiet in production. Wire analytics here if needed.
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-center text-white">
          <div className="max-w-xl">
            <div className="section-label">Ошибка</div>
            <h1 className="mb-4 font-serif text-4xl font-bold">{titleCase('Что-то пошло не так')}</h1>
            <p className="mb-8 text-sm leading-relaxed text-cyan-100/55">
              Страница не смогла отрисоваться. Можно попробовать ещё раз или вернуться на главную —
              остальной сайт продолжает работать.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.retry}
                className="inline-flex rounded-full border border-cyan-400/25 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-cyan-300 transition hover:bg-cyan-400/10"
              >
                Попробовать снова
              </button>
              <Link
                to="/"
                className="inline-flex rounded-full bg-cyan-400/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-cyan-300 transition hover:bg-cyan-400/15"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

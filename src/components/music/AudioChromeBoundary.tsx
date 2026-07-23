import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CircleStop, RotateCw, TriangleAlert } from 'lucide-react';

interface AudioChromeBoundaryProps {
  children: ReactNode;
  resetKey: string;
  onStop: () => void;
}

interface AudioChromeBoundaryState {
  hasError: boolean;
}

export default class AudioChromeBoundary extends Component<AudioChromeBoundaryProps, AudioChromeBoundaryState> {
  state: AudioChromeBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Keep the literary site usable even if optional audio chrome fails.
  }

  componentDidUpdate(previous: AudioChromeBoundaryProps) {
    if (this.state.hasError && previous.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  private stop = () => {
    this.props.onStop();
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fixed bottom-[calc(6.35rem+env(safe-area-inset-bottom))] left-1/2 z-[115] w-[min(520px,calc(100%-1.25rem))] -translate-x-1/2 rounded-[1.35rem] border border-amber-300/16 bg-[#11100d]/96 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.68)] backdrop-blur-2xl md:bottom-5" role="alert">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 flex-none text-amber-300" size={19} />
          <div className="min-w-0 flex-1">
            <div className="font-serif text-lg font-bold">Панель плеера временно недоступна</div>
            <p className="mt-1 text-xs leading-relaxed text-white/52">Страница продолжает работать. Можно заново открыть управление или полностью остановить аудиосессию.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={this.retry} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-300 px-4 text-xs font-bold text-black transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><RotateCw size={15} /> Вернуть панель</button>
              <button type="button" onClick={this.stop} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-xs font-bold text-white/62 transition hover:border-white/28 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><CircleStop size={15} /> Остановить аудио</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

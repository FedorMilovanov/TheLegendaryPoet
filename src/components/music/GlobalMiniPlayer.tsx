import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LoaderCircle, Maximize2, Pause, Play, RotateCw, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { asset } from '../../utils/asset';
import { Link } from '../ui/Link';
import { useAudioPlayer } from './AudioPlayerProvider';
import { getTrackThemeStyle } from './trackTheme';

const formatTime = (value: number) => {
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60).toString().padStart(2, '0')}`;
};

export default function GlobalMiniPlayer() {
  const location = useLocation();
  const {
    currentTrack,
    playing,
    ended,
    status,
    failure,
    currentTime,
    duration,
    toggleTrack,
    retry,
    seekTo,
    playNext,
    playPrevious,
    closePlayer,
    openImmersive,
    immersiveOpen,
  } = useAudioPlayer();

  const ownDetailOpen = currentTrack
    ? location.pathname === `/music/${currentTrack.id}`
    : false;
  const visible = Boolean(currentTrack) && !immersiveOpen && !ownDetailOpen;
  const totalDuration = duration || currentTrack?.durationSeconds || 0;
  const progress = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;
  const busy = status === 'loading' || status === 'buffering';

  useEffect(() => {
    document.documentElement.classList.toggle('global-audio-active', visible);
    return () => document.documentElement.classList.remove('global-audio-active');
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && currentTrack && (
        <motion.aside
          key={currentTrack.id}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 22, scale: 0.98 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="global-audio-mini"
          aria-label="Текущий музыкальный релиз"
          style={getTrackThemeStyle(currentTrack)}
        >
          <div
            className="relative isolate overflow-hidden rounded-[1.45rem] border border-white/[0.11] bg-[#071018]/95 shadow-[0_24px_80px_rgba(0,0,0,0.62)] backdrop-blur-2xl"
            style={{ backgroundImage: 'linear-gradient(120deg, color-mix(in srgb, var(--track-surface) 94%, black), rgba(5,5,5,.96))' }}
          >
            {currentTrack.wideCoverUrl && (
              <img src={asset(currentTrack.wideCoverUrl)} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-[0.1] blur-xl saturate-150" />
            )}
            <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'radial-gradient(circle at 12% 20%, color-mix(in srgb, var(--track-accent) 16%, transparent), transparent 34%), radial-gradient(circle at 82% 30%, color-mix(in srgb, var(--track-secondary) 12%, transparent), transparent 38%)' }} />

            <div className="absolute inset-x-0 top-0 z-20 h-2">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/[0.07]">
                <motion.div className="h-full origin-left" animate={{ scaleX: progress }} transition={{ duration: 0.18, ease: 'linear' }} style={{ backgroundColor: 'var(--track-accent)' }} />
              </div>
              <input
                type="range"
                min={0}
                max={totalDuration || 1}
                step="0.1"
                value={Math.min(currentTime, totalDuration || 1)}
                onInput={(event) => seekTo(Number(event.currentTarget.value))}
                aria-label="Позиция текущего релиза"
                aria-valuetext={`${formatTime(currentTime)} из ${formatTime(totalDuration)}`}
                className="absolute inset-0 h-3 w-full cursor-pointer opacity-0"
              />
            </div>

            <div className="flex min-w-0 items-center gap-3 p-2.5 pr-3 sm:gap-4 sm:p-3 sm:pr-4">
              <Link to={`/music/${currentTrack.id}`} className="relative h-14 w-14 flex-none overflow-hidden rounded-2xl border border-white/10 bg-black sm:h-16 sm:w-16" aria-label={`Открыть релиз «${currentTrack.title}»`}>
                {currentTrack.coverUrl && <img src={asset(currentTrack.coverUrl)} alt="" className="h-full w-full object-cover" />}
                <span className={`absolute inset-0 transition ${playing ? 'bg-transparent' : 'bg-black/8'}`} />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/38" aria-live="polite">
                  <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'animate-pulse' : ''}`} style={{ backgroundColor: playing ? 'var(--track-secondary)' : status === 'error' ? '#fbbf24' : 'rgba(255,255,255,.25)' }} />
                  {status === 'error'
                    ? failure?.message ?? 'Ошибка воспроизведения'
                    : ended
                      ? 'Прослушано'
                      : status === 'buffering'
                        ? 'Буферизация'
                        : playing
                          ? 'Сейчас звучит'
                          : busy
                            ? 'Подготовка аудио'
                            : 'Прослушивание приостановлено'}
                </div>
                <Link to={`/music/${currentTrack.id}`} className="block truncate font-serif text-lg font-bold leading-none text-white transition hover:text-[var(--track-accent)] sm:text-xl">{currentTrack.title}</Link>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-white/42">
                  <span className="truncate">{currentTrack.poet}</span>
                  <span className="text-white/16">·</span>
                  <span className="tabular-nums">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
                </div>
              </div>

              <div className="flex flex-none items-center gap-1 sm:gap-1.5">
                <button type="button" onClick={() => { void playPrevious(); }} aria-label="Предыдущий релиз" className="hidden h-10 w-10 items-center justify-center rounded-full text-white/42 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex"><ChevronLeft size={18} /></button>
                <button
                  type="button"
                  onClick={() => { if (status === 'error') retry(); else void toggleTrack(currentTrack); }}
                  aria-label={status === 'error' ? 'Повторить загрузку' : playing ? 'Поставить на паузу' : 'Продолжить воспроизведение'}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-black shadow-[0_0_24px_color-mix(in_srgb,var(--track-accent)_28%,transparent)] transition hover:scale-105 hover:brightness-110 active:scale-95 sm:h-12 sm:w-12"
                  style={{ backgroundColor: status === 'error' ? '#fbbf24' : 'var(--track-accent)' }}
                >
                  {busy && !playing
                    ? <LoaderCircle size={19} className="animate-spin" />
                    : status === 'error'
                      ? <RotateCw size={19} />
                      : playing
                        ? <Pause size={19} fill="currentColor" />
                        : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>
                <button type="button" onClick={() => { void playNext(); }} aria-label="Следующий релиз" className="hidden h-10 w-10 items-center justify-center rounded-full text-white/42 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex"><ChevronRight size={18} /></button>
                <button type="button" onClick={() => openImmersive()} aria-label="Открыть режим погружения" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/42 transition hover:bg-white/[0.06] hover:text-white"><Maximize2 size={17} /></button>
                <button type="button" onClick={closePlayer} aria-label="Закрыть плеер" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/32 transition hover:bg-white/[0.06] hover:text-white"><X size={17} /></button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

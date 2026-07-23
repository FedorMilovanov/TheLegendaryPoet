import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Minimize2, Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { asset } from '../../utils/asset';
import { Link } from '../ui/Link';
import { useAudioPlayer } from './AudioPlayerProvider';
import { getTrackTheme, getTrackThemeStyle } from './trackTheme';

const formatTime = (value: number) => {
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60).toString().padStart(2, '0')}`;
};

export default function ImmersivePlayer() {
  const {
    currentTrack,
    immersiveOpen,
    playing,
    ended,
    currentTime,
    duration,
    buffered,
    toggleTrack,
    seekBy,
    seekTo,
    playNext,
    playPrevious,
    closeImmersive,
  } = useAudioPlayer();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const waveform = useMemo(
    () => currentTrack?.waveform?.length
      ? currentTrack.waveform
      : Array.from({ length: 96 }, (_, index) => 0.24 + ((index * 19) % 68) / 100),
    [currentTrack?.waveform],
  );

  useEffect(() => {
    if (!immersiveOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.tagName === 'INPUT' || target?.tagName === 'BUTTON' || target?.tagName === 'A';
      if (event.key === 'Escape') {
        event.preventDefault();
        closeImmersive();
      } else if (!interactive && event.code === 'Space' && currentTrack) {
        event.preventDefault();
        void toggleTrack(currentTrack);
      } else if (!interactive && event.key === 'ArrowLeft') {
        event.preventDefault();
        seekBy(-10);
      } else if (!interactive && event.key === 'ArrowRight') {
        event.preventDefault();
        seekBy(10);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [closeImmersive, currentTrack, immersiveOpen, seekBy, toggleTrack]);

  if (typeof document === 'undefined') return null;

  const content = (
    <AnimatePresence>
      {immersiveOpen && currentTrack && (() => {
        const theme = getTrackTheme(currentTrack);
        const totalDuration = duration || currentTrack.durationSeconds || 0;
        const progress = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;
        const bufferedProgress = totalDuration > 0 ? Math.min(1, buffered / totalDuration) : 0;

        return (
          <motion.div
            key={currentTrack.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-[110] isolate overflow-hidden bg-[#030405] text-white"
            role="dialog"
            aria-modal="true"
            aria-label={`Режим погружения: ${currentTrack.title}`}
            style={getTrackThemeStyle(currentTrack)}
          >
            {currentTrack.wideCoverUrl && (
              <motion.img
                src={asset(currentTrack.wideCoverUrl)}
                alt=""
                aria-hidden="true"
                initial={{ scale: 1.06, opacity: 0 }}
                animate={{ scale: playing ? 1.025 : 1.04, opacity: 0.72 }}
                exit={{ scale: 1.07, opacity: 0 }}
                transition={{ scale: { duration: 8, ease: 'easeOut' }, opacity: { duration: 0.7 } }}
                className="absolute inset-0 -z-30 h-full w-full object-cover"
                style={{ objectPosition: theme.heroPosition }}
              />
            )}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(3,4,5,.93)_0%,rgba(3,4,5,.62)_44%,rgba(3,4,5,.36)_70%,rgba(3,4,5,.78)_100%)]" />
            <div className="absolute inset-0 -z-20 bg-gradient-to-b from-black/20 via-transparent to-[#030405]" />
            <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(circle at 22% 28%, color-mix(in srgb, var(--track-accent) 16%, transparent), transparent 32%), radial-gradient(circle at 76% 34%, color-mix(in srgb, var(--track-secondary) 14%, transparent), transparent 30%)' }} />
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />

            <button ref={closeButtonRef} type="button" onClick={closeImmersive} className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-black/32 px-4 text-xs font-bold text-white/64 backdrop-blur-xl transition hover:border-white/30 hover:bg-black/48 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-7 sm:top-7"><Minimize2 size={16} /> Выйти</button>

            <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-8 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-16 lg:px-12">
              <motion.div initial={{ opacity: 0, x: -26 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12, duration: 0.65, ease: [0.16, 1, 0.3, 1] }} className="relative mx-auto w-full max-w-[420px]">
                <div className="absolute -inset-10 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--track-secondary) 20%, transparent), transparent 68%)' }} />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/16 bg-black shadow-[0_45px_130px_rgba(0,0,0,.72)]">
                  {currentTrack.coverUrl && <img src={asset(currentTrack.coverUrl)} alt={`Обложка «${currentTrack.title}»`} className={`aspect-square w-full object-cover transition duration-[2400ms] ease-out ${playing ? 'scale-[1.03] saturate-[1.08]' : 'scale-100'}`} />}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-white/[0.06]" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/42 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.16em] text-white/54 backdrop-blur-xl">
                    <span>{playing ? 'Сейчас звучит' : ended ? 'Прослушано' : 'Пауза'}</span>
                    <span className="tabular-nums">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="min-w-0">
                <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'var(--track-accent)' }}>The Legendary Poet · Режим погружения</div>
                <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[0.9] drop-shadow-[0_8px_45px_rgba(0,0,0,.75)] sm:text-7xl lg:text-[5.8rem]">{currentTrack.title}</h1>
                <p className="mt-5 text-lg text-white/64 sm:text-xl">{currentTrack.poet}</p>
                {currentTrack.description && <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/48 sm:text-base">{currentTrack.description}</p>}

                <div className="mt-10">
                  <div className="relative flex h-28 items-center gap-[2px] overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/26 px-4 shadow-inner shadow-black/50">
                    {waveform.map((peak, index) => {
                      const point = (index + 0.5) / waveform.length;
                      const state = point <= progress ? 'played' : point <= bufferedProgress ? 'buffered' : 'idle';
                      return (
                        <span
                          key={index}
                          aria-hidden="true"
                          className="min-w-[2px] flex-1 rounded-full transition duration-300"
                          style={{
                            height: `${Math.max(8, peak * 92)}%`,
                            backgroundColor: state === 'played' ? 'var(--track-accent)' : state === 'buffered' ? 'color-mix(in srgb, var(--track-secondary) 38%, transparent)' : 'rgba(255,255,255,.12)',
                            boxShadow: state === 'played' ? '0 0 8px color-mix(in srgb, var(--track-accent) 28%, transparent)' : undefined,
                          }}
                        />
                      );
                    })}
                    <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-white/70 shadow-[0_0_12px_rgba(255,255,255,.46)]" style={{ left: `${progress * 100}%` }} />
                    <input type="range" min={0} max={totalDuration || 1} step="0.1" value={Math.min(currentTime, totalDuration || 1)} onInput={(event) => seekTo(Number(event.currentTarget.value))} aria-label="Позиция воспроизведения" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => { void playPrevious(); }} aria-label="Предыдущий релиз" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/18 text-white/54 transition hover:border-white/25 hover:text-white"><ChevronLeft size={20} /></button>
                  <button type="button" onClick={() => seekBy(-10)} aria-label="Назад на 10 секунд" className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/18 text-white/54 transition hover:border-white/25 hover:text-white"><RotateCcw size={19} /><span className="absolute text-[8px] font-black">10</span></button>
                  <button type="button" onClick={() => { void toggleTrack(currentTrack); }} aria-label={playing ? 'Пауза' : 'Воспроизвести'} className="inline-flex h-16 min-w-16 items-center justify-center rounded-full px-6 text-black shadow-[0_0_42px_color-mix(in_srgb,var(--track-accent)_34%,transparent)] transition hover:scale-105 hover:brightness-110 active:scale-95" style={{ backgroundColor: 'var(--track-accent)' }}>{playing ? <Pause size={25} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}</button>
                  <button type="button" onClick={() => seekBy(10)} aria-label="Вперёд на 10 секунд" className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/18 text-white/54 transition hover:border-white/25 hover:text-white"><RotateCw size={19} /><span className="absolute text-[8px] font-black">10</span></button>
                  <button type="button" onClick={() => { void playNext(); }} aria-label="Следующий релиз" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/18 text-white/54 transition hover:border-white/25 hover:text-white"><ChevronRight size={20} /></button>
                  <Link to={`/music/${currentTrack.id}`} onClick={closeImmersive} className="ml-0 inline-flex min-h-12 items-center rounded-full border border-white/10 px-5 text-xs font-bold text-white/52 transition hover:border-white/25 hover:text-white sm:ml-3">Страница релиза</Link>
                </div>

                {ended && (
                  <div className="mt-7 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white/54">
                    <span>Произведение прослушано полностью.</span>
                    <button type="button" onClick={() => { void playNext(); }} className="font-bold transition hover:text-white" style={{ color: 'var(--track-accent)' }}>Перейти к следующему релизу</button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

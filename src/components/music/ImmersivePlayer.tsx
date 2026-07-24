import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useDialogSurface } from '../../hooks/useDialogSurface';
import ResilientImage from '../media/ResilientImage';
import { Link } from '../ui/Link';
import { useAudioPlayer } from './AudioPlayerProvider';
import { formatAudioTime } from './audioPresentation';
import { getTrackTheme, getTrackThemeStyle } from './trackTheme';

export default function ImmersivePlayer() {
  const {
    currentTrack,
    immersiveOpen,
    playing,
    ended,
    status,
    failure,
    currentTime,
    duration,
    buffered,
    volume,
    muted,
    toggleTrack,
    retry,
    seekBy,
    seekTo,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
    closeImmersive,
  } = useAudioPlayer();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { isTopmost } = useDialogSurface({
    open: immersiveOpen && Boolean(currentTrack),
    dialogRef,
    initialFocusRef: closeButtonRef,
    onClose: closeImmersive,
    label: 'immersive-player',
  });

  const waveform = useMemo(
    () => currentTrack?.waveform?.length
      ? currentTrack.waveform
      : Array.from({ length: 96 }, (_, index) => 0.24 + ((index * 19) % 68) / 100),
    [currentTrack?.waveform],
  );

  useEffect(() => {
    if (!immersiveOpen) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!isTopmost()) return;
      const target = event.target as HTMLElement | null;
      const interactive = target?.matches('input, button, a, select, textarea, summary, [contenteditable="true"]') ?? false;

      if (!interactive && event.code === 'Space' && currentTrack) {
        event.preventDefault();
        void toggleTrack(currentTrack);
      } else if (!interactive && event.key === 'ArrowLeft') {
        event.preventDefault();
        seekBy(-10);
      } else if (!interactive && event.key === 'ArrowRight') {
        event.preventDefault();
        seekBy(10);
      } else if (!interactive && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentTrack, immersiveOpen, isTopmost, seekBy, toggleMute, toggleTrack]);

  if (typeof document === 'undefined') return null;

  const content = (
    <AnimatePresence>
      {immersiveOpen && currentTrack && (() => {
        const theme = getTrackTheme(currentTrack);
        const totalDuration = duration || currentTrack.durationSeconds || 0;
        const progress = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;
        const bufferedProgress = totalDuration > 0 ? Math.min(1, buffered / totalDuration) : 0;
        const busy = status === 'loading' || status === 'buffering';
        const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

        return (
          <motion.div
            ref={dialogRef}
            key={currentTrack.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-[110] isolate overflow-y-auto overscroll-contain bg-[#030405] text-white outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="immersive-track-title"
            aria-describedby={currentTrack.description ? 'immersive-track-description' : undefined}
            tabIndex={-1}
            style={getTrackThemeStyle(currentTrack)}
          >
            {currentTrack.wideCoverUrl && (
              <motion.div
                initial={{ scale: 1.06, opacity: 0 }}
                animate={{ scale: playing ? 1.025 : 1.04, opacity: 0.72 }}
                exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
                transition={{ scale: { duration: 8, ease: 'easeOut' }, opacity: { duration: 0.7 } }}
                className="fixed inset-0 -z-30"
              >
                <ResilientImage
                  src={currentTrack.wideCoverUrl}
                  alt=""
                  aria-hidden="true"
                  priority
                  sizes="100vw"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: theme.heroPosition }}
                />
              </motion.div>
            )}
            <div className="fixed inset-0 -z-20 bg-[linear-gradient(90deg,rgba(3,4,5,.94)_0%,rgba(3,4,5,.64)_44%,rgba(3,4,5,.4)_70%,rgba(3,4,5,.8)_100%)]" />
            <div className="fixed inset-0 -z-20 bg-gradient-to-b from-black/20 via-transparent to-[#030405]" />
            <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(circle at 22% 28%, color-mix(in srgb, var(--track-accent) 16%, transparent), transparent 32%), radial-gradient(circle at 76% 34%, color-mix(in srgb, var(--track-secondary) 14%, transparent), transparent 30%)' }} />
            <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />

            <button ref={closeButtonRef} type="button" onClick={closeImmersive} className="fixed right-4 top-[calc(1rem_+_env(safe-area-inset-top))] z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-black/48 px-4 text-xs font-bold text-white/68 shadow-xl backdrop-blur-xl transition hover:border-white/30 hover:bg-black/62 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-7 sm:top-7"><Minimize2 size={16} /> Выйти</button>

            <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-8 px-5 pb-[calc(4rem_+_env(safe-area-inset-bottom))] pt-[calc(6.5rem_+_env(safe-area-inset-top))] sm:px-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-16 lg:px-12">
              <motion.div initial={{ opacity: 0, x: -26 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12, duration: 0.65, ease: [0.16, 1, 0.3, 1] }} className="relative mx-auto w-full max-w-[min(72vw,420px)] lg:max-w-[420px]">
                <div className="absolute -inset-10 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--track-secondary) 20%, transparent), transparent 68%)' }} />
                <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/16 bg-black shadow-[0_45px_130px_rgba(0,0,0,.72)]">
                  {currentTrack.coverUrl && (
                    <ResilientImage
                      src={currentTrack.coverUrl}
                      alt={`Обложка «${currentTrack.title}»`}
                      priority
                      sizes="(min-width: 1024px) 420px, 72vw"
                      className={`h-full w-full object-cover transition duration-[2400ms] ease-out ${playing ? 'scale-[1.03] saturate-[1.08]' : 'scale-100'}`}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-white/[0.06]" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/46 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.16em] text-white/58 backdrop-blur-xl">
                    <span aria-live="polite">{status === 'error' ? 'Нужна повторная загрузка' : busy ? 'Подготовка аудио' : playing ? 'Сейчас звучит' : ended ? 'Прослушано' : 'Пауза'}</span>
                    <span className="tabular-nums">{formatAudioTime(currentTime)} / {formatAudioTime(totalDuration)}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="min-w-0">
                <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'var(--track-accent)' }}>The Legendary Poet · Режим погружения</div>
                <h1 id="immersive-track-title" className="max-w-4xl font-serif text-4xl font-bold leading-[0.92] drop-shadow-[0_8px_45px_rgba(0,0,0,.75)] sm:text-6xl lg:text-[5.8rem]">{currentTrack.title}</h1>
                <p className="mt-5 text-lg text-white/64 sm:text-xl">{currentTrack.poet}</p>
                {currentTrack.description && <p id="immersive-track-description" className="mt-6 max-w-2xl text-sm leading-relaxed text-white/52 sm:text-base">{currentTrack.description}</p>}

                <div className="mt-8 sm:mt-10">
                  <div className="relative flex h-24 items-center gap-[2px] overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/30 px-4 shadow-inner shadow-black/50 sm:h-28">
                    {waveform.map((peak, index) => {
                      const point = (index + 0.5) / waveform.length;
                      const waveState = point <= progress ? 'played' : point <= bufferedProgress ? 'buffered' : 'idle';
                      return (
                        <span
                          key={index}
                          aria-hidden="true"
                          className="min-w-[2px] flex-1 rounded-full transition duration-300"
                          style={{
                            height: `${Math.max(8, peak * 92)}%`,
                            backgroundColor: waveState === 'played' ? 'var(--track-accent)' : waveState === 'buffered' ? 'color-mix(in srgb, var(--track-secondary) 38%, transparent)' : 'rgba(255,255,255,.12)',
                            boxShadow: waveState === 'played' ? '0 0 8px color-mix(in srgb, var(--track-accent) 28%, transparent)' : undefined,
                          }}
                        />
                      );
                    })}
                    <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-white/70 shadow-[0_0_12px_rgba(255,255,255,.46)]" style={{ left: `${progress * 100}%` }} />
                    <input type="range" min={0} max={totalDuration || 1} step="0.1" value={Math.min(currentTime, totalDuration || 1)} disabled={status === 'error'} onInput={(event) => seekTo(Number(event.currentTarget.value))} aria-label="Позиция воспроизведения" aria-valuetext={`${formatAudioTime(currentTime)} из ${formatAudioTime(totalDuration)}`} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
                  </div>
                </div>

                {status === 'error' && (
                  <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/16 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-50/72" role="alert">
                    <span className="flex-1">{failure?.message ?? 'Не удалось загрузить аудио.'}</span>
                    <button type="button" onClick={retry} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-300 px-4 text-xs font-bold text-black transition hover:brightness-110"><RotateCw size={15} /> Повторить</button>
                  </div>
                )}

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => { void playPrevious(); }} aria-label="Предыдущий релиз" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/22 text-white/58 transition hover:border-white/25 hover:text-white"><ChevronLeft size={20} /></button>
                  <button type="button" onClick={() => seekBy(-10)} disabled={status === 'error'} aria-label="Назад на 10 секунд" className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/22 text-white/58 transition hover:border-white/25 hover:text-white disabled:opacity-35"><RotateCcw size={19} /><span className="absolute text-[8px] font-black">10</span></button>
                  <button type="button" onClick={() => { if (status === 'error') retry(); else void toggleTrack(currentTrack); }} aria-label={status === 'error' ? 'Повторить загрузку' : playing ? 'Пауза' : 'Воспроизвести'} className="inline-flex h-16 min-w-16 items-center justify-center rounded-full px-6 text-black shadow-[0_0_42px_color-mix(in_srgb,var(--track-accent)_34%,transparent)] transition hover:scale-105 hover:brightness-110 active:scale-95" style={{ backgroundColor: status === 'error' ? '#fbbf24' : 'var(--track-accent)' }}>{busy && !playing ? <LoaderCircle size={25} className="animate-spin" /> : status === 'error' ? <RotateCw size={25} /> : playing ? <Pause size={25} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}</button>
                  <button type="button" onClick={() => seekBy(10)} disabled={status === 'error'} aria-label="Вперёд на 10 секунд" className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/22 text-white/58 transition hover:border-white/25 hover:text-white disabled:opacity-35"><RotateCw size={19} /><span className="absolute text-[8px] font-black">10</span></button>
                  <button type="button" onClick={() => { void playNext(); }} aria-label="Следующий релиз" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/22 text-white/58 transition hover:border-white/25 hover:text-white"><ChevronRight size={20} /></button>
                  <button type="button" onClick={toggleMute} aria-label={muted ? 'Включить звук' : 'Выключить звук'} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/22 text-white/58 transition hover:border-white/25 hover:text-white"><VolumeIcon size={19} /></button>
                  <div className="hidden min-w-32 items-center gap-2 sm:flex">
                    <input type="range" min="0" max="1" step="0.02" value={muted ? 0 : volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Громкость" className="w-28 accent-[var(--track-secondary)]" />
                    <span className="w-8 text-right text-[10px] tabular-nums text-white/38">{Math.round((muted ? 0 : volume) * 100)}%</span>
                  </div>
                  <Link to={`/music/${currentTrack.id}`} onClick={closeImmersive} className="inline-flex min-h-12 items-center rounded-full border border-white/10 px-5 text-xs font-bold text-white/52 transition hover:border-white/25 hover:text-white sm:ml-2">Страница релиза</Link>
                </div>

                {ended && (
                  <div className="mt-7 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/28 px-4 py-3 text-sm text-white/58">
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

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import {
  Check,
  Clock3,
  ExternalLink,
  Headphones,
  LoaderCircle,
  Maximize2,
  Music2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Share2,
  TriangleAlert,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { MusicTrack } from '../../types/poet';
import { asset } from '../../utils/asset';
import { Link } from '../ui/Link';
import { useAudioPlayer, type AudioStatus } from './AudioPlayerProvider';
import { getTrackThemeStyle } from './trackTheme';

const formatTime = (value: number) => {
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60).toString().padStart(2, '0')}`;
};

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

interface FeaturedTrackPlayerProps {
  track: MusicTrack;
  compact?: boolean;
  initialTime?: number;
}

export default function FeaturedTrackPlayer({ track, compact = false, initialTime }: FeaturedTrackPlayerProps) {
  const {
    currentTrack,
    playing,
    status,
    failure,
    currentTime,
    duration,
    buffered,
    volume,
    muted,
    resumeAt,
    loadTrack,
    toggleTrack,
    retry,
    seekTo,
    seekBy,
    restart,
    setVolume,
    toggleMute,
    openImmersive,
    getSavedPosition,
  } = useAudioPlayer();
  const [shareLabel, setShareLabel] = useState('Поделиться');
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeControlRef = useRef<HTMLDivElement>(null);

  const isActive = currentTrack?.id === track.id;
  const savedPosition = getSavedPosition(track.id);
  const playerStatus: AudioStatus = isActive ? status : 'idle';
  const position = isActive ? currentTime : savedPosition;
  const totalDuration = isActive ? (duration || track.durationSeconds || 0) : (track.durationSeconds || 0);
  const trackPlaying = isActive && playing;
  const progress = totalDuration > 0 ? Math.min(1, position / totalDuration) : 0;
  const bufferedProgress = isActive && totalDuration > 0 ? Math.min(1, buffered / totalDuration) : 0;
  const restoredPosition = isActive ? resumeAt : savedPosition >= 8 ? savedPosition : null;
  const unavailable = !track.audioUrl;
  const recoverableError = isActive && playerStatus === 'error';
  const busy = playerStatus === 'loading' || playerStatus === 'buffering';

  const waveform = useMemo(
    () => track.waveform?.length
      ? track.waveform
      : Array.from({ length: 88 }, (_, index) => 0.24 + ((index * 17) % 68) / 100),
    [track.waveform],
  );

  useEffect(() => {
    if (initialTime === undefined || !Number.isFinite(initialTime) || initialTime < 0) return;
    loadTrack(track, { startAt: initialTime, autoplay: false });
  }, [initialTime, loadTrack, track]);

  useEffect(() => {
    if (!volumeOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!volumeControlRef.current?.contains(event.target as Node)) setVolumeOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setVolumeOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [volumeOpen]);

  const toggle = () => {
    if (recoverableError) retry();
    else void toggleTrack(track);
  };

  const seekToTrack = (next: number) => {
    if (isActive) seekTo(next);
    else loadTrack(track, { startAt: next, autoplay: false });
  };

  const seekTrackBy = (delta: number) => {
    if (isActive) seekBy(delta);
    else seekToTrack(position + delta);
  };

  const restartTrack = () => {
    if (isActive) restart();
    else loadTrack(track, { startAt: 0, autoplay: false });
  };

  const share = async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const moment = position >= 5 ? Math.floor(position) : 0;
    const suffix = moment > 0 ? `?t=${moment}` : '';
    const url = `${window.location.origin}${base}/music/${track.id}${suffix}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${track.title} — ${track.poet}`,
          text: moment > 0
            ? `${track.poet} — «${track.title}», момент ${formatTime(moment)}`
            : `${track.poet} — музыкальная версия The Legendary Poet`,
          url,
        });
      } else {
        await copyText(url);
      }
      setShareLabel(moment > 0 ? `Скопировано с ${formatTime(moment)}` : 'Ссылка скопирована');
      window.setTimeout(() => setShareLabel('Поделиться'), 2200);
    } catch {
      // Native share was cancelled or clipboard access was denied.
    }
  };

  const onPlayerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (event.key === 'Escape') {
      setVolumeOpen(false);
      return;
    }
    if (target.matches('input, button, a, select, textarea, [contenteditable="true"]')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      toggle();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      seekTrackBy(-10);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      seekTrackBy(10);
    } else if (event.key.toLowerCase() === 'm') {
      toggleMute();
    }
  };

  const mainButtonLabel = unavailable
    ? 'Недоступно'
    : recoverableError
      ? 'Повторить'
      : busy && !trackPlaying
        ? 'Загрузка'
        : trackPlaying
          ? 'Пауза'
          : position > 1
            ? 'Продолжить'
            : 'Слушать';

  const statusLabel = recoverableError
    ? 'Нужна повторная загрузка'
    : playerStatus === 'buffering'
      ? 'Буферизация'
      : playerStatus === 'loading'
        ? 'Подготовка аудио'
        : trackPlaying
          ? 'Сейчас звучит'
          : isActive && playerStatus === 'ready'
            ? 'Готово к воспроизведению'
            : 'Мастер публикации';

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const themeStyle = getTrackThemeStyle(track);
  const coverTransition = compact
    ? ({ viewTransitionName: `track-cover-${track.id}` } as CSSProperties)
    : undefined;

  return (
    <article
      onKeyDown={onPlayerKeyDown}
      aria-busy={busy}
      style={{
        ...themeStyle,
        backgroundColor: 'var(--track-surface)',
        backgroundImage: 'radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--track-accent) 19%, transparent), transparent 34%), radial-gradient(circle at 88% 12%, color-mix(in srgb, var(--track-secondary) 15%, transparent), transparent 35%), linear-gradient(145deg, rgba(3,10,15,.78), rgba(5,5,5,.94))',
      }}
      className={`group/player relative isolate overflow-hidden border border-white/[0.09] shadow-[0_34px_120px_rgba(0,0,0,0.52)] ${compact ? 'rounded-[2rem] p-4 sm:p-6 lg:p-7' : 'rounded-[2.6rem] p-5 sm:p-8 lg:p-11'}`}
    >
      {track.wideCoverUrl && (
        <img
          src={asset(track.wideCoverUrl)}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-[0.1] blur-2xl saturate-150"
        />
      )}
      <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[var(--track-accent)]/60 to-transparent" />

      <div className={`relative z-10 grid items-center ${compact ? 'gap-6 lg:grid-cols-[230px_1fr]' : 'gap-8 lg:grid-cols-[370px_1fr]'}`}>
        <div className="relative mx-auto w-full max-w-[430px]">
          <div
            className={`absolute -inset-5 rounded-[2.3rem] blur-2xl transition duration-1000 ${trackPlaying ? 'scale-110 opacity-100' : 'scale-95 opacity-35'}`}
            style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--track-secondary) 18%, transparent), transparent 67%)' }}
          />
          <div className="relative overflow-hidden rounded-[1.8rem] border border-white/12 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.62)]">
            {track.coverUrl ? (
              <img
                src={asset(track.coverUrl)}
                alt={`Обложка трека «${track.title}»`}
                draggable={false}
                loading={compact ? 'lazy' : 'eager'}
                style={coverTransition}
                className={`aspect-square w-full select-none object-cover transition duration-[1600ms] ease-out ${trackPlaying ? 'scale-[1.025] saturate-[1.08]' : 'scale-100'}`}
              />
            ) : (
              <div className="aspect-square w-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.12),transparent_60%),#050505]" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-white/[0.07]" />
            <div className="pointer-events-none absolute inset-0 rounded-[1.8rem] ring-1 ring-inset ring-white/[0.06]" />

            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/45 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl" aria-live="polite">
              <span
                className={`h-1.5 w-1.5 rounded-full ${trackPlaying ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: recoverableError ? '#fbbf24' : trackPlaying ? 'var(--track-secondary)' : 'rgba(255,255,255,.3)', boxShadow: trackPlaying ? '0 0 10px var(--track-secondary)' : undefined }}
              />
              {statusLabel}
            </div>

            <button
              type="button"
              onClick={toggle}
              disabled={unavailable}
              aria-label={unavailable ? 'Аудиофайл недоступен' : recoverableError ? 'Повторить загрузку аудио' : trackPlaying ? 'Поставить на паузу' : 'Воспроизвести трек'}
              style={{ backgroundColor: unavailable ? undefined : recoverableError ? '#fbbf24' : 'var(--track-accent)' }}
              className="absolute bottom-5 left-5 inline-flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-white/30 text-black shadow-[0_0_38px_color-mix(in_srgb,var(--track-accent)_42%,transparent)] transition duration-300 hover:scale-105 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35 disabled:shadow-none"
            >
              {busy && !trackPlaying
                ? <LoaderCircle size={26} className="animate-spin" />
                : recoverableError
                  ? <RotateCw size={26} />
                  : trackPlaying
                    ? <Pause size={26} fill="currentColor" />
                    : <Play size={27} fill="currentColor" className="ml-1" />}
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--track-accent)' }}><Music2 size={13} /> Официальный релиз</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/42"><Headphones size={13} /> MP3 · 44.1 kHz</span>
            <span className="inline-flex items-center gap-1.5 px-1 text-xs text-white/40"><Clock3 size={13} /> {track.duration}</span>
          </div>

          <h2 className={`font-serif font-bold leading-[0.98] text-white drop-shadow-[0_8px_35px_rgba(0,0,0,0.55)] ${compact ? 'text-3xl sm:text-4xl lg:text-[2.8rem]' : 'text-4xl sm:text-5xl lg:text-6xl'}`}>{track.title}</h2>
          <p className="mt-3 text-base sm:text-lg" style={{ color: 'color-mix(in srgb, var(--track-accent) 82%, white)' }}>{track.poet} <span className="text-white/22">·</span> The Legendary Poet</p>
          {track.description && <p className={`mt-5 max-w-2xl leading-relaxed text-white/52 ${compact ? 'line-clamp-3 text-sm sm:text-base' : 'text-sm sm:text-base'}`}>{track.description}</p>}

          {restoredPosition !== null && restoredPosition > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-xs text-white/58">
              <Check size={15} style={{ color: 'var(--track-secondary)' }} />
              <span>Продолжение с {formatTime(restoredPosition)}</span>
              <button type="button" onClick={restartTrack} className="font-bold transition hover:text-white" style={{ color: 'var(--track-accent)' }}>Начать сначала</button>
            </div>
          )}

          <div className="mt-7">
            <div className="relative flex h-[5.4rem] items-center gap-[2px] overflow-hidden rounded-[1.15rem] border border-white/[0.08] bg-black/28 px-3 shadow-inner shadow-black/40">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.025] to-transparent" />
              {waveform.map((peak, index) => {
                const point = (index + 0.5) / waveform.length;
                const waveState = point <= progress ? 'played' : point <= bufferedProgress ? 'buffered' : 'idle';
                return (
                  <span
                    key={index}
                    aria-hidden="true"
                    className="relative min-w-[2px] flex-1 rounded-full transition-[background-color,opacity] duration-300"
                    style={{
                      height: `${Math.max(9, peak * 92)}%`,
                      backgroundColor: waveState === 'played'
                        ? 'var(--track-accent)'
                        : waveState === 'buffered'
                          ? 'color-mix(in srgb, var(--track-secondary) 42%, transparent)'
                          : 'rgba(224,242,254,0.13)',
                      boxShadow: waveState === 'played' ? '0 0 7px color-mix(in srgb, var(--track-accent) 25%, transparent)' : undefined,
                    }}
                  />
                );
              })}
              {track.chapters?.map((chapter) => {
                const left = totalDuration > 0 ? Math.min(100, Math.max(0, (chapter.start / totalDuration) * 100)) : 0;
                return (
                  <button
                    key={`${chapter.label}-${chapter.start}`}
                    type="button"
                    onClick={() => seekToTrack(chapter.start)}
                    aria-label={`${chapter.label}, ${formatTime(chapter.start)}`}
                    title={`${chapter.label} · ${formatTime(chapter.start)}`}
                    className="absolute bottom-0 top-0 z-10 w-px bg-white/25 transition hover:bg-white/75"
                    style={{ left: `${left}%` }}
                  />
                );
              })}
              <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-white/65 shadow-[0_0_10px_rgba(255,255,255,0.45)]" style={{ left: `${progress * 100}%` }} />
              <input
                type="range"
                min={0}
                max={totalDuration || 1}
                step="0.1"
                value={Math.min(position, totalDuration || 1)}
                disabled={unavailable || recoverableError}
                onInput={(event) => seekToTrack(Number(event.currentTarget.value))}
                aria-label="Позиция воспроизведения"
                aria-valuetext={`${formatTime(position)} из ${formatTime(totalDuration)}`}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs tabular-nums text-white/40">
              <span className="font-medium text-white/58">{formatTime(position)}</span>
              <span>{playerStatus === 'buffering' ? 'буферизация…' : formatTime(totalDuration)}</span>
            </div>
          </div>

          {recoverableError && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] px-4 py-3 text-xs leading-relaxed text-amber-100/72" role="alert">
              <TriangleAlert size={15} />
              <span className="min-w-0 flex-1">{failure?.message ?? 'Аудиофайл не загрузился.'}</span>
              <button type="button" onClick={retry} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-amber-300 px-3 font-bold text-black transition hover:brightness-110"><RotateCw size={14} /> Повторить</button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={() => seekTrackBy(-10)} disabled={unavailable || recoverableError} aria-label="Назад на 10 секунд" title="Назад на 10 секунд" className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/15 text-white/58 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30"><RotateCcw size={19} /><span className="absolute text-[8px] font-black">10</span></button>

            <button
              type="button"
              onClick={toggle}
              disabled={unavailable}
              style={{ backgroundColor: unavailable ? undefined : recoverableError ? '#fbbf24' : 'var(--track-accent)' }}
              className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-bold text-black shadow-[0_10px_32px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40"
            >
              {busy && !trackPlaying ? <LoaderCircle size={18} className="animate-spin" /> : recoverableError ? <RotateCw size={18} /> : trackPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {mainButtonLabel}
            </button>

            <button type="button" onClick={() => seekTrackBy(10)} disabled={unavailable || recoverableError} aria-label="Вперёд на 10 секунд" title="Вперёд на 10 секунд" className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/15 text-white/58 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30"><RotateCw size={19} /><span className="absolute text-[8px] font-black">10</span></button>

            <div ref={volumeControlRef} className="relative flex items-center">
              <button type="button" onClick={() => { toggleMute(); setVolumeOpen(true); }} aria-label={muted ? 'Включить звук' : 'Выключить звук'} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/15 text-white/58 transition hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><VolumeIcon size={18} /></button>
              <button type="button" onClick={() => setVolumeOpen((value) => !value)} aria-expanded={volumeOpen} aria-label="Настроить громкость" className="ml-1 hidden h-12 items-center px-1 text-[10px] font-bold tabular-nums text-white/35 transition hover:text-white sm:inline-flex">{Math.round((muted ? 0 : volume) * 100)}%</button>
              {volumeOpen && (
                <div className="absolute bottom-14 left-0 z-30 flex w-48 items-center gap-3 rounded-2xl border border-white/12 bg-[#071018]/98 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:left-auto sm:right-0">
                  <Volume1 size={15} className="text-white/35" />
                  <input type="range" min="0" max="1" step="0.02" value={muted ? 0 : volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Громкость" className="w-full accent-[var(--track-secondary)]" />
                  <Volume2 size={15} className="text-white/60" />
                </div>
              )}
            </div>

            <button type="button" onClick={share} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-bold text-white/55 transition hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Share2 size={16} /> {shareLabel}</button>
            <button type="button" onClick={() => openImmersive(track)} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-bold text-white/55 transition hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Maximize2 size={16} /> Погружение</button>
            {compact && <Link to={`/music/${track.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-bold transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" style={{ color: 'var(--track-accent)' }}>Страница релиза <ExternalLink size={15} /></Link>}
          </div>

          {!compact && track.rightsNotice && <p className="mt-6 max-w-2xl border-t border-white/[0.07] pt-4 text-[10px] leading-relaxed text-white/28">{track.rightsNotice}</p>}
        </div>
      </div>
    </article>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  Check,
  Clock3,
  ExternalLink,
  Headphones,
  LoaderCircle,
  Music2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Share2,
  Sparkles,
  TriangleAlert,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MusicTrack } from '../../types/poet';
import { asset } from '../../utils/asset';
import { Link } from '../ui/Link';

const formatTime = (value: number) => {
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60).toString().padStart(2, '0')}`;
};

const readStoredVolume = () => {
  if (typeof window === 'undefined') return 0.9;
  try {
    const stored = window.localStorage.getItem('tlp-audio-volume');
    if (stored === null) return 0.9;
    const value = Number(stored);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.9;
  } catch {
    return 0.9;
  }
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

type AudioStatus = 'idle' | 'loading' | 'ready' | 'buffering' | 'error';

export default function FeaturedTrackPlayer({ track, compact = false }: { track: MusicTrack; compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(track.durationSeconds ?? 0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(readStoredVolume);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [shareLabel, setShareLabel] = useState('Поделиться');
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [volumeOpen, setVolumeOpen] = useState(false);

  const waveform = useMemo(
    () => track.waveform?.length
      ? track.waveform
      : Array.from({ length: 88 }, (_, index) => 0.24 + ((index * 17) % 68) / 100),
    [track.waveform],
  );

  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const bufferedProgress = duration > 0 ? Math.min(1, buffered / duration) : 0;
  const unavailable = !track.audioUrl || status === 'error';
  const progressKey = `tlp-audio-position:${track.id}`;

  useEffect(() => {
    try { window.localStorage.setItem('tlp-audio-volume', String(volume)); } catch { /* storage unavailable */ }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlaying(false);
    setCurrent(0);
    setBuffered(0);
    setResumeAt(null);
    setStatus('idle');
    lastSavedRef.current = 0;

    const updateBuffered = () => {
      if (!audio.buffered.length) return setBuffered(0);
      setBuffered(audio.buffered.end(audio.buffered.length - 1));
    };

    const setMediaHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      if (!('mediaSession' in navigator)) return;
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* action unsupported */ }
    };

    const configureMediaSession = () => {
      if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: `${track.poet} · The Legendary Poet`,
        album: 'Музыкальные интерпретации русской поэзии',
        artwork: track.coverUrl
          ? [{ src: asset(track.coverUrl), sizes: '1400x1400', type: 'image/webp' }]
          : undefined,
      });

      setMediaHandler('play', () => { void audio.play(); });
      setMediaHandler('pause', () => audio.pause());
      setMediaHandler('stop', () => {
        audio.pause();
        audio.currentTime = 0;
      });
      setMediaHandler('seekbackward', (details) => {
        audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset ?? 10));
      });
      setMediaHandler('seekforward', (details) => {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (details.seekOffset ?? 10));
      });
      setMediaHandler('seekto', (details) => {
        if (details.seekTime === undefined) return;
        if (details.fastSeek && typeof audio.fastSeek === 'function') audio.fastSeek(details.seekTime);
        else audio.currentTime = Math.max(0, Math.min(audio.duration || 0, details.seekTime));
      });
    };

    const updatePositionState = () => {
      if (!('mediaSession' in navigator) || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: Math.min(audio.currentTime, audio.duration),
        });
      } catch { /* transient browser state */ }
    };

    const syncTime = () => {
      setCurrent(audio.currentTime);
      updatePositionState();

      if (!audio.ended && audio.currentTime > 4 && Math.abs(audio.currentTime - lastSavedRef.current) >= 3) {
        lastSavedRef.current = audio.currentTime;
        try { window.localStorage.setItem(progressKey, String(audio.currentTime)); } catch { /* storage unavailable */ }
      }
    };

    const syncDuration = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : track.durationSeconds ?? 0;
      setDuration(nextDuration);
      updateBuffered();

      if (!nextDuration || audio.currentTime > 0) return;
      try {
        const stored = Number(window.localStorage.getItem(progressKey));
        if (Number.isFinite(stored) && stored >= 8 && stored < nextDuration - 10) {
          audio.currentTime = stored;
          setCurrent(stored);
          setResumeAt(stored);
          lastSavedRef.current = stored;
        }
      } catch { /* storage unavailable */ }
    };

    const onLoadStart = () => setStatus('loading');
    const onCanPlay = () => setStatus('ready');
    const onWaiting = () => { if (!audio.paused) setStatus('buffering'); };
    const onError = () => { setStatus('error'); setPlaying(false); };
    const onPlay = () => {
      setPlaying(true);
      setStatus('ready');
      configureMediaSession();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      window.dispatchEvent(new CustomEvent('tlp-audio-playing', { detail: track.id }));
    };
    const onPause = () => {
      setPlaying(false);
      setStatus((value) => value === 'error' ? value : 'ready');
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
      setResumeAt(null);
      try { window.localStorage.removeItem(progressKey); } catch { /* storage unavailable */ }
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
    };
    const onOther = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== track.id) audio.pause();
    };

    audio.addEventListener('timeupdate', syncTime);
    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);
    audio.addEventListener('progress', updateBuffered);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('playing', onCanPlay);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onWaiting);
    audio.addEventListener('error', onError);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    window.addEventListener('tlp-audio-playing', onOther);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', syncTime);
      audio.removeEventListener('loadedmetadata', syncDuration);
      audio.removeEventListener('durationchange', syncDuration);
      audio.removeEventListener('progress', updateBuffered);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('playing', onCanPlay);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onWaiting);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
      window.removeEventListener('tlp-audio-playing', onOther);
      setMediaHandler('play', null);
      setMediaHandler('pause', null);
      setMediaHandler('stop', null);
      setMediaHandler('seekbackward', null);
      setMediaHandler('seekforward', null);
      setMediaHandler('seekto', null);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
    };
  }, [progressKey, track.audioUrl, track.coverUrl, track.durationSeconds, track.id, track.poet, track.title]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || unavailable) return;
    if (audio.paused) {
      setStatus('loading');
      try { await audio.play(); } catch { setStatus('error'); setPlaying(false); }
    } else {
      audio.pause();
    }
  };

  const seekTo = (next: number) => {
    const audio = audioRef.current;
    if (!audio || unavailable) return;
    const safe = Math.max(0, Math.min(duration || audio.duration || 0, next));
    audio.currentTime = safe;
    setCurrent(safe);
    setResumeAt(null);
  };

  const seekBy = (delta: number) => seekTo(current + delta);

  const restart = () => {
    seekTo(0);
    try { window.localStorage.removeItem(progressKey); } catch { /* storage unavailable */ }
  };

  const toggleMute = () => {
    if (muted || volume === 0) {
      if (volume === 0) setVolume(0.75);
      setMuted(false);
    } else {
      setMuted(true);
    }
    setVolumeOpen(true);
  };

  const share = async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const url = `${window.location.origin}${base}/music/${track.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${track.title} — ${track.poet}`,
          text: `${track.poet} — музыкальная версия The Legendary Poet`,
          url,
        });
      } else {
        await copyText(url);
      }
      setShareLabel('Ссылка скопирована');
      window.setTimeout(() => setShareLabel('Поделиться'), 1800);
    } catch { /* sharing cancelled */ }
  };

  const onPlayerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (event.key === 'Escape') {
      setVolumeOpen(false);
      return;
    }
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A') return;
    if (event.code === 'Space') {
      event.preventDefault();
      void toggle();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      seekBy(-10);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      seekBy(10);
    } else if (event.key.toLowerCase() === 'm') {
      toggleMute();
    }
  };

  const mainButtonLabel = unavailable
    ? 'Недоступно'
    : (status === 'loading' || status === 'buffering') && !playing
      ? 'Загрузка'
      : playing
        ? 'Пауза'
        : current > 1
          ? 'Продолжить'
          : 'Слушать';

  const statusLabel = status === 'buffering'
    ? 'Буферизация'
    : status === 'loading'
      ? 'Подготовка аудио'
      : playing
        ? 'Сейчас звучит'
        : status === 'ready'
          ? 'Готово к воспроизведению'
          : 'Мастер публикации';

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <article
      onKeyDown={onPlayerKeyDown}
      aria-busy={status === 'loading' || status === 'buffering'}
      className={`group/player relative isolate overflow-hidden border border-luxury-gold/15 bg-[#061018]/94 shadow-[0_34px_120px_rgba(0,0,0,0.52)] ${compact ? 'rounded-[2rem] p-4 sm:p-6 lg:p-7' : 'rounded-[2.6rem] p-5 sm:p-8 lg:p-11'}`}
    >
      {track.wideCoverUrl && (
        <img
          src={asset(track.wideCoverUrl)}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-[0.09] blur-2xl saturate-150"
        />
      )}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(212,175,55,0.18),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(0,212,255,0.13),transparent_34%),linear-gradient(145deg,rgba(3,10,15,0.78),rgba(5,5,5,0.93))]" />
      <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-luxury-gold/45 to-transparent" />

      <div className={`relative z-10 grid items-center ${compact ? 'gap-6 lg:grid-cols-[230px_1fr]' : 'gap-8 lg:grid-cols-[370px_1fr]'}`}>
        <div className="relative mx-auto w-full max-w-[430px]">
          <div className={`absolute -inset-5 rounded-[2.3rem] bg-[radial-gradient(circle,rgba(0,212,255,0.16),transparent_67%)] blur-2xl transition duration-1000 ${playing ? 'scale-110 opacity-100' : 'scale-95 opacity-35'}`} />
          <div className="relative overflow-hidden rounded-[1.8rem] border border-white/12 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.62)]">
            {track.coverUrl ? (
              <img
                src={asset(track.coverUrl)}
                alt={`Обложка трека «${track.title}»`}
                draggable={false}
                loading={compact ? 'lazy' : 'eager'}
                className={`aspect-square w-full select-none object-cover transition duration-[1600ms] ease-out ${playing ? 'scale-[1.025] saturate-[1.08]' : 'scale-100'}`}
              />
            ) : (
              <div className="aspect-square w-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.12),transparent_60%),#050505]" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-white/[0.07]" />
            <div className="pointer-events-none absolute inset-0 rounded-[1.8rem] ring-1 ring-inset ring-white/[0.06]" />

            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/45 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl">
              <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'animate-pulse bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]' : 'bg-white/30'}`} />
              {statusLabel}
            </div>

            <button
              type="button"
              onClick={toggle}
              disabled={unavailable}
              aria-label={unavailable ? 'Аудиофайл недоступен' : playing ? 'Поставить на паузу' : 'Воспроизвести трек'}
              className="absolute bottom-5 left-5 inline-flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-white/30 bg-luxury-gold text-black shadow-[0_0_38px_rgba(212,175,55,0.43)] transition duration-300 hover:scale-105 hover:bg-[#f0d36d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35 disabled:shadow-none"
            >
              {(status === 'loading' || status === 'buffering') && !playing
                ? <LoaderCircle size={26} className="animate-spin" />
                : playing
                  ? <Pause size={26} fill="currentColor" />
                  : <Play size={27} fill="currentColor" className="ml-1" />}
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-luxury-gold/22 bg-luxury-gold/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-luxury-gold"><Music2 size={13} /> Официальный релиз</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/10 bg-cyan-300/[0.035] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100/42"><Headphones size={13} /> MP3 · 44.1 kHz</span>
            <span className="inline-flex items-center gap-1.5 px-1 text-xs text-cyan-100/40"><Clock3 size={13} /> {track.duration}</span>
          </div>

          <h2 className={`font-serif font-bold leading-[0.98] text-white drop-shadow-[0_8px_35px_rgba(0,0,0,0.55)] ${compact ? 'text-3xl sm:text-4xl lg:text-[2.8rem]' : 'text-4xl sm:text-5xl lg:text-6xl'}`}>{track.title}</h2>
          <p className="mt-3 text-base text-luxury-gold/78 sm:text-lg">{track.poet} <span className="text-white/22">·</span> The Legendary Poet</p>
          {track.description && <p className={`mt-5 max-w-2xl leading-relaxed text-cyan-100/52 ${compact ? 'line-clamp-3 text-sm sm:text-base' : 'text-sm sm:text-base'}`}>{track.description}</p>}

          {resumeAt !== null && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] px-4 py-3 text-xs text-cyan-100/58">
              <Check size={15} className="text-cyan-300" />
              <span>Продолжено с {formatTime(resumeAt)}</span>
              <button type="button" onClick={restart} className="font-bold text-luxury-gold transition hover:text-white">Начать сначала</button>
            </div>
          )}

          <div className="mt-7">
            <div className="relative flex h-[5.4rem] items-center gap-[2px] overflow-hidden rounded-[1.15rem] border border-cyan-400/10 bg-black/28 px-3 shadow-inner shadow-black/40">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.025] to-transparent" />
              {waveform.map((peak, index) => {
                const position = (index + 0.5) / waveform.length;
                const state = position <= progress ? 'played' : position <= bufferedProgress ? 'buffered' : 'idle';
                return (
                  <span
                    key={index}
                    aria-hidden="true"
                    className={`relative min-w-[2px] flex-1 rounded-full transition-[background-color,opacity] duration-300 ${state === 'played' ? 'bg-luxury-gold shadow-[0_0_7px_rgba(212,175,55,0.22)]' : state === 'buffered' ? 'bg-cyan-200/32' : 'bg-cyan-100/13'}`}
                    style={{ height: `${Math.max(9, peak * 92)}%` }}
                  />
                );
              })}
              <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-white/65 shadow-[0_0_10px_rgba(255,255,255,0.45)]" style={{ left: `${progress * 100}%` }} />
              <input
                type="range"
                min={0}
                max={duration || 1}
                step="0.1"
                value={Math.min(current, duration || 1)}
                disabled={unavailable}
                onInput={(event) => seekTo(Number(event.currentTarget.value))}
                aria-label="Позиция воспроизведения"
                aria-valuetext={`${formatTime(current)} из ${formatTime(duration || track.durationSeconds || 0)}`}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs tabular-nums text-cyan-100/40">
              <span className="font-medium text-cyan-100/58">{formatTime(current)}</span>
              <span>{status === 'buffering' ? 'буферизация…' : formatTime(duration || track.durationSeconds || 0)}</span>
            </div>
          </div>

          {status === 'error' && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] px-4 py-3 text-xs leading-relaxed text-amber-100/68">
              <TriangleAlert size={15} /> Аудиофайл не загрузился. Проверьте соединение и повторите попытку.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={() => seekBy(-10)} disabled={unavailable} aria-label="Назад на 10 секунд" title="Назад на 10 секунд" className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/14 bg-black/15 text-cyan-100/58 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.05] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-30"><RotateCcw size={19} /><span className="absolute text-[8px] font-black">10</span></button>

            <button
              type="button"
              onClick={toggle}
              disabled={unavailable}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-luxury-gold px-6 text-sm font-bold text-black shadow-[0_10px_32px_rgba(212,175,55,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#f0d36d] hover:shadow-[0_0_32px_rgba(212,175,55,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {(status === 'loading' || status === 'buffering') && !playing ? <LoaderCircle size={18} className="animate-spin" /> : playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {mainButtonLabel}
            </button>

            <button type="button" onClick={() => seekBy(10)} disabled={unavailable} aria-label="Вперёд на 10 секунд" title="Вперёд на 10 секунд" className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/14 bg-black/15 text-cyan-100/58 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.05] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-30"><RotateCw size={19} /><span className="absolute text-[8px] font-black">10</span></button>

            <div className="relative flex items-center">
              <button type="button" onClick={toggleMute} aria-label={muted ? 'Включить звук' : 'Выключить звук'} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/14 bg-black/15 text-cyan-100/58 transition hover:border-cyan-300/30 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><VolumeIcon size={18} /></button>
              <button type="button" onClick={() => setVolumeOpen((value) => !value)} aria-label="Настроить громкость" className="ml-1 hidden h-12 items-center px-1 text-[10px] font-bold tabular-nums text-cyan-100/35 transition hover:text-cyan-200 sm:inline-flex">{Math.round((muted ? 0 : volume) * 100)}%</button>
              {volumeOpen && (
                <div className="absolute bottom-14 left-0 z-30 flex w-48 items-center gap-3 rounded-2xl border border-cyan-300/15 bg-[#071018]/98 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:left-auto sm:right-0">
                  <Volume1 size={15} className="text-cyan-100/35" />
                  <input type="range" min="0" max="1" step="0.02" value={muted ? 0 : volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); setMuted(next === 0); }} aria-label="Громкость" className="w-full accent-cyan-300" />
                  <Volume2 size={15} className="text-cyan-200/60" />
                </div>
              )}
            </div>

            <button type="button" onClick={share} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-cyan-400/14 bg-black/15 px-4 text-xs font-bold text-cyan-100/58 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.05] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><Share2 size={16} /> {shareLabel}</button>
            {compact && <Link to={`/music/${track.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-luxury-gold/22 bg-luxury-gold/[0.035] px-4 text-xs font-bold text-luxury-gold transition hover:bg-luxury-gold/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold">Страница релиза <ExternalLink size={15} /></Link>}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-cyan-100/27">
            <span className="inline-flex items-center gap-1.5"><Sparkles size={12} /> Запоминает позицию</span>
            <span>Space — пауза</span>
            <span>← → — ±10 сек.</span>
          </div>

          {!compact && track.rightsNotice && <p className="mt-6 max-w-2xl border-t border-white/[0.07] pt-4 text-[10px] leading-relaxed text-cyan-100/27">{track.rightsNotice}</p>}
        </div>
      </div>

      <span className="sr-only" aria-live="polite">{playing ? `Воспроизводится ${track.title}` : status === 'buffering' ? 'Аудио буферизуется' : ''}</span>
      {track.audioUrl && <audio ref={audioRef} src={asset(track.audioUrl)} preload="metadata" controlsList="nodownload noplaybackrate" onContextMenu={(event) => event.preventDefault()} />}
    </article>
  );
}

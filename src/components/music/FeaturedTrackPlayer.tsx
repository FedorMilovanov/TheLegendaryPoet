import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock3,
  ExternalLink,
  LoaderCircle,
  Music2,
  Pause,
  Play,
  Share2,
  TriangleAlert,
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

type AudioStatus = 'idle' | 'loading' | 'ready' | 'error';

export default function FeaturedTrackPlayer({ track, compact = false }: { track: MusicTrack; compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(track.durationSeconds ?? 0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [shareLabel, setShareLabel] = useState('Поделиться');
  const waveform = useMemo(
    () => track.waveform?.length
      ? track.waveform
      : Array.from({ length: 80 }, (_, index) => 0.28 + ((index * 17) % 65) / 100),
    [track.waveform],
  );
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const unavailable = !track.audioUrl || status === 'error';

  const configureMediaSession = (audio: HTMLAudioElement) => {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: `The Legendary Poet · ${track.poet}`,
      album: 'Музыкальные интерпретации русской поэзии',
      artwork: track.coverUrl
        ? [{ src: asset(track.coverUrl), sizes: '1400x1400', type: 'image/webp' }]
        : undefined,
    });

    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
    };

    setHandler('play', () => { void audio.play(); });
    setHandler('pause', () => audio.pause());
    setHandler('seekbackward', (details) => {
      audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset ?? 10));
    });
    setHandler('seekforward', (details) => {
      audio.currentTime = Math.min(audio.duration || duration, audio.currentTime + (details.seekOffset ?? 10));
    });
    setHandler('seekto', (details) => {
      if (details.seekTime === undefined) return;
      audio.currentTime = Math.max(0, Math.min(audio.duration || duration, details.seekTime));
    });
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncTime = () => {
      setCurrent(audio.currentTime);
      if ('mediaSession' in navigator && Number.isFinite(audio.duration) && audio.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: Math.min(audio.currentTime, audio.duration),
          });
        } catch { /* browser rejected a transient position */ }
      }
    };
    const syncDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : track.durationSeconds ?? 0);
    const onLoadStart = () => setStatus('loading');
    const onCanPlay = () => setStatus('ready');
    const onError = () => { setStatus('error'); setPlaying(false); };
    const onPlay = () => {
      setPlaying(true);
      setStatus('ready');
      configureMediaSession(audio);
      window.dispatchEvent(new CustomEvent('tlp-audio-playing', { detail: track.id }));
    };
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); setCurrent(0); };
    const onOther = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== track.id) audio.pause();
    };

    audio.addEventListener('timeupdate', syncTime);
    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    window.addEventListener('tlp-audio-playing', onOther);

    return () => {
      audio.removeEventListener('timeupdate', syncTime);
      audio.removeEventListener('loadedmetadata', syncDuration);
      audio.removeEventListener('durationchange', syncDuration);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
      window.removeEventListener('tlp-audio-playing', onOther);
    };
  }, [track.id, track.title, track.poet, track.coverUrl, track.durationSeconds, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

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
        await navigator.clipboard.writeText(url);
      }
      setShareLabel('Ссылка скопирована');
      window.setTimeout(() => setShareLabel('Поделиться'), 1800);
    } catch { /* sharing cancelled */ }
  };

  const mainButtonLabel = unavailable
    ? 'Недоступно'
    : status === 'loading' && !playing
      ? 'Загрузка'
      : playing
        ? 'Пауза'
        : 'Слушать';

  return (
    <article className={`relative overflow-hidden border border-luxury-gold/15 bg-[#071018]/92 shadow-[0_30px_100px_rgba(0,0,0,0.45)] ${compact ? 'rounded-[2rem] p-5 sm:p-7' : 'rounded-[2.5rem] p-6 sm:p-9 lg:p-11'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.15),transparent_35%),radial-gradient(circle_at_88%_12%,rgba(0,212,255,0.11),transparent_34%)]" />
      <div className={`relative z-10 grid items-center gap-7 ${compact ? 'lg:grid-cols-[220px_1fr]' : 'lg:grid-cols-[360px_1fr]'}`}>
        <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[1.7rem] border border-white/10 bg-black shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
          {track.coverUrl ? (
            <img
              src={asset(track.coverUrl)}
              alt={`Обложка трека «${track.title}»`}
              draggable={false}
              loading={compact ? 'lazy' : 'eager'}
              className="aspect-square w-full select-none object-cover"
            />
          ) : (
            <div className="aspect-square w-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.12),transparent_60%),#050505]" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5" />
          <button
            type="button"
            onClick={toggle}
            disabled={unavailable}
            aria-label={unavailable ? 'Аудиофайл недоступен' : playing ? 'Поставить на паузу' : 'Воспроизвести трек'}
            className="absolute bottom-5 left-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-luxury-gold text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35 disabled:shadow-none"
          >
            {status === 'loading' && !playing
              ? <LoaderCircle size={25} className="animate-spin" />
              : playing
                ? <Pause size={25} fill="currentColor" />
                : <Play size={25} fill="currentColor" className="ml-1" />}
          </button>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-luxury-gold/20 bg-luxury-gold/7 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-luxury-gold"><Music2 size={13} /> Официальный релиз</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-cyan-100/40"><Clock3 size={13} /> {track.duration}</span>
          </div>
          <h2 className={`font-serif font-bold leading-[1.02] text-white ${compact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl lg:text-6xl'}`}>{track.title}</h2>
          <p className="mt-3 text-base text-luxury-gold/75 sm:text-lg">{track.poet} · The Legendary Poet</p>
          {track.description && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-cyan-100/52 sm:text-base">{track.description}</p>}

          <div className="mt-7">
            <div className="relative flex h-20 items-center gap-[2px] overflow-hidden rounded-2xl border border-cyan-400/10 bg-black/25 px-3">
              {waveform.map((peak, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className={`min-w-[2px] flex-1 rounded-full transition-colors ${index / waveform.length <= progress ? 'bg-luxury-gold' : 'bg-cyan-100/16'}`}
                  style={{ height: `${Math.max(10, peak * 92)}%` }}
                />
              ))}
              <input
                type="range"
                min={0}
                max={duration || 1}
                step="0.1"
                value={Math.min(current, duration || 1)}
                disabled={unavailable}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setCurrent(next);
                  if (audioRef.current) audioRef.current.currentTime = next;
                }}
                aria-label="Позиция воспроизведения"
                aria-valuetext={`${formatTime(current)} из ${formatTime(duration || track.durationSeconds || 0)}`}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
            </div>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-cyan-100/38"><span>{formatTime(current)}</span><span>{formatTime(duration || track.durationSeconds || 0)}</span></div>
          </div>

          {status === 'error' && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/[0.05] px-3 py-2 text-xs text-amber-100/65">
              <TriangleAlert size={14} /> Аудиофайл пока не загрузился. Проверьте соединение или откройте страницу позднее.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              disabled={unavailable}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-luxury-gold px-6 text-sm font-bold text-black transition hover:shadow-[0_0_28px_rgba(212,175,55,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              {status === 'loading' && !playing ? <LoaderCircle size={18} className="animate-spin" /> : playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {mainButtonLabel}
            </button>
            <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Включить звук' : 'Выключить звук'} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/15 text-cyan-100/60 transition hover:border-cyan-300/30 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Громкость" className="hidden w-28 accent-cyan-300 sm:block" />
            <button type="button" onClick={share} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-cyan-400/15 px-4 text-xs font-bold text-cyan-100/60 transition hover:border-cyan-300/30 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><Share2 size={16} /> {shareLabel}</button>
            {compact && <Link to={`/music/${track.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-luxury-gold/20 px-4 text-xs font-bold text-luxury-gold transition hover:bg-luxury-gold/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold">Страница релиза <ExternalLink size={15} /></Link>}
          </div>

          {!compact && track.rightsNotice && <p className="mt-6 max-w-2xl border-t border-white/7 pt-4 text-[10px] leading-relaxed text-cyan-100/28">{track.rightsNotice}</p>}
        </div>
      </div>
      {track.audioUrl && <audio ref={audioRef} src={asset(track.audioUrl)} preload="metadata" controlsList="nodownload noplaybackrate" onContextMenu={(event) => event.preventDefault()} />}
    </article>
  );
}

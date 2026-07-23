import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '../ui/Link';
import { Clock3, ExternalLink, Music2, Pause, Play, Share2, Volume2, VolumeX } from 'lucide-react';
import { MusicTrack } from '../../types/poet';
import { asset } from '../../utils/asset';

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function FeaturedTrackPlayer({ track, compact = false }: { track: MusicTrack; compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.durationSeconds ?? 0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [shareLabel, setShareLabel] = useState('Поделиться');
  const waveform = useMemo(() => track.waveform?.length ? track.waveform : Array.from({ length: 80 }, (_, index) => 0.28 + ((index * 17) % 65) / 100), [track.waveform]);
  const progress = duration > 0 ? currentTime / duration : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : track.durationSeconds ?? 0);
    const onPlay = () => {
      setPlaying(true);
      window.dispatchEvent(new CustomEvent('tlp-audio-playing', { detail: track.id }));
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    const onOtherPlay = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail !== track.id) audio.pause();
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDuration);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    window.addEventListener('tlp-audio-playing', onOtherPlay);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDuration);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      window.removeEventListener('tlp-audio-playing', onOtherPlay);
    };
  }, [track.id, track.durationSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: `The Legendary Poet · ${track.poet}`,
      album: 'Музыкальные интерпретации',
      artwork: track.coverUrl ? [{ src: asset(track.coverUrl), sizes: '1400x1400', type: 'image/webp' }] : undefined,
    });
  }, [track]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); } catch { setPlaying(false); }
    } else audio.pause();
  };

  const share = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/music/${track.id}`;
    try {
      if (navigator.share) await navigator.share({ title: track.title, text: `${track.poet} — музыкальная версия The Legendary Poet`, url });
      else await navigator.clipboard.writeText(url);
      setShareLabel('Ссылка скопирована');
      window.setTimeout(() => setShareLabel('Поделиться'), 1800);
    } catch { /* cancelled share */ }
  };

  return (
    <article className={`relative overflow-hidden border border-luxury-gold/15 bg-[#071018]/92 shadow-[0_30px_100px_rgba(0,0,0,0.45)] ${compact ? 'rounded-[2rem] p-5 sm:p-7' : 'rounded-[2.5rem] p-6 sm:p-9 lg:p-11'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.15),transparent_35%),radial-gradient(circle_at_88%_12%,rgba(0,212,255,0.11),transparent_34%)]" />
      <div className={`relative z-10 grid items-center gap-7 ${compact ? 'lg:grid-cols-[220px_1fr]' : 'lg:grid-cols-[360px_1fr]'}`}>
        <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[1.7rem] border border-white/10 bg-black shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
          {track.coverUrl && <img src={asset(track.coverUrl)} alt={`Обложка трека «${track.title}»`} draggable={false} className="aspect-square w-full select-none object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5" />
          <button type="button" onClick={toggle} aria-label={playing ? 'Поставить на паузу' : 'Воспроизвести трек'} className="absolute bottom-5 left-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-luxury-gold text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] transition hover:scale-105 active:scale-95">{playing ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" className="ml-1" />}</button>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-luxury-gold/20 bg-luxury-gold/7 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-luxury-gold"><Music2 size={13} /> Официальный релиз</span><span className="inline-flex items-center gap-1.5 text-xs text-cyan-100/40"><Clock3 size={13} /> {track.duration}</span></div>
          <h2 className={`font-serif font-bold leading-[1.02] text-white ${compact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl lg:text-6xl'}`}>{track.title}</h2>
          <p className="mt-3 text-base text-luxury-gold/75 sm:text-lg">Сергей Есенин · The Legendary Poet</p>
          {track.description && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-cyan-100/52 sm:text-base">{track.description}</p>}

          <div className="mt-7">
            <div className="relative flex h-20 items-center gap-[2px] overflow-hidden rounded-2xl border border-cyan-400/10 bg-black/25 px-3">
              {waveform.map((peak, index) => <span key={index} aria-hidden="true" className={`min-w-[2px] flex-1 rounded-full transition-colors ${index / waveform.length <= progress ? 'bg-luxury-gold' : 'bg-cyan-100/16'}`} style={{ height: `${Math.max(10, peak * 92)}%` }} />)}
              <input type="range" min={0} max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} onChange={(event) => { const next = Number(event.target.value); setCurrentTime(next); if (audioRef.current) audioRef.current.currentTime = next; }} aria-label="Позиция воспроизведения" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </div>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-cyan-100/38"><span>{formatTime(currentTime)}</span><span>{formatTime(duration || track.durationSeconds || 0)}</span></div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={toggle} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-luxury-gold px-6 text-sm font-bold text-black transition hover:shadow-[0_0_28px_rgba(212,175,55,0.32)]">{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />} {playing ? 'Пауза' : 'Слушать'}</button>
            <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Включить звук' : 'Выключить звук'} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/15 text-cyan-100/60 hover:text-cyan-300">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Громкость" className="hidden w-28 accent-cyan-300 sm:block" />
            <button type="button" onClick={share} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-cyan-400/15 px-4 text-xs font-bold text-cyan-100/60 hover:border-cyan-300/30 hover:text-cyan-300"><Share2 size={16} /> {shareLabel}</button>
            {compact && <Link to={`/music/${track.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-luxury-gold/20 px-4 text-xs font-bold text-luxury-gold hover:bg-luxury-gold/7">Страница релиза <ExternalLink size={15} /></Link>}
          </div>

          <p className="mt-6 max-w-2xl border-t border-white/7 pt-4 text-[10px] leading-relaxed text-cyan-100/28">{track.rightsNotice}</p>
        </div>
      </div>
      {track.audioUrl && <audio ref={audioRef} src={asset(track.audioUrl)} preload="metadata" controlsList="nodownload noplaybackrate" onContextMenu={(event) => event.preventDefault()} />}
    </article>
  );
}

import { ArrowRight, CheckCircle2, Clock3, Disc3, LoaderCircle, Pause, Play, RotateCw } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { MusicTrack } from '../../types/poet';
import { asset } from '../../utils/asset';
import FeedbackMiniSummary from '../community/FeedbackMiniSummary';
import { Link } from '../ui/Link';
import { useAudioPlayer } from './AudioPlayerProvider';
import { getTrackThemeStyle } from './trackTheme';

type CardPlaybackState = 'error' | 'playing' | 'completed' | null;

export default function TrackReleaseCard({ track }: { track: MusicTrack }) {
  const {
    currentTrack,
    playing,
    status,
    currentTime,
    duration,
    completedTrackIds,
    toggleTrack,
    retry,
    getSavedPosition,
  } = useAudioPlayer();

  const isActive = currentTrack?.id === track.id;
  const trackPlaying = isActive && playing;
  const trackError = isActive && status === 'error';
  const trackBusy = isActive && (status === 'loading' || status === 'buffering');
  const position = isActive ? currentTime : getSavedPosition(track.id);
  const totalDuration = isActive ? (duration || track.durationSeconds || 0) : (track.durationSeconds || 0);
  const progress = totalDuration > 0 ? Math.min(1, position / totalDuration) : 0;
  const completed = completedTrackIds.has(track.id);
  const cardState: CardPlaybackState = trackError ? 'error' : trackPlaying ? 'playing' : completed ? 'completed' : null;
  const waveform = track.waveform?.filter((_, index) => index % 4 === 0).slice(0, 34) ?? [];
  const coverTransition = { viewTransitionName: `track-cover-${track.id}` } as CSSProperties;
  const unavailable = !track.audioUrl;

  const toggle = () => {
    if (trackError) retry();
    else void toggleTrack(track);
  };

  return (
    <article
      style={{
        ...getTrackThemeStyle(track),
        backgroundColor: 'var(--track-surface)',
        backgroundImage: 'linear-gradient(145deg, color-mix(in srgb, var(--track-surface) 92%, black), rgba(5,5,5,.93))',
      }}
      className="group relative grid overflow-hidden rounded-[2rem] border border-white/[0.09] shadow-[0_22px_70px_rgba(0,0,0,0.3)] transition duration-500 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-[0_30px_100px_rgba(0,0,0,0.46)] sm:grid-cols-[190px_1fr]"
    >
      <div className="relative aspect-square overflow-hidden bg-black sm:aspect-auto sm:min-h-[232px]">
        <Link to={`/music/${track.id}`} className="block h-full w-full" aria-label={`Открыть публикацию «${track.title}»`}>
          {track.coverUrl ? (
            <img
              src={asset(track.coverUrl)}
              alt={`Обложка трека «${track.title}»`}
              loading="lazy"
              style={coverTransition}
              className="h-full w-full object-cover transition duration-1000 ease-out group-hover:scale-[1.045] group-hover:saturate-[1.08]"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.14),transparent_62%),#050505]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-white/[0.04] sm:bg-gradient-to-r sm:from-transparent sm:to-black/65" />
        </Link>

        <button
          type="button"
          onClick={toggle}
          disabled={unavailable}
          aria-label={unavailable ? `Аудиофайл «${track.title}» недоступен` : trackError ? `Повторить загрузку «${track.title}»` : trackPlaying ? `Поставить «${track.title}» на паузу` : `Воспроизвести «${track.title}»`}
          className="absolute bottom-4 left-4 z-10 inline-flex h-13 w-13 items-center justify-center rounded-full border border-white/25 text-black shadow-[0_0_28px_color-mix(in_srgb,var(--track-accent)_34%,transparent)] transition duration-300 hover:scale-110 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/35 disabled:shadow-none"
          style={{ backgroundColor: unavailable ? undefined : trackError ? '#fbbf24' : 'var(--track-accent)' }}
        >
          {trackBusy && !trackPlaying
            ? <LoaderCircle size={20} className="animate-spin" />
            : trackError
              ? <RotateCw size={20} />
              : trackPlaying
                ? <Pause size={20} fill="currentColor" />
                : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>

        {cardState && (
          <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/52 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/72 backdrop-blur-xl" aria-live="polite">
            {cardState === 'error'
              ? <RotateCw size={12} className="text-amber-300" />
              : cardState === 'playing'
                ? <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: 'var(--track-secondary)' }} />
                : <CheckCircle2 size={12} style={{ color: 'var(--track-secondary)' }} />}
            {cardState === 'error' ? 'Повторить' : cardState === 'playing' ? 'Сейчас звучит' : 'Прослушано'}
          </div>
        )}
      </div>

      <div className="relative flex min-w-0 flex-col p-5 sm:p-6">
        <div className="pointer-events-none absolute right-[-3rem] top-[-4rem] h-40 w-40 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--track-secondary) 8%, transparent)' }} />
        <div className="relative mb-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] px-2.5 py-1" style={{ color: 'var(--track-accent)' }}><Disc3 size={12} /> Релиз {track.releaseYear}</span>
          <span className="inline-flex items-center gap-1.5 text-white/38"><Clock3 size={12} /> {track.duration}</span>
        </div>

        <Link to={`/music/${track.id}`} className="relative block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <h3 className="font-serif text-3xl font-bold leading-[1.02] text-white transition group-hover:text-[var(--track-accent)]">{track.title}</h3>
          <p className="mt-2 text-sm font-medium" style={{ color: 'color-mix(in srgb, var(--track-accent) 70%, white)' }}>{track.poet}</p>
        </Link>
        {track.description && <p className="relative mt-4 line-clamp-3 text-sm leading-relaxed text-white/46">{track.description}</p>}

        {waveform.length > 0 && (
          <div className="relative mt-5 flex h-8 items-center gap-[2px] overflow-hidden rounded-xl border border-white/[0.06] bg-black/20 px-2" aria-hidden="true">
            {waveform.map((peak, index) => {
              const point = (index + 0.5) / Math.max(1, waveform.length);
              return (
                <span
                  key={index}
                  className="min-w-[2px] flex-1 rounded-full"
                  style={{
                    height: `${Math.max(18, peak * 88)}%`,
                    backgroundColor: point <= progress ? 'var(--track-accent)' : 'rgba(255,255,255,.12)',
                  }}
                />
              );
            })}
          </div>
        )}

        <FeedbackMiniSummary targetType="track" targetId={track.id} />
        <Link to={`/music/${track.id}`} className="relative mt-auto flex items-center justify-between border-t border-white/[0.07] pt-5 text-xs font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-white">
          <span>{trackError ? 'Открыть и повторить' : position > 1 && !completed ? 'Продолжить публикацию' : 'Открыть публикацию'}</span>
          <ArrowRight size={17} className="transition group-hover:translate-x-1" style={{ color: 'var(--track-secondary)' }} />
        </Link>
      </div>
    </article>
  );
}

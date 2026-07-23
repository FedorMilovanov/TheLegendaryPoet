import { CheckCircle2, Pause, Play, RotateCw } from 'lucide-react';
import type { MusicTrack } from '../../types/poet';
import { asset } from '../../utils/asset';
import { Link } from '../ui/Link';
import { useAudioPlayer } from './AudioPlayerProvider';
import { buildTrackMomentPath, formatAudioTime } from './audioPresentation';
import { getTrackThemeStyle } from './trackTheme';

interface ListeningArchiveItemProps {
  track: MusicTrack;
  position: number;
  completed: boolean;
}

export default function ListeningArchiveItem({ track, position, completed }: ListeningArchiveItemProps) {
  const { currentTrack, playing, status, currentTime, duration, toggleTrack, retry } = useAudioPlayer();
  const active = currentTrack?.id === track.id;
  const trackPlaying = active && playing;
  const trackError = active && status === 'error';
  const shownPosition = active ? currentTime : position;
  const totalDuration = active ? (duration || track.durationSeconds || 0) : (track.durationSeconds || 0);
  const progress = completed ? 1 : totalDuration > 0 ? Math.min(1, shownPosition / totalDuration) : 0;
  const detailPath = buildTrackMomentPath(track.id, completed ? 0 : shownPosition);

  const toggle = () => {
    if (trackError) retry();
    else void toggleTrack(track);
  };

  return (
    <article
      className="group relative isolate overflow-hidden rounded-[1.45rem] border border-white/[0.08] bg-white/[0.02] p-3 shadow-[0_16px_50px_rgba(0,0,0,0.24)] transition hover:border-white/[0.16] hover:bg-white/[0.035]"
      style={getTrackThemeStyle(track)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link to={detailPath} className="relative h-16 w-16 flex-none overflow-hidden rounded-2xl border border-white/10 bg-black" aria-label={`Открыть релиз «${track.title}»`}>
          {track.coverUrl && <img src={asset(track.coverUrl)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/32 to-transparent" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.13em] text-white/35">
            {completed ? <CheckCircle2 size={12} style={{ color: 'var(--track-secondary)' }} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--track-accent)' }} />}
            {completed ? 'Прослушано полностью' : `Продолжить с ${formatAudioTime(shownPosition)}`}
          </div>
          <Link to={detailPath} className="block truncate font-serif text-lg font-bold text-white transition hover:text-[var(--track-accent)]">{track.title}</Link>
          <div className="mt-1 truncate text-[11px] text-white/38">{track.poet}</div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
            <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${progress * 100}%`, backgroundColor: 'var(--track-accent)' }} />
          </div>
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-label={trackError ? `Повторить загрузку «${track.title}»` : trackPlaying ? `Поставить «${track.title}» на паузу` : completed ? `Слушать «${track.title}» снова` : `Продолжить «${track.title}»`}
          className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full text-black shadow-[0_0_24px_color-mix(in_srgb,var(--track-accent)_22%,transparent)] transition hover:scale-105 hover:brightness-110 active:scale-95"
          style={{ backgroundColor: trackError ? '#fbbf24' : 'var(--track-accent)' }}
        >
          {trackError ? <RotateCw size={18} /> : trackPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
    </article>
  );
}

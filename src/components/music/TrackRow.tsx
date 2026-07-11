import { useEffect, useRef, useState } from 'react';
import { Clock, Download, ExternalLink, Pause, Play } from 'lucide-react';
import { MusicTrack } from '../../types/poet';

interface TrackRowProps {
  track: MusicTrack;
  index: number;
}

const AUDIO_EXT = /\.(mp3|ogg|wav|m4a|aac|flac)$/i;

export default function TrackRow({ track, index }: TrackRowProps) {
  const hasPlayableAudio = !!track.audioUrl && AUDIO_EXT.test(track.audioUrl);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    return () => {
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  return (
    <div className="luxury-card flex items-center gap-6 rounded-xl border border-cyan-400/10 bg-[#061018]/70 p-6 transition-all hover:border-cyan-400/35">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-400/10 bg-[#0b1822]">
        <span className="text-cyan-100/60">{index + 1}</span>
      </div>

      {hasPlayableAudio ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Пауза: ${track.title}` : `Слушать: ${track.title}`}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 transition-colors hover:bg-cyan-400/20 focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {playing ? <Pause size={20} className="text-cyan-300" /> : <Play size={20} className="ml-0.5 text-cyan-300" />}
        </button>
      ) : track.externalUrl ? (
        <a
          href={track.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Слушать «${track.title}» на канале`}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 transition-colors hover:bg-cyan-400/20 focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Play size={20} className="ml-0.5 text-cyan-300" />
        </a>
      ) : (
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/10 bg-cyan-400/5" aria-hidden="true">
          <Play size={20} className="ml-0.5 text-cyan-100/25" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h4 className="truncate font-semibold text-white">{track.title}</h4>
        <p className="text-sm text-cyan-100/60">{track.poet}</p>
        {track.description && <p className="mt-1 text-xs text-cyan-100/45">{track.description}</p>}
      </div>

      <div className="flex flex-shrink-0 items-center gap-4">
        <span className="flex items-center gap-1 text-sm text-cyan-100/50"><Clock size={14} /> {track.duration}</span>
        {hasPlayableAudio && (
          <a href={track.audioUrl} download className="text-cyan-100/60 transition-colors hover:text-cyan-300 focus-visible:text-cyan-300" aria-label={`Скачать «${track.title}»`}><Download size={18} /></a>
        )}
        {track.externalUrl && (
          <a href={track.externalUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-100/60 transition-colors hover:text-cyan-300 focus-visible:text-cyan-300" aria-label={`Открыть «${track.title}» на канале`}><ExternalLink size={18} /></a>
        )}
      </div>

      {hasPlayableAudio && <audio ref={audioRef} src={track.audioUrl} preload="none" />}
    </div>
  );
}

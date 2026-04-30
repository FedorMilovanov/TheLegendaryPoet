import { Clock, Download, ExternalLink, Play } from 'lucide-react';
import { MusicTrack } from '../../types/poet';

interface TrackRowProps {
  track: MusicTrack;
  index: number;
}

export default function TrackRow({ track, index }: TrackRowProps) {
  return (
    <div className="luxury-card flex items-center gap-6 rounded-xl border border-cyan-400/10 bg-[#061018]/70 p-6 transition-all hover:border-cyan-400/35">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-400/10 bg-[#0b1822]">
        <span className="text-cyan-100/55">{index + 1}</span>
      </div>
      <button className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 transition-colors hover:bg-cyan-400/20">
        <Play size={20} className="ml-0.5 text-cyan-300" />
      </button>
      <div className="min-w-0 flex-1">
        <h4 className="truncate font-semibold text-white">{track.title}</h4>
        <p className="text-sm text-cyan-100/55">{track.poet}</p>
        {track.description && <p className="mt-1 text-xs text-cyan-100/35">{track.description}</p>}
      </div>
      <div className="flex flex-shrink-0 items-center gap-4">
        <span className="flex items-center gap-1 text-sm text-cyan-100/40"><Clock size={14} /> {track.duration}</span>
        <a href={track.audioUrl} download className="text-cyan-100/55 transition-colors hover:text-cyan-300" aria-label="Скачать"><Download size={18} /></a>
        {track.videoUrl && <a href={track.videoUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-100/55 transition-colors hover:text-cyan-300" aria-label="Смотреть видео"><ExternalLink size={18} /></a>}
      </div>
    </div>
  );
}
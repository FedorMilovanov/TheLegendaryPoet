import { ArrowRight, Clock3, Disc3, Play } from 'lucide-react';
import { MusicTrack } from '../../types/poet';
import { asset } from '../../utils/asset';
import FeedbackMiniSummary from '../community/FeedbackMiniSummary';
import { Link } from '../ui/Link';

export default function TrackReleaseCard({ track }: { track: MusicTrack }) {
  return (
    <Link
      to={`/music/${track.id}`}
      className="group relative grid overflow-hidden rounded-[2rem] border border-cyan-400/12 bg-[#071018]/72 shadow-[0_22px_70px_rgba(0,0,0,0.28)] transition duration-500 hover:-translate-y-1 hover:border-luxury-gold/30 hover:shadow-[0_28px_90px_rgba(0,0,0,0.42)] sm:grid-cols-[180px_1fr]"
    >
      <div className="relative aspect-square overflow-hidden bg-black sm:aspect-auto sm:min-h-[220px]">
        {track.coverUrl ? (
          <img
            src={asset(track.coverUrl)}
            alt={`Обложка трека «${track.title}»`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.14),transparent_62%),#050505]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-white/[0.04] sm:bg-gradient-to-r sm:from-transparent sm:to-[#071018]/65" />
        <span className="absolute bottom-4 left-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-luxury-gold text-black shadow-[0_0_26px_rgba(212,175,55,0.34)] transition group-hover:scale-110">
          <Play size={19} fill="currentColor" className="ml-0.5" />
        </span>
      </div>

      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-luxury-gold/18 px-2.5 py-1 text-luxury-gold/75"><Disc3 size={12} /> Релиз {track.releaseYear}</span>
          <span className="inline-flex items-center gap-1.5 text-cyan-100/38"><Clock3 size={12} /> {track.duration}</span>
        </div>
        <h3 className="font-serif text-3xl font-bold leading-[1.02] text-white transition group-hover:text-luxury-gold">{track.title}</h3>
        <p className="mt-2 text-sm font-medium text-luxury-gold/60">{track.poet}</p>
        {track.description && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-cyan-100/46">{track.description}</p>}
        <FeedbackMiniSummary targetType="track" targetId={track.id} />
        <div className="mt-auto flex items-center justify-between border-t border-white/7 pt-5 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100/45">
          <span>Открыть публикацию</span>
          <ArrowRight size={17} className="text-cyan-300 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

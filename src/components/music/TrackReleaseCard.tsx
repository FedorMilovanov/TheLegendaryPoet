import { ArrowRight, Clock3, Disc3, Play, Radio } from 'lucide-react';
import { MusicTrack } from '../../types/poet';
import { asset } from '../../utils/asset';
import FeedbackMiniSummary from '../community/FeedbackMiniSummary';
import { Link } from '../ui/Link';

export default function TrackReleaseCard({ track }: { track: MusicTrack }) {
  const waveform = track.waveform?.filter((_, index) => index % 3 === 0).slice(0, 34) ?? [];

  return (
    <Link
      to={`/music/${track.id}`}
      className="group relative isolate grid overflow-hidden rounded-[2rem] border border-cyan-400/12 bg-[#071018]/78 shadow-[0_22px_70px_rgba(0,0,0,0.3)] transition duration-500 hover:-translate-y-1.5 hover:border-luxury-gold/32 hover:shadow-[0_34px_100px_rgba(0,0,0,0.48)] sm:grid-cols-[190px_1fr]"
    >
      {track.wideCoverUrl && (
        <img src={asset(track.wideCoverUrl)} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-[0.055] blur-xl saturate-150 transition duration-700 group-hover:opacity-[0.09]" />
      )}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(5,14,20,0.88),rgba(5,8,12,0.97))]" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-luxury-gold/30 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="relative aspect-square overflow-hidden bg-black sm:aspect-auto sm:min-h-[235px]">
        {track.coverUrl ? (
          <img
            src={asset(track.coverUrl)}
            alt={`Обложка трека «${track.title}»`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-1000 ease-out group-hover:scale-[1.055] group-hover:saturate-[1.08]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.14),transparent_62%),#050505]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-white/[0.05] sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-[#071018]/75" />
        <span className="absolute bottom-4 left-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-luxury-gold text-black shadow-[0_0_30px_rgba(212,175,55,0.35)] transition duration-300 group-hover:scale-110 group-hover:bg-[#f0d36d]">
          <Play size={19} fill="currentColor" className="ml-0.5" />
        </span>
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/48 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/68 backdrop-blur-lg">
          <Radio size={11} className="text-cyan-300" /> Аудиорелиз
        </span>
      </div>

      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-luxury-gold/18 bg-luxury-gold/[0.035] px-2.5 py-1 text-luxury-gold/78"><Disc3 size={12} /> Релиз {track.releaseYear}</span>
          <span className="inline-flex items-center gap-1.5 text-cyan-100/38"><Clock3 size={12} /> {track.duration}</span>
        </div>

        <h3 className="font-serif text-3xl font-bold leading-[1.02] text-white transition duration-300 group-hover:text-luxury-gold">{track.title}</h3>
        <p className="mt-2 text-sm font-medium text-luxury-gold/62">{track.poet}</p>
        {track.description && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-cyan-100/48">{track.description}</p>}

        {waveform.length > 0 && (
          <div className="mt-5 flex h-8 items-center gap-[2px] rounded-xl border border-cyan-300/[0.07] bg-black/20 px-2.5" aria-hidden="true">
            {waveform.map((peak, index) => (
              <span key={index} className="min-w-[2px] flex-1 rounded-full bg-cyan-100/16 transition duration-500 group-hover:bg-luxury-gold/55" style={{ height: `${Math.max(16, peak * 82)}%` }} />
            ))}
          </div>
        )}

        <FeedbackMiniSummary targetType="track" targetId={track.id} />
        <div className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-5 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100/45">
          <span className="transition group-hover:text-cyan-100/70">Открыть публикацию</span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/10 text-cyan-300 transition duration-300 group-hover:translate-x-1 group-hover:border-luxury-gold/25 group-hover:text-luxury-gold"><ArrowRight size={17} /></span>
        </div>
      </div>
    </Link>
  );
}

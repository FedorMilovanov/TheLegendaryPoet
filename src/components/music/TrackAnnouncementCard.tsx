import { ArrowRight, CalendarDays, Hourglass } from 'lucide-react';
import type { MusicTrack } from '../../types/poet';
import { asset } from '../../utils/asset';
import { Link } from '../ui/Link';
import { getTrackThemeStyle } from './trackTheme';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatDate(value?: string) {
  if (!value) return null;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) ? dateFormatter.format(parsed) : null;
}

export default function TrackAnnouncementCard({ track }: { track: MusicTrack }) {
  const scheduledDate = formatDate(track.scheduledFor);

  return (
    <article
      className="group relative isolate overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#080b10] shadow-[0_24px_80px_rgba(0,0,0,0.34)] transition duration-500 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-[0_34px_110px_rgba(0,0,0,0.48)]"
      style={{
        ...getTrackThemeStyle(track),
        backgroundImage: 'linear-gradient(135deg, color-mix(in srgb, var(--track-surface) 94%, black), rgba(5,5,5,.96))',
      }}
    >
      {track.wideCoverUrl && (
        <img
          src={asset(track.wideCoverUrl)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-105 object-cover opacity-[0.14] saturate-125 transition duration-1000 group-hover:scale-110"
        />
      )}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/88 via-black/70 to-black/42" />
      <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'radial-gradient(circle at 84% 20%, color-mix(in srgb, var(--track-secondary) 13%, transparent), transparent 34%)' }} />

      <div className="grid min-h-[270px] gap-6 p-6 sm:grid-cols-[1fr_150px] sm:items-center sm:p-7">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--track-accent)' }}><Hourglass size={13} /> Скоро</span>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">
              <CalendarDays size={13} />
              {scheduledDate ? <time dateTime={track.scheduledFor}>{scheduledDate}</time> : 'Дата уточняется'}
            </span>
          </div>

          <h3 className="font-serif text-3xl font-bold leading-[1.02] text-white transition group-hover:text-[var(--track-accent)] sm:text-4xl">{track.title}</h3>
          <p className="mt-2 text-sm font-medium" style={{ color: 'color-mix(in srgb, var(--track-accent) 72%, white)' }}>{track.poet}</p>
          {track.description && <p className="mt-5 line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/48">{track.description}</p>}

          <Link to={`/music/${track.id}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 text-xs font-bold text-white/58 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Открыть анонс <ArrowRight size={15} className="transition group-hover:translate-x-1" />
          </Link>
        </div>

        {track.coverUrl ? (
          <Link to={`/music/${track.id}`} aria-label={`Открыть анонс «${track.title}»`} className="relative mx-auto hidden aspect-square w-full max-w-[150px] overflow-hidden rounded-[1.45rem] border border-white/12 bg-black shadow-[0_22px_65px_rgba(0,0,0,0.52)] sm:block">
            <img src={asset(track.coverUrl)} alt={`Предварительная обложка «${track.title}»`} loading="lazy" className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-white/[0.05]" />
          </Link>
        ) : (
          <div className="relative mx-auto hidden aspect-square w-full max-w-[150px] items-center justify-center rounded-[1.45rem] border border-dashed border-white/12 bg-white/[0.02] text-white/18 sm:flex"><Hourglass size={30} /></div>
        )}
      </div>
    </article>
  );
}

import type { CSSProperties } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Clock3, Disc3, FileCheck2, Fingerprint, Headphones, Quote, Sparkles } from 'lucide-react';
import { Link } from '../components/ui/Link';
import CommunityPanel from '../components/community/CommunityPanel';
import FeaturedTrackPlayer from '../components/music/FeaturedTrackPlayer';
import TrackReleaseCard from '../components/music/TrackReleaseCard';
import { getTrackTheme, getTrackThemeStyle } from '../components/music/trackTheme';
import { trackRatingDimensions } from '../data/ratingDimensions';
import { musicTracks } from '../data/poets';
import { siteConfig } from '../config/site';
import { useSeo } from '../hooks/useSeo';
import { asset } from '../utils/asset';

function isoDuration(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `PT${minutes}M${rest}S`;
}

function formatTime(value: number) {
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60).toString().padStart(2, '0')}`;
}

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const track = musicTracks.find((item) => item.id === id);
  const relatedTracks = musicTracks.filter((item) => item.id !== id).slice(0, 2);
  const requestedTime = Number(searchParams.get('t'));
  const sharedTime = track && Number.isFinite(requestedTime) && requestedTime >= 0
    ? Math.min(requestedTime, Math.max(0, (track.durationSeconds ?? requestedTime) - 0.1))
    : undefined;

  useSeo({
    title: track ? `${track.title} — ${track.poet} — THE LEGENDARY POET` : 'Трек не найден — THE LEGENDARY POET',
    description: track?.description ?? 'Музыкальная публикация не найдена.',
    path: `/music/${id ?? ''}`,
    type: 'website',
    image: track?.wideCoverUrl ?? track?.coverUrl,
    jsonLd: track ? {
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: track.title,
      description: track.description,
      byArtist: { '@type': 'MusicGroup', name: 'The Legendary Poet', url: siteConfig.url },
      lyricist: { '@type': 'Person', name: track.poet },
      duration: isoDuration(track.durationSeconds),
      datePublished: String(track.releaseYear ?? 2026),
      image: track.coverUrl ? `${siteConfig.url}${track.coverUrl}` : undefined,
      contentUrl: track.audioUrl ? `${siteConfig.url}${track.audioUrl}` : undefined,
      encodingFormat: 'audio/mpeg',
      url: `${siteConfig.url}/music/${track.id}`,
      isFamilyFriendly: true,
      copyrightHolder: { '@type': 'Organization', name: 'The Legendary Poet' },
      inLanguage: 'ru-RU',
    } : undefined,
  });

  if (!track) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-center">
        <div>
          <h1 className="font-serif text-4xl text-white">Трек не найден</h1>
          <Link to="/music" className="mt-6 inline-flex text-luxury-gold">Вернуться в музыку</Link>
        </div>
      </div>
    );
  }

  const theme = getTrackTheme(track);
  const coverTransition = { viewTransitionName: `track-cover-${track.id}` } as CSSProperties;

  return (
    <div className="min-h-screen bg-[#050505] pb-24 text-white" style={getTrackThemeStyle(track)}>
      <section className="relative min-h-[68vh] overflow-hidden pt-24">
        {track.wideCoverUrl && (
          <img
            src={asset(track.wideCoverUrl)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-[1.025] object-cover opacity-65 saturate-[1.08]"
            style={{ objectPosition: theme.heroPosition }}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.52)_48%,rgba(5,5,5,0.38)_74%,rgba(5,5,5,0.72)_100%)]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 72% 35%, color-mix(in srgb, var(--track-secondary) 13%, transparent), transparent 29%), radial-gradient(circle at 24% 22%, color-mix(in srgb, var(--track-accent) 12%, transparent), transparent 31%)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/18 via-transparent to-[#050505]" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#050505] to-transparent" />

        <div className="relative z-10 mx-auto grid min-h-[68vh] max-w-7xl items-end gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_310px] lg:px-8">
          <div className="max-w-4xl">
            <Link to="/music" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/28 px-4 text-xs font-bold text-white/72 shadow-lg backdrop-blur-xl transition hover:border-white/32 hover:bg-black/42 hover:text-white"><ArrowLeft size={15} /> Все музыкальные публикации</Link>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/34 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-xl" style={{ color: 'var(--track-accent)' }}><Disc3 size={14} /> Официальный релиз · {track.releaseYear}</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/28 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/55 backdrop-blur-xl"><Headphones size={14} /> {track.duration} · 44.1 kHz</span>
            </div>
            <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[0.91] drop-shadow-[0_6px_38px_rgba(0,0,0,0.88)] sm:text-7xl lg:text-[5.7rem]">{track.title}</h1>
            <p className="mt-5 text-lg text-white/68 sm:text-xl">{track.poet} <span className="text-white/22">·</span> музыкальная версия The Legendary Poet</p>
            {track.description && <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/48 sm:text-base">{track.description}</p>}
            {sharedTime !== undefined && sharedTime >= 1 && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/32 px-4 py-2 text-xs text-white/64 backdrop-blur-xl">
                <Clock3 size={14} style={{ color: 'var(--track-secondary)' }} /> Ссылка открыта с отметки {formatTime(sharedTime)}
              </div>
            )}
          </div>

          {track.coverUrl && (
            <div className="relative mx-auto hidden w-full max-w-[310px] lg:block">
              <div className="absolute -inset-8 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--track-secondary) 16%, transparent), transparent 68%)' }} />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-black shadow-[0_35px_95px_rgba(0,0,0,0.65)]">
                <img src={asset(track.coverUrl)} alt={`Обложка трека «${track.title}»`} style={coverTransition} className="aspect-square w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-white/[0.05]" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/46 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white/55 backdrop-blur-xl">
                  <span>THE LEGENDARY POET</span>
                  <Sparkles size={13} style={{ color: 'var(--track-accent)' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <FeaturedTrackPlayer track={track} initialTime={sharedTime} />

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.86fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.24)] sm:p-8" style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--track-surface) 94%, black), rgba(5,5,5,.92))' }}>
            <div className="pointer-events-none absolute right-[-4rem] top-[-5rem] h-52 w-52 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--track-secondary) 7%, transparent)' }} />
            <div className="relative mb-5 flex items-center gap-2" style={{ color: 'var(--track-secondary)' }}><FileCheck2 size={19} /><h2 className="font-serif text-2xl font-bold text-white">Паспорт релиза</h2></div>
            <div className="relative space-y-3">
              {track.credits?.map((credit, index) => (
                <div key={credit} className="grid grid-cols-[28px_1fr] items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/22 px-4 py-3 text-sm text-white/56">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-[10px] font-bold" style={{ color: 'var(--track-secondary)' }}>{String(index + 1).padStart(2, '0')}</span>
                  <span>{credit}</span>
                </div>
              ))}
            </div>
            {track.poetId && <Link to={`/poets/${track.poetId}`} className="relative mt-6 inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.025] px-5 text-xs font-bold uppercase tracking-[0.14em] transition hover:bg-white/[0.06]" style={{ color: 'var(--track-accent)' }}>Страница поэта</Link>}
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)] sm:p-8" style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--track-accent) 6%, rgba(5,5,5,.96)), color-mix(in srgb, var(--track-secondary) 3%, rgba(5,5,5,.96)))' }}>
            <div className="pointer-events-none absolute bottom-[-5rem] right-[-5rem] h-52 w-52 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--track-accent) 5%, transparent)' }} />
            <div className="relative mb-5 flex items-center gap-2" style={{ color: 'var(--track-accent)' }}><Quote size={19} /><h2 className="font-serif text-2xl font-bold text-white">О публикации</h2></div>
            <p className="relative text-sm leading-relaxed text-white/57">{track.description}</p>

            <details className="group relative mt-6 rounded-2xl border border-white/[0.08] bg-black/22 transition open:border-white/15">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-bold uppercase tracking-[0.13em] text-white/45 transition hover:text-white [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2"><Fingerprint size={15} /> Технические данные и права</span>
                <ChevronDown size={16} className="transition duration-300 group-open:rotate-180" />
              </summary>
              <div className="border-t border-white/[0.07] px-4 pb-4 pt-4">
                <p className="text-xs leading-relaxed text-white/40">Мастер содержит внутреннюю обложку и авторские ID3-метаданные. Контрольная сумма позволяет подтвердить неизменность опубликованного файла.</p>
                {track.audioSha256 && <code className="mt-4 block break-all rounded-xl border border-white/[0.06] bg-black/32 p-3 text-[10px] leading-relaxed text-white/40">SHA-256: {track.audioSha256}</code>}
                {track.rightsNotice && <p className="mt-4 text-[10px] leading-relaxed text-white/28">{track.rightsNotice}</p>}
              </div>
            </details>
          </div>
        </section>

        <section className="mt-10">
          <CommunityPanel targetType="track" targetId={track.id} title={`Оценка релиза: ${track.title}`} dimensions={trackRatingDimensions} />
        </section>

        {relatedTracks.length > 0 && (
          <section className="mt-20 border-t border-white/[0.07] pt-12" aria-labelledby="related-releases-title">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">Продолжить слушать</div>
                <h2 id="related-releases-title" className="font-serif text-3xl font-bold text-white sm:text-4xl">Другие музыкальные публикации</h2>
              </div>
              <Link to="/music" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-bold text-white/48 transition hover:border-white/25 hover:text-white">Весь аудиоархив</Link>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {relatedTracks.map((item) => <TrackReleaseCard key={item.id} track={item} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

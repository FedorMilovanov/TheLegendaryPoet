import { useParams } from 'react-router-dom';
import { Link } from '../components/ui/Link';
import { ArrowLeft, Disc3, FileCheck2, ShieldCheck } from 'lucide-react';
import { musicTracks } from '../data/poets';
import FeaturedTrackPlayer from '../components/music/FeaturedTrackPlayer';
import CommunityPanel from '../components/community/CommunityPanel';
import { trackRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';
import { asset } from '../utils/asset';
import { siteConfig } from '../config/site';

function isoDuration(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `PT${minutes}M${rest}S`;
}

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const track = musicTracks.find((item) => item.id === id);

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
      byArtist: { '@type': 'MusicGroup', name: 'The Legendary Poet' },
      lyricist: { '@type': 'Person', name: track.poet },
      duration: isoDuration(track.durationSeconds),
      datePublished: String(track.releaseYear ?? 2026),
      image: track.coverUrl ? `${siteConfig.url}${track.coverUrl}` : undefined,
      contentUrl: track.audioUrl ? `${siteConfig.url}${track.audioUrl}` : undefined,
      copyrightHolder: { '@type': 'Organization', name: 'The Legendary Poet' },
      inLanguage: 'ru-RU',
    } : undefined,
  });

  if (!track) return <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-center"><div><h1 className="font-serif text-4xl text-white">Трек не найден</h1><Link to="/music" className="mt-6 inline-flex text-luxury-gold">Вернуться в музыку</Link></div></div>;

  return (
    <div className="min-h-screen bg-[#050505] pb-24 text-white">
      <section className="relative min-h-[58vh] overflow-hidden pt-24">
        {track.wideCoverUrl && <img src={asset(track.wideCoverUrl)} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-55" />}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/35 via-[#050505]/55 to-[#050505]" />
        <div className="relative z-10 mx-auto flex min-h-[58vh] max-w-7xl items-end px-4 pb-16 sm:px-6 lg:px-8"><div className="max-w-4xl"><Link to="/music" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 text-xs font-bold text-white/70 backdrop-blur-md hover:text-white"><ArrowLeft size={15} /> Все музыкальные публикации</Link><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-luxury-gold/25 bg-black/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold backdrop-blur-md"><Disc3 size={14} /> Официальный релиз · {track.releaseYear}</div><h1 className="font-serif text-5xl font-bold leading-[0.92] sm:text-7xl lg:text-8xl">{track.title}</h1><p className="mt-5 text-xl text-white/65">{track.poet} · музыкальная версия The Legendary Poet</p></div></div>
      </section>

      <div className="relative z-20 mx-auto -mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <FeaturedTrackPlayer track={track} />

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-cyan-400/12 bg-[#071018]/70 p-6 sm:p-8"><div className="mb-5 flex items-center gap-2 text-cyan-300"><FileCheck2 size={19} /><h2 className="font-serif text-2xl font-bold text-white">Паспорт релиза</h2></div><div className="space-y-3">{track.credits?.map((credit) => <div key={credit} className="rounded-2xl border border-cyan-400/8 bg-black/20 px-4 py-3 text-sm text-cyan-100/55">{credit}</div>)}</div>{track.poetId && <Link to={`/poets/${track.poetId}`} className="mt-6 inline-flex min-h-11 items-center rounded-full border border-luxury-gold/20 px-5 text-xs font-bold uppercase tracking-[0.14em] text-luxury-gold">Страница поэта</Link>}</div>
          <div className="rounded-[2rem] border border-luxury-gold/12 bg-luxury-gold/[0.035] p-6 sm:p-8"><div className="mb-5 flex items-center gap-2 text-luxury-gold"><ShieldCheck size={19} /><h2 className="font-serif text-2xl font-bold text-white">Целостность и права</h2></div><p className="text-sm leading-relaxed text-cyan-100/52">Аудиофайл содержит встроенные авторские метаданные и обложку. Его SHA-256 зафиксирован в публичном манифесте проекта, поэтому подмену мастер-файла можно обнаружить автоматически.</p><code className="mt-5 block break-all rounded-2xl bg-black/30 p-4 text-[10px] leading-relaxed text-cyan-200/45">SHA-256: {track.audioSha256}</code><p className="mt-5 text-xs leading-relaxed text-cyan-100/35">{track.rightsNotice}</p></div>
        </section>

        <section className="mt-10"><CommunityPanel targetType="track" targetId={track.id} title={`Оценка релиза: ${track.title}`} dimensions={trackRatingDimensions} /></section>
      </div>
    </div>
  );
}

import { AudioWaveform, Sparkles } from '../components/PremiumIcons';
import FeaturedTrackPlayer from '../components/music/FeaturedTrackPlayer';
import TrackReleaseCard from '../components/music/TrackReleaseCard';
import { musicTracks } from '../data/poets';
import { useSeo } from '../hooks/useSeo';
import { titleCase } from '../utils/titleCase';

export default function MusicPage() {
  const featured = musicTracks.find((track) => track.featured) ?? musicTracks[0];
  const remaining = musicTracks.filter((track) => track.id !== featured?.id);

  useSeo({
    title: 'Музыка — THE LEGENDARY POET',
    description: 'Официальные музыкальные интерпретации русской поэзии от проекта The Legendary Poet: авторские плееры, обложки и отдельные страницы релизов.',
    path: '/music',
    image: featured?.wideCoverUrl ?? featured?.coverUrl,
  });

  return (
    <div className="min-h-screen pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12 grid gap-8 border-b border-cyan-400/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-4xl">
            <div className="section-label mb-3">Музыкальные публикации</div>
            <h1 className="mb-5 font-serif text-5xl font-bold leading-[0.96] sm:text-6xl lg:text-7xl">
              <span className="neon-blue-gradient neon-glow-text">{titleCase('Поэзия')}</span>{' '}
              {titleCase('становится музыкой', { isHeadingStart: false })}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-cyan-100/55 sm:text-xl">
              Законченные музыкальные версии стихотворений — с самостоятельной визуальной атмосферой, полноценным плеером и отдельной страницей для оценки и обсуждения.
            </p>
          </div>
          <div className="flex items-end gap-3 lg:flex-col lg:items-end">
            <div className="font-serif text-5xl font-bold text-white">{musicTracks.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/35">официальных релиза</div>
          </div>
        </header>

        {featured ? (
          <section aria-labelledby="featured-release-title">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-luxury-gold/45" />
              <h2 id="featured-release-title" className="text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold">Главная публикация</h2>
            </div>
            <FeaturedTrackPlayer track={featured} compact />
          </section>
        ) : (
          <div className="rounded-3xl border border-cyan-400/10 p-12 text-center text-cyan-100/40">Первый релиз готовится.</div>
        )}

        {remaining.length > 0 && (
          <section className="mt-16" aria-labelledby="release-archive-title">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/55">Аудиоархив</div>
                <h2 id="release-archive-title" className="font-serif text-3xl font-bold text-white sm:text-4xl">Другие релизы</h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-cyan-100/40">На странице каждого трека доступны полный плеер, паспорт публикации, оценки и комментарии слушателей.</p>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {remaining.map((track) => <TrackReleaseCard key={track.id} track={track} />)}
            </div>
          </section>
        )}

        <aside className="luxury-card mt-12 rounded-3xl bg-cyan-950/12 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <AudioWaveform className="mt-1 flex-shrink-0 text-cyan-300" size={26} />
            <div>
              <div className="mb-2 flex items-center gap-2"><h3 className="font-serif text-xl font-semibold text-white">{titleCase('Аудиоархив будет расти')}</h3><Sparkles size={16} className="text-luxury-gold" /></div>
              <p className="text-sm leading-relaxed text-cyan-100/55">Каждая новая композиция получает единый стандарт: мастер-файл с внутренней обложкой и метаданными, оптимизированную веб-обложку, адаптивный плеер и проверяемую контрольную сумму.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

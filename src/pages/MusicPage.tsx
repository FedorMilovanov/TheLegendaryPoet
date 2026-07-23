import { Headphones, ShieldCheck, Sparkles as SparklesIcon, Waves } from 'lucide-react';
import { AudioWaveform, Sparkles } from '../components/PremiumIcons';
import FeaturedTrackPlayer from '../components/music/FeaturedTrackPlayer';
import MusicArchiveBrowser from '../components/music/MusicArchiveBrowser';
import { musicTracks } from '../data/poets';
import { getFeaturedMusicTrack, getMusicCatalogStats } from '../data/musicCatalog';
import { useSeo } from '../hooks/useSeo';
import { asset } from '../utils/asset';
import { titleCase } from '../utils/titleCase';

export default function MusicPage() {
  const featured = getFeaturedMusicTrack(musicTracks);
  const remaining = musicTracks.filter((track) => track.id !== featured?.id);
  const stats = getMusicCatalogStats(musicTracks);
  const archiveMinutes = Math.max(1, Math.round(stats.totalDurationSeconds / 60));

  useSeo({
    title: 'Музыка — THE LEGENDARY POET',
    description: 'Официальные музыкальные интерпретации русской поэзии от проекта The Legendary Poet: авторские плееры, обложки и отдельные страницы релизов.',
    path: '/music',
    image: featured?.wideCoverUrl ?? featured?.coverUrl,
  });

  return (
    <div className="relative min-h-screen overflow-hidden pb-24 pt-28 sm:pt-32">
      {featured?.wideCoverUrl && (
        <img
          src={asset(featured.wideCoverUrl)}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-30 h-[760px] w-full scale-105 object-cover object-center opacity-[0.16] blur-[1px] saturate-125"
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[820px] bg-[linear-gradient(to_bottom,rgba(5,5,5,0.32),rgba(5,5,5,0.78)_58%,#050505_100%)]" />
      <div className="pointer-events-none absolute left-[-16rem] top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-luxury-gold/[0.055] blur-[130px]" />
      <div className="pointer-events-none absolute right-[-12rem] top-56 -z-10 h-[30rem] w-[30rem] rounded-full bg-cyan-400/[0.055] blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-white/[0.07] bg-black/24 px-5 py-8 shadow-[0_35px_110px_rgba(0,0,0,0.32)] backdrop-blur-md sm:px-8 sm:py-10 lg:px-11 lg:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(212,175,55,0.11),transparent_34%),radial-gradient(circle_at_92%_20%,rgba(0,212,255,0.09),transparent_31%)]" />
          <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-luxury-gold/38 to-transparent" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-4xl">
              <div className="section-label mb-3">Музыкальные публикации</div>
              <h1 className="mb-5 font-serif text-5xl font-bold leading-[0.94] sm:text-6xl lg:text-7xl">
                <span className="neon-blue-gradient neon-glow-text">{titleCase('Поэзия')}</span>{' '}
                {titleCase('становится музыкой', { isHeadingStart: false })}
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-cyan-100/58 sm:text-xl">
                Не фоновые треки, а самостоятельные музыкальные публикации: с кинематографической обложкой, мастер-файлом, живой формой волны и отдельным пространством для вдумчивого прослушивания.
              </p>
            </div>

            <div className="grid min-w-[250px] grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/[0.07] bg-black/22 px-3 py-3 text-center backdrop-blur sm:px-4 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:text-left">
                <div className="font-serif text-2xl font-bold text-white sm:text-3xl">{stats.publishedCount}</div>
                <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-100/35 sm:text-[9px] lg:mt-0">релизов</div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/22 px-3 py-3 text-center backdrop-blur sm:px-4 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:text-left">
                <div className="font-serif text-2xl font-bold text-white sm:text-3xl">{stats.poetCount}</div>
                <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-100/35 sm:text-[9px] lg:mt-0">поэтов</div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/22 px-3 py-3 text-center backdrop-blur sm:px-4 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:text-left">
                <div className="font-serif text-xl font-bold text-luxury-gold sm:text-2xl">{archiveMinutes}</div>
                <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-100/35 sm:text-[9px] lg:mt-0">минут</div>
              </div>
            </div>
          </div>

          <div className="relative mt-8 grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.018] px-4 py-3 text-xs text-cyan-100/48"><Headphones size={17} className="text-cyan-300" /> Запоминается место прослушивания</div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.018] px-4 py-3 text-xs text-cyan-100/48"><Waves size={17} className="text-luxury-gold" /> Реальная форма волны каждого трека</div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.018] px-4 py-3 text-xs text-cyan-100/48"><ShieldCheck size={17} className="text-cyan-300" /> Проверяемый мастер и метаданные</div>
          </div>
        </header>

        {featured ? (
          <section aria-labelledby="featured-release-title">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-luxury-gold/45" />
                <h2 id="featured-release-title" className="text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold">Главная публикация</h2>
              </div>
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100/28"><SparklesIcon size={13} /> Рекомендуем начать отсюда</span>
            </div>
            <FeaturedTrackPlayer track={featured} compact />
          </section>
        ) : (
          <div className="rounded-3xl border border-cyan-400/10 p-12 text-center text-cyan-100/40">Первый релиз готовится.</div>
        )}

        {remaining.length > 0 && (
          <section className="mt-20" aria-labelledby="release-archive-title">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/55">Аудиоархив</div>
                <h2 id="release-archive-title" className="font-serif text-3xl font-bold text-white sm:text-4xl">Другие релизы</h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-cyan-100/42">Поиск, фильтры и стабильная сортировка уже готовы к десяткам и сотням новых публикаций.</p>
            </div>
            <MusicArchiveBrowser tracks={remaining} />
          </section>
        )}

        <aside className="luxury-card relative mt-14 overflow-hidden rounded-[2rem] bg-cyan-950/12 p-6 sm:p-8">
          <div className="pointer-events-none absolute right-[-4rem] top-[-5rem] h-48 w-48 rounded-full bg-cyan-300/[0.05] blur-3xl" />
          <div className="relative flex items-start gap-4">
            <AudioWaveform className="mt-1 flex-shrink-0 text-cyan-300" size={26} />
            <div>
              <div className="mb-2 flex items-center gap-2"><h3 className="font-serif text-xl font-semibold text-white">{titleCase('Аудиоархив будет расти')}</h3><Sparkles size={16} className="text-luxury-gold" /></div>
              <p className="max-w-3xl text-sm leading-relaxed text-cyan-100/55">Новые композиции получают один стандарт публикации: явный статус релиза, стабильное место в каталоге, мастер-файл с внутренней обложкой и ID3-метаданными, адаптивный плеер, системное управление на телефоне и проверяемую контрольную сумму.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

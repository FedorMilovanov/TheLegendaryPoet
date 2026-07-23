import { AudioWaveform, Sparkles } from '../components/PremiumIcons';
import { musicTracks } from '../data/poets';
import TrackFeedback from '../components/community/TrackFeedback';
import FeaturedTrackPlayer from '../components/music/FeaturedTrackPlayer';
import { useSeo } from '../hooks/useSeo';
import { titleCase } from '../utils/titleCase';

export default function MusicPage() {
  const featured = musicTracks.find((track) => track.featured) ?? musicTracks[0];
  const remaining = musicTracks.filter((track) => track.id !== featured?.id);

  useSeo({
    title: 'Музыка — THE LEGENDARY POET',
    description: 'Официальные музыкальные интерпретации русской поэзии от проекта The Legendary Poet.',
    path: '/music',
  });

  return (
    <div className="min-h-screen pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-4xl">
          <div className="section-label mb-3">Музыкальные публикации</div>
          <h1 className="mb-5 font-serif text-5xl font-bold leading-[0.96] sm:text-6xl lg:text-7xl"><span className="neon-blue-gradient neon-glow-text">{titleCase('Поэзия')}</span> {titleCase('становится музыкой', { isHeadingStart: false })}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-cyan-100/55 sm:text-xl">Здесь выходят законченные музыкальные версии стихотворений: с полноценной обложкой, авторским плеером, оценкой слушателей и отдельной страницей каждого релиза.</p>
        </div>

        {featured ? <FeaturedTrackPlayer track={featured} compact /> : <div className="rounded-3xl border border-cyan-400/10 p-12 text-center text-cyan-100/40">Первый релиз готовится.</div>}

        {featured && <section className="mt-10"><TrackFeedback track={featured} /></section>}

        {remaining.length > 0 && <section className="mt-16"><h2 className="mb-7 font-serif text-3xl font-bold text-white">Другие релизы</h2><div className="grid gap-6 lg:grid-cols-2">{remaining.map((track) => <FeaturedTrackPlayer key={track.id} track={track} compact />)}</div></section>}

        <div className="luxury-card mt-12 rounded-3xl bg-cyan-950/12 p-6 sm:p-8"><div className="flex items-start gap-4"><AudioWaveform className="mt-1 flex-shrink-0 text-cyan-300" size={26} /><div><div className="mb-2 flex items-center gap-2"><h3 className="font-serif text-xl font-semibold text-white">{titleCase('Аудиоархив будет расти')}</h3><Sparkles size={16} className="text-luxury-gold" /></div><p className="text-sm leading-relaxed text-cyan-100/55">Новые композиции будут получать тот же единый стандарт: качественный мастер, метаданные, контрольная сумма, адаптивная обложка и отдельная читательская дискуссия.</p></div></div></div>
      </div>
    </div>
  );
}

import { useRef } from 'react';
import { useParams } from 'react-router';
import { Link } from '../components/ui/Link';
import ShareLine from '../components/ui/ShareLine';
import Breadcrumbs from '../components/seo/Breadcrumbs';
import { poets } from '../data/poets';
import HeroSection from '../components/poet-detail/HeroSection';
import InfoCard from '../components/poet-detail/InfoCard';
import FamousWorks from '../components/poet-detail/FamousWorks';
import PoemCard from '../components/poet-detail/PoemCard';
import SpiritualPath from '../components/poet-detail/SpiritualPath';
import MoralPortrait from '../components/poet-detail/MoralPortrait';
import AuthorCommentary from '../components/poet-detail/AuthorCommentary';
import PoetCommunitySummary from '../components/poet-detail/PoetCommunitySummary';
import PoemQuickNav from '../components/poet-detail/PoemQuickNav';
import KindredSpirits from '../components/poet-detail/KindredSpirits';
import Testimonies from '../components/poet-detail/Testimonies';
import RelatedEssays from '../components/poet-detail/RelatedEssays';
import CommunityPanel from '../components/community/CommunityPanel';
import { poetRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';
import { buildPoetPageSchema, type SeoBreadcrumb } from '../lib/seoSchema';
import { titleCase } from '../utils/titleCase';

export default function PoetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const poet = poets.find((candidate) => candidate.id === id);
  const contentRef = useRef<HTMLDivElement>(null);
  const routePath = `/poets/${id ?? ''}`;
  const breadcrumbs: SeoBreadcrumb[] = poet
    ? [
        { name: 'Главная', path: '/' },
        { name: 'Поэты', path: '/poets' },
        { name: poet.name, path: routePath },
      ]
    : [
        { name: 'Главная', path: '/' },
        { name: 'Поэты', path: '/poets' },
        { name: 'Поэт не найден', path: routePath },
      ];

  useSeo({
    title: poet ? `${poet.name} — биография, стихи и анализ — THE LEGENDARY POET` : 'Поэт не найден — THE LEGENDARY POET',
    description: poet ? poet.shortBio : 'Страница не найдена.',
    path: routePath,
    type: 'website',
    image: poet?.photo,
    imageAlt: poet ? `Портрет: ${poet.fullName || poet.name}` : undefined,
    breadcrumbs,
    robots: poet ? undefined : 'noindex,follow',
    jsonLd: poet
      ? buildPoetPageSchema({
          title: `${poet.name} — биография, стихи и анализ`,
          description: poet.shortBio,
          path: routePath,
          image: poet.photo,
          breadcrumbs,
          poet,
        })
      : undefined,
  });

  if (!poet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] pb-20 pt-32">
        <div className="mx-auto w-full max-w-4xl px-4 text-center">
          <Breadcrumbs items={breadcrumbs} className="mb-8 text-left" />
          <h1 className="mb-4 font-serif text-4xl text-white">{titleCase('Поэт не найден')}</h1>
          <Link to="/poets" className="font-medium text-luxury-gold transition-colors hover:text-luxury-gold-light">
            ← Вернуться к списку поэтов
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-luxury-gold/30">
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <HeroSection poet={poet} />

      <div className="relative z-20 mx-auto max-w-7xl border-t border-luxury-gold/10 px-4 pb-32 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12">
          <div className="space-y-10 lg:sticky lg:top-32 lg:col-span-4">
            <InfoCard poet={poet} />
            <KindredSpirits poet={poet} />
            <PoetCommunitySummary poetId={poet.id} />
            <PoemQuickNav poems={poet.poems} />
            <FamousWorks works={poet.famousWorks} />
          </div>

          <div ref={contentRef} className="space-y-16 lg:col-span-8">
            <ShareLine scopeRef={contentRef} />
            <p className="border-l-4 border-luxury-gold pl-8 font-serif text-2xl font-light italic leading-[1.6] text-white md:text-3xl">
              "{poet.shortBio}"
            </p>

            <RelatedEssays poetId={poet.id} />

            <div className="space-y-8">
              <h2 className="border-b border-luxury-dark-300 pb-4 text-xs font-bold uppercase tracking-[0.2em] text-luxury-gold">
                Полная Биография
              </h2>
              <div className="poetry-text space-y-6 text-xl font-light leading-[1.8] text-luxury-gray-light">
                {poet.fullBio.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <CommunityPanel
              targetType="poet"
              targetId={poet.id}
              title={`Оценка: ${poet.name}`}
              dimensions={poetRatingDimensions}
            />

            {poet.spiritualSearch && <SpiritualPath content={poet.spiritualSearch} />}

            {poet.historicalNote && (
              <div className="luxury-card rounded-[2.5rem] border border-luxury-gold/10 bg-[#0a0a0a]/50 p-8 md:p-10">
                <h2 className="mb-6 border-b border-luxury-gold/10 pb-4 text-xs font-bold uppercase tracking-[0.2em] text-luxury-gold">
                  Исторический контекст
                </h2>
                <p className="poetry-text text-lg font-light leading-[1.8] text-luxury-gray-light">
                  {poet.historicalNote}
                </p>
              </div>
            )}

            {poet.moralPortrait && <MoralPortrait content={poet.moralPortrait} />}
            {poet.testimonies && poet.testimonies.length > 0 && <Testimonies items={poet.testimonies} />}
            {poet.authorCommentary && <AuthorCommentary content={poet.authorCommentary} />}

            <div className="pt-16">
              <h2 className="editorial-title mb-10 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-serif text-[2.55rem] font-bold leading-none text-white sm:mb-12 sm:text-5xl">
                {titleCase('Избранная')} <span className="gold-gradient gold-glow-text italic">{titleCase('Лирика')}</span>
              </h2>

              <div className="space-y-16">
                {poet.poems.map((poem) => (
                  <PoemCard key={poem.id} poem={poem} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

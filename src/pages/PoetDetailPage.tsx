import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from '../components/ui/Link';
import ShareLine from '../components/ui/ShareLine';
import Breadcrumbs from '../components/seo/Breadcrumbs';
import ReaderLayoutPending from '../components/ReaderLayoutPending';
import { poets } from '../data/poets';
import { supplementaryPoetIds, loadSupplementaryPoet } from '../data/runtime/supplementaryPoets.generated';
import type { Poet } from '../types/poet';
import HeroSection from '../components/poet-detail/HeroSection';
import InfoCard from '../components/poet-detail/InfoCard';
import FamousWorks from '../components/poet-detail/FamousWorks';
import PoemCard from '../components/poet-detail/PoemCard';
import SpiritualPath from '../components/poet-detail/SpiritualPath';
import AuthorCommentary from '../components/poet-detail/AuthorCommentary';
import PoetCommunitySummary from '../components/poet-detail/PoetCommunitySummary';
import AkhmatovaReadingGuide from '../components/poet-detail/AkhmatovaReadingGuide';
import PoemQuickNav from '../components/poet-detail/PoemQuickNav';
import KindredSpirits from '../components/poet-detail/KindredSpirits';
import Testimonies from '../components/poet-detail/Testimonies';
import RelatedEssays from '../components/poet-detail/RelatedEssays';
import CommunityPanel from '../components/community/CommunityPanel';
import { poetRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';
import { buildPoetPageSchema, type SeoBreadcrumb } from '../lib/seoSchema';


const MoralPortrait = lazy(() => import('../components/poet-detail/MoralPortrait'));
const loadVideos = () => import('../components/poet-detail/PoetVideos');
const loadSources = () => import('../components/poet-detail/PoetSources');
const PoetVideos = lazy(loadVideos);
const PoetSources = lazy(loadSources);

export default function PoetDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const basePoet = poets.find((candidate) => candidate.id === id);
  const isSupplementary = supplementaryPoetIds.includes(id);
  const [loadedPoet, setLoadedPoet] = useState<{ id: string; value?: Poet } | null>(null);
  useEffect(() => {
    if (!isSupplementary) return;
    const controller = new AbortController();
    const { signal } = controller;
    const receive = (value?: Poet) => !signal.aborted && setLoadedPoet({ id, value });
    Promise.all([
      loadSupplementaryPoet(id, signal),
      loadVideos(), loadSources(),
    ]).then(([value]) => receive(value), () => receive());
    return () => controller.abort();
  }, [id]);
  const detail = loadedPoet?.id === id ? loadedPoet : null;
  const poet = detail?.value ?? basePoet;
  const pendingBiography = !detail && isSupplementary;
  const contentRef = useRef<HTMLDivElement>(null);
  const routePath = '/poets/' + id;
  const breadcrumbs: SeoBreadcrumb[] = [
    { name: 'Главная', path: '/' },
    { name: 'Поэты', path: '/poets' },
    { name: poet?.name ?? 'Поэт не найден', path: routePath },
  ];

  useSeo({
    title: poet ? `${poet.name} — биография, стихи и анализ — THE LEGENDARY POET` : 'Поэт не найден — THE LEGENDARY POET',
    description: poet ? poet.shortBio : 'Страница не найдена.',
    path: routePath,
    type: 'website',
    image: poet?.photo,
    imageAlt: poet ? `Портрет: ${poet.fullName || poet.name}` : undefined,
    breadcrumbs,
    state: poet ? undefined : 'not-found',
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
      <div className="theme-page-surface flex min-h-screen items-center justify-center pb-20 pt-32">
        <div className="mx-auto w-full max-w-4xl px-4 text-center">
          <Breadcrumbs items={breadcrumbs} className="mb-8 text-left" />
          <h1 data-route-unavailable className="theme-text mb-4 font-serif text-4xl">{'Поэт Не Найден'}</h1>
          <Link to="/poets" className="font-medium text-luxury-gold transition-colors hover:text-luxury-gold-light">
            ← Вернуться к списку поэтов
          </Link>
        </div>
      </div>
    );
  }

  // Keep existing Blok fragment links stable while sharing the component.
  const contentsId = poet.id === 'alexander-blok' ? 'blok-contents' : 'poem-contents';

  return (
    <div className="theme-page-surface min-h-screen selection:bg-luxury-gold/30">
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <HeroSection poet={poet} />

      <div className="relative z-20 mx-auto max-w-7xl border-t border-luxury-gold/10 px-4 pb-32 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12">
          <aside aria-label="Навигация и сведения о поэте" className="reader-sticky-panel space-y-10 lg:sticky lg:top-32 lg:col-span-4 [--reader-sticky-top:8rem]">
            <InfoCard poet={poet} />
            <KindredSpirits poet={poet} />
            <PoetCommunitySummary poetId={poet.id} />
            <FamousWorks works={poet.famousWorks} />
          </aside>

          <div data-share-scope ref={contentRef} className="space-y-16 lg:col-span-8">
            <ShareLine scopeRef={contentRef} path={routePath} />
            {pendingBiography && <ReaderLayoutPending />}
            {detail && !detail.value && (
              <p role="status" className="text-sm text-luxury-gold">
                Не удалось загрузить полную биографию.
              </p>
            )}
            <p id="bio-intro" className="theme-text poet-bio-intro">
              "{poet.shortBio}"
            </p>
            {poet.poems.length > 1 && (
              <a className="poet-contents-jump" href={`#${contentsId}`}>К оглавлению стихов <span aria-hidden="true">↓</span></a>
            )}

            <Suspense fallback={<ReaderLayoutPending />}>
              <RelatedEssays poetId={poet.id} />
              <PoetVideos poet={poet} />
            </Suspense>

            <div className="space-y-8">
              <h2 className="poet-detail-kicker">
                Полная Биография
              </h2>
              <div data-reading-flow="biography" data-share-id={poet.fullBio === poet.shortBio ? 'bio-intro' : undefined} className="poetry-text space-y-6 text-xl font-light leading-[1.8] text-luxury-gray-light">
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
                <h2 className="poet-detail-kicker poet-detail-kicker--history">
                  Исторический контекст
                </h2>
                <p className="poetry-text text-lg font-light leading-[1.8] text-luxury-gray-light">
                  {poet.historicalNote}
                </p>
              </div>
            )}

            <Suspense fallback={<ReaderLayoutPending />}><PoetSources poet={poet} /></Suspense>

            <Suspense fallback={<ReaderLayoutPending />}>
            {poet.moralPortrait && <MoralPortrait content={poet.moralPortrait} />}
            {poet.testimonies && poet.testimonies.length > 0 && <Testimonies items={poet.testimonies} />}
            {poet.authorCommentary && <AuthorCommentary content={poet.authorCommentary} />}

            {poet.id === 'anna-akhmatova' && <AkhmatovaReadingGuide />}


            <div className="pt-16">
              <h2 className="theme-text editorial-title poet-lyric-heading">
                {'Избранная'} <span className="gold-gradient gold-glow-text italic">{'Лирика'}</span>
              </h2>

              <PoemQuickNav id={contentsId} poems={poet.poems} />
              <div className="mt-10 space-y-16">
                {poet.poems.map((poem) => (
                  <PoemCard key={poem.id} poem={poem} ready={!pendingBiography} />
                ))}
              </div>
            </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

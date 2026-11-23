import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from '../components/ui/Link';
import ShareLine from '../components/ui/ShareLine';
import Breadcrumbs from '../components/seo/Breadcrumbs';
import { poets } from '../data/poets';
import { supplementaryPoetIds, loadSupplementaryPoet } from '../data/runtime/supplementaryPoets.generated';
import type { Poet } from '../types/poet';
import HeroSection from '../components/poet-detail/HeroSection';
import InfoCard from '../components/poet-detail/InfoCard';
import FamousWorks from '../components/poet-detail/FamousWorks';
import SpiritualPath from '../components/poet-detail/SpiritualPath';
import AuthorCommentary from '../components/poet-detail/AuthorCommentary';
import PoetCommunitySummary from '../components/poet-detail/PoetCommunitySummary';
import AkhmatovaReadingGuide from '../components/poet-detail/AkhmatovaReadingGuide';
import PoemQuickNav from '../components/poet-detail/PoemQuickNav';
import PoemPicker from '../components/poet-detail/PoemPicker';
import KindredSpirits from '../components/poet-detail/KindredSpirits';
import Testimonies from '../components/poet-detail/Testimonies';
import RelatedEssays from '../components/poet-detail/RelatedEssays';
import CommunityPanel from '../components/community/CommunityPanel';
import { poetRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';
import { buildPoetPageSchema, type SeoBreadcrumb } from '../lib/seoSchema';


const MoralPortrait = lazy(() => import('../components/poet-detail/MoralPortrait'));
const PoemCard = lazy(() => import('../components/poet-detail/PoemCard'));
const PoetVideos = lazy(() => import('../components/poet-detail/PoetVideos'));
const PoetSources = lazy(() => import('../components/poet-detail/PoetSources'));

export default function PoetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const basePoet = poets.find((candidate) => candidate.id === id);
  const [loadedPoet, setLoadedPoet] = useState<{ id: string; value: Poet } | null>(null);
  const [biographyError, setBiographyError] = useState(false);
  useEffect(() => {
    if (!id || !supplementaryPoetIds.includes(id)) return;
    const controller = new AbortController();
    setBiographyError(false);
    loadSupplementaryPoet(id, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setLoadedPoet({ id, value });
      })
      .catch(() => {
        if (!controller.signal.aborted) setBiographyError(true);
      });
    return () => controller.abort();
  }, [id]);
  const poet = loadedPoet && loadedPoet.id === id ? loadedPoet.value : basePoet;
  useEffect(() => {
    if (!id || loadedPoet?.id !== id) return;
    // Wait until React has committed the full poet content before asking the
    // single native scroll coordinator to correct an existing hash anchor.
    const frame = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('tlp-poet-corpus-hydrated', { detail: { poetId: id } }));
    });
    return () => cancelAnimationFrame(frame);
  }, [id, loadedPoet]);
  const contentRef = useRef<HTMLDivElement>(null);
  const routePath = `/poets/${id ?? ''}`;
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
      <div className="theme-page-surface flex min-h-screen items-center justify-center pb-20 pt-32">
        <div className="mx-auto w-full max-w-4xl px-4 text-center">
          <Breadcrumbs items={breadcrumbs} className="mb-8 text-left" />
          <h1 className="theme-text mb-4 font-serif text-4xl">{'Поэт Не Найден'}</h1>
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
      <PoemPicker poems={poet.poems} />

      <div className="relative z-20 mx-auto max-w-7xl border-t border-luxury-gold/10 px-4 pb-32 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12">
          <aside aria-label="Навигация и сведения о поэте" className="reader-sticky-panel space-y-10 lg:sticky lg:top-32 lg:col-span-4 [--reader-sticky-top:8rem]">
            <InfoCard poet={poet} />
            <KindredSpirits poet={poet} />
            <PoetCommunitySummary poetId={poet.id} />
            <FamousWorks works={poet.famousWorks} />
          </aside>

          <div ref={contentRef} className="space-y-16 lg:col-span-8">
            <ShareLine scopeRef={contentRef} />
            {biographyError && supplementaryPoetIds.includes(poet.id) && (
              <p role="status" className="text-sm text-luxury-gold">
                Не удалось загрузить полный корпус стихов и биографию. Показана резервная подборка.
              </p>
            )}
            <p className="theme-text poet-bio-intro">
              "{poet.shortBio}"
            </p>
            {poet.poems.length > 1 && (
              <a className="poet-contents-jump" href={`#${contentsId}`}>К оглавлению стихов <span aria-hidden="true">↓</span></a>
            )}

            <Suspense fallback={null}>
              <RelatedEssays poetId={poet.id} />

            <PoetVideos poet={poet} />

            </Suspense>

            <div className="space-y-8">
              <h2 className="poet-detail-kicker">
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
                <h2 className="poet-detail-kicker poet-detail-kicker--history">
                  Исторический контекст
                </h2>
                <p className="poetry-text text-lg font-light leading-[1.8] text-luxury-gray-light">
                  {poet.historicalNote}
                </p>
              </div>
            )}

            <Suspense fallback={null}><PoetSources poet={poet} /></Suspense>

            {poet.moralPortrait && <Suspense fallback={null}><MoralPortrait content={poet.moralPortrait} /></Suspense>}
            {poet.testimonies && poet.testimonies.length > 0 && <Testimonies items={poet.testimonies} />}
            {poet.authorCommentary && <AuthorCommentary content={poet.authorCommentary} />}

            {poet.id === 'anna-akhmatova' && <AkhmatovaReadingGuide />}


            <div className="pt-16">
              <h2 className="theme-text editorial-title poet-lyric-heading">
                {'Избранная'} <span className="gold-gradient gold-glow-text italic">{'Лирика'}</span>
              </h2>

              <PoemQuickNav id={contentsId} poems={poet.poems} />
              <Suspense fallback={<p role="status" className="sr-only">Загрузка стихотворений</p>}>
                <div className="mt-10 space-y-16">
                  {poet.poems.map((poem) => (
                    <PoemCard key={poem.id} poem={poem} contentsId={contentsId} />
                  ))}
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

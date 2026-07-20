import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from '../components/ui/Link';
import ShareLine from '../components/ui/ShareLine';
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
import CommunityPanel from '../components/community/CommunityPanel';
import { poetRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';
import { titleCase } from '../utils/titleCase';
import { siteConfig } from '../config/site';

export default function PoetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const poet = poets.find(p => p.id === id);
  const contentRef = useRef<HTMLDivElement>(null);

  useSeo({
    title: poet ? `${poet.name} — THE LEGENDARY POET` : 'Поэт не найден — THE LEGENDARY POET',
    description: poet ? poet.shortBio : 'Страница не найдена.',
    path: `/poets/${id ?? ''}`,
    type: 'profile',
    image: poet?.photo,
    keywords: poet ? [poet.name, poet.fullName, ...poet.tags, 'стихи', 'биография'].join(', ') : undefined,
    jsonLd: poet
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: poet.name,
            alternateName: poet.fullName,
            description: poet.shortBio,
            image: `${poet.photo.startsWith('http') ? '' : siteConfig.url}${poet.photo}`,
            birthDate: String(poet.birthYear),
            deathDate: poet.deathYear ? String(poet.deathYear) : undefined,
            nationality: poet.nationality,
            jobTitle: 'Поэт',
            knowsAbout: poet.tags,
          },
          inLanguage: 'ru-RU',
        }
      : undefined,
  });

  if (!poet) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-white mb-4">{titleCase('Поэт не найден')}</h1>
          <Link to="/poets" className="text-luxury-gold hover:text-luxury-gold-light transition-colors font-medium">
            ← Вернуться к списку поэтов
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-luxury-gold/30">
      <HeroSection poet={poet} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pt-16 pb-32 border-t border-luxury-gold/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-10">
            <InfoCard poet={poet} />
            <KindredSpirits poet={poet} />
            <PoetCommunitySummary poetId={poet.id} />
            <PoemQuickNav poems={poet.poems} />
            <FamousWorks works={poet.famousWorks} />
          </div>

          <div ref={contentRef} className="lg:col-span-8 space-y-16">
            {/* Share-a-line: poem verses and bio passages are deep-linkable. */}
            <ShareLine scopeRef={contentRef} />
            <p className="text-2xl md:text-3xl text-white font-serif leading-[1.6] italic border-l-4 border-luxury-gold pl-8 font-light">
              "{poet.shortBio}"
            </p>

            <div className="space-y-8">
              <h2 className="text-xs font-bold tracking-[0.2em] text-luxury-gold uppercase border-b border-luxury-dark-300 pb-4">
                Полная Биография
              </h2>
              <div className="poetry-text text-xl text-luxury-gray-light leading-[1.8] space-y-6 font-light">
                {poet.fullBio.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>

            <CommunityPanel
              targetType="poet"
              targetId={poet.id}
              title={`Оценка: ${poet.name}`}
              dimensions={poetRatingDimensions}
            />

            {poet.spiritualSearch && (
              <SpiritualPath content={poet.spiritualSearch} />
            )}

            {poet.moralPortrait && (
              <MoralPortrait content={poet.moralPortrait} />
            )}

            {poet.authorCommentary && (
              <AuthorCommentary content={poet.authorCommentary} />
            )}

            {poet.historicalNote && (
              <div className="luxury-card p-8 md:p-10 rounded-[2.5rem] border border-luxury-gold/10 bg-[#0a0a0a]/50">
                <h2 className="text-xs font-bold tracking-[0.2em] text-luxury-gold uppercase mb-6 border-b border-luxury-gold/10 pb-4">
                  Исторический контекст
                </h2>
                <p className="poetry-text text-lg text-luxury-gray-light leading-[1.8] font-light">
                  {poet.historicalNote}
                </p>
              </div>
            )}

            {poet.testimonies && poet.testimonies.length > 0 && (
              <Testimonies items={poet.testimonies} />
            )}

            <div className="pt-16">
              <h2 className="text-5xl font-serif font-bold text-white mb-12 flex items-center gap-4 editorial-title">
                {titleCase('Избранная')} <span className="gold-gradient italic gold-glow-text">{titleCase('Лирика')}</span>
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

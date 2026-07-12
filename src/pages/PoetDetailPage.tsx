import { useParams, Link } from 'react-router-dom';
import { poets } from '../data/poets';
import HeroSection from '../components/poet-detail/HeroSection';
import InfoCard from '../components/poet-detail/InfoCard';
import FamousWorks from '../components/poet-detail/FamousWorks';
import PoemCard from '../components/poet-detail/PoemCard';
import SpiritualPath from '../components/poet-detail/SpiritualPath';
import AuthorCommentary from '../components/poet-detail/AuthorCommentary';
import PoetCommunitySummary from '../components/poet-detail/PoetCommunitySummary';
import PoemQuickNav from '../components/poet-detail/PoemQuickNav';
import KindredSpirits from '../components/poet-detail/KindredSpirits';
import CommunityPanel from '../components/community/CommunityPanel';
import { poetRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';

export default function PoetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const poet = poets.find(p => p.id === id);

  useSeo({
    title: poet ? `${poet.name} — THE LEGENDARY POET` : 'Поэт не найден — THE LEGENDARY POET',
    description: poet ? poet.shortBio : 'Страница не найдена.',
    path: `/poets/${id ?? ''}`,
  });

  if (!poet) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-white mb-4">Поэт не найден</h1>
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

          <div className="lg:col-span-8 space-y-16">
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

            <div className="pt-16">
              <h2 className="text-5xl font-serif font-bold text-white mb-12 flex items-center gap-4 editorial-title">
                Избранная <span className="gold-gradient italic gold-glow-text">Лирика</span>
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

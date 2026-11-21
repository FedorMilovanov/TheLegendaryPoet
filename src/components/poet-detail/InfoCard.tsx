import { Star, Calendar, MapPin, BookOpen } from 'lucide-react';
import { Poet } from '../../types/poet';
import MagneticButton from '../MagneticButton';
import { brandLinks } from '../../config/site';

interface InfoCardProps {
  poet: Poet;
}

export default function InfoCard({ poet }: InfoCardProps) {
  const youtubeUrl = poet.links?.youtube || brandLinks.youtube;
  const rutubeUrl = poet.links?.rutube || brandLinks.rutube;
  return (
    <div className="luxury-card glow-hover rounded-3xl border border-luxury-gold/10 p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-luxury-gold/20">
        <span className="theme-text text-sm font-bold uppercase tracking-widest">Досье</span>
        <div className="flex items-center gap-1.5 bg-luxury-gold/10 px-3 py-1 rounded-full border border-luxury-gold/30">
          <Star size={14} className="fill-luxury-gold text-luxury-gold" />
          <span className="text-sm font-bold text-luxury-gold gold-glow-text">{poet.rating}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-6 text-xs font-bold tracking-widest uppercase text-luxury-gray-light">
        <div className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-full bg-luxury-dark-200 flex items-center justify-center text-luxury-gold border border-luxury-gold/20 group-hover:border-luxury-gold/60 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">
            <Calendar size={16} />
          </div>
          <span>{poet.birthYear}&nbsp;— {poet.deathYear || 'н. в.'}</span>
        </div>
        <div className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-full bg-luxury-dark-200 flex items-center justify-center text-luxury-gold border border-luxury-gold/20 group-hover:border-luxury-gold/60 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">
            <MapPin size={16} />
          </div>
          <span>{poet.nationality}</span>
        </div>
        <div className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-full bg-luxury-dark-200 flex items-center justify-center text-luxury-gold border border-luxury-gold/20 group-hover:border-luxury-gold/60 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">
            <BookOpen size={16} />
          </div>
          <span>{poet.poems.length} Избранных</span>
        </div>
      </div>

      <div className="pt-10 flex flex-col gap-4">
        <MagneticButton
          href={youtubeUrl}
          className="theme-text w-full border border-luxury-gold/25 bg-luxury-gold/5 text-xs font-semibold tracking-[0.14em] hover:bg-luxury-gold/10"
        >
          Канал YouTube
        </MagneticButton>
        <MagneticButton
          href={rutubeUrl}
          className="theme-text gold-border-glow w-full border border-luxury-gold/30 bg-luxury-gold/10 text-xs font-semibold tracking-[0.14em] hover:bg-luxury-gold/20"
        >
          Смотреть Rutube
        </MagneticButton>
      </div>
    </div>
  );
}

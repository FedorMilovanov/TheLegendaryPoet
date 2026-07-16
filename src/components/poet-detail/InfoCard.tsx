import { Star, Calendar, MapPin, BookOpen } from '../PremiumIcons';
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
    <div className="luxury-card glow-hover p-8 rounded-3xl border border-luxury-gold/10 backdrop-blur-xl bg-[#0a0a0a]/90 shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-luxury-gold/20">
        <span className="text-sm font-bold tracking-widest uppercase text-white">Досье</span>
        <div className="flex items-center gap-1.5 bg-luxury-gold/10 px-3 py-1 rounded-full border border-luxury-gold/30">
          <Star size={14} className="text-luxury-gold" />
          <span className="text-sm font-bold text-luxury-gold gold-glow-text">{poet.rating}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-6 text-xs font-bold tracking-widest uppercase text-luxury-gray-light">
        <div className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-full bg-luxury-dark-200 flex items-center justify-center text-luxury-gold border border-luxury-gold/20 group-hover:border-luxury-gold/60 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">
            <Calendar size={16} />
          </div>
          <span>{poet.birthYear} — {poet.deathYear || 'н.в.'}</span>
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
          className="bg-white/5 border border-white/10 text-cyan-100 hover:bg-white/10 w-full text-[10px] tracking-[0.2em]"
        >
          Канал YouTube
        </MagneticButton>
        <MagneticButton
          href={rutubeUrl}
          className="bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/20 w-full text-[10px] tracking-[0.2em] gold-border-glow"
        >
          Смотреть Rutube
        </MagneticButton>
      </div>
    </div>
  );
}

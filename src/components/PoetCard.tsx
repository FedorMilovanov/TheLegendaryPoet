import { Link } from './ui/Link';
import { Star, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { vtShared } from '../lib/viewTransition';
import { Poet } from '../types/poet';
import TiltCard from './TiltCard';
import PoetImage from './PoetImage';
import FeedbackMiniSummary from './community/FeedbackMiniSummary';

interface PoetCardProps {
  poet: Poet;
}

const PoetCard = ({ poet }: PoetCardProps) => {
  return (
    <Link to={`/poets/${poet.id}`} className="group block h-full">
      <TiltCard intensity={6}>
        <div className="theme-page-surface overflow-hidden h-full flex flex-col border border-cyan-400/15 breath-hover relative z-10 rounded-2xl">
          {/* Glowing Background Accent on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

          {/* Shine Effect: opacity and movement share one transition, so it never jumps. */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />

          {/* Image Box */}
          <div className="relative h-72 overflow-hidden bg-[#050505] flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark-200/20 via-transparent to-black/30 z-10" />

            <PoetImage
              src={poet.photo}
              name={poet.name}
              alt={poet.name}
              width={800}
              height={1000}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
              style={vtShared(`poet-portrait-${poet.id}`)}
              className="hover-media w-full h-full object-cover object-[center_18%] opacity-95 group-hover:opacity-100 group-hover:scale-[1.055] transition-[transform,opacity,filter] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] contrast-[1.03] saturate-[1.02]"
            />

            {/* Top Badges */}
            <div className="absolute top-4 right-4 z-20 theme-dark-island bg-[#050505] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-luxury-gold/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
              <Star size={14} className="text-luxury-gold fill-luxury-gold animate-pulse" />
              <span className="text-sm font-bold text-luxury-gold gold-glow-text">{poet.rating}</span>
            </div>

            <div className="absolute top-4 left-4 z-20 theme-dark-island bg-[#050505] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-luxury-gold/10">
              <MapPin size={12} className="theme-dark-island-muted" />
              <span className="text-xs theme-dark-island-muted font-medium tracking-wide">{poet.nationality}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col flex-grow relative z-20">
            <div className="mb-4 flex-grow">
              <h3 className="text-2xl font-serif font-bold theme-poet-title transition-colors duration-300 mb-1 leading-tight">
                {poet.name}
              </h3>
              <p className="text-xs tracking-wider uppercase theme-poet-accent font-semibold mb-3">{poet.fullName}</p>
              <p className="text-sm theme-functional-muted leading-relaxed font-light line-clamp-3">
                {poet.shortBio}
              </p>
              <FeedbackMiniSummary targetType="poet" targetId={poet.id} />
            </div>

            <div className="space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {poet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs bg-luxury-gold/5 theme-poet-accent rounded border border-luxury-gold/20 font-medium tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Dates / Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-cyan-400/10 theme-functional-subtle">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar size={14} />
                  <span>{poet.birthYear}&nbsp;— {poet.deathYear || 'н. в.'}</span>
                </div>
                <div className="flex items-center gap-1 theme-control-action text-sm font-semibold transition-colors duration-300">
                  <span>Подробнее</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
};

export default PoetCard;

import { Link } from './ui/Link';
import { Star, Calendar, MapPin, ArrowRight, BookOpenText } from 'lucide-react';
import { asset } from '../utils/asset';
import { vtShared } from '../lib/viewTransition';
import { Poet } from '../types/poet';
import { getAllEssays } from '../data/essays';
import TiltCard from './TiltCard';
import FeedbackMiniSummary from './community/FeedbackMiniSummary';

interface PoetCardProps {
  poet: Poet;
}

function researchLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} больших материалов`;
  if (last === 1) return `${count} большой материал`;
  if (last >= 2 && last <= 4) return `${count} больших материала`;
  return `${count} больших материалов`;
}

const PoetCard = ({ poet }: PoetCardProps) => {
  const researchCount = getAllEssays().filter((essay) => essay.poetId === poet.id).length;

  return (
    <Link to={`/poets/${poet.id}`} className="group block h-full">
      <TiltCard intensity={8}>
        <div className="overflow-hidden h-full flex flex-col border border-cyan-400/15 bg-[#050505]/70 breath-hover relative z-10 rounded-2xl">
          {/* Glowing Background Accent on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Shine Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000" />

          {/* Image Box */}
          <div className="relative h-72 overflow-hidden bg-[#050505] flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark-200/20 via-transparent to-black/30 z-10" />

            <img
              src={asset(poet.photo)}
              alt={poet.name}
              style={vtShared(`poet-portrait-${poet.id}`)}
              className="w-full h-full object-cover object-[center_18%] opacity-95 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] contrast-[1.03] saturate-[1.02]"
            />

            {/* Top Badges */}
            <div className="absolute top-4 right-4 z-20 bg-[#050505]/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-luxury-gold/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
              <Star size={14} className="text-luxury-gold fill-luxury-gold animate-pulse" />
              <span className="text-sm font-bold text-luxury-gold gold-glow-text">{poet.rating}</span>
            </div>

            <div className="absolute top-4 left-4 z-20 bg-[#050505]/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-luxury-gold/10">
              <MapPin size={12} className="text-luxury-gray-light" />
              <span className="text-xs text-luxury-gray-light font-medium tracking-wide">{poet.nationality}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col flex-grow relative z-20">
            <div className="mb-4 flex-grow">
              <h3 className="text-2xl font-serif font-bold text-white group-hover:text-luxury-gold transition-colors duration-300 mb-1 leading-tight">
                {poet.name}
              </h3>
              <p className="text-xs tracking-wider uppercase text-luxury-gold/60 font-semibold mb-3">{poet.fullName}</p>
              {researchCount > 0 && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/15 bg-cyan-400/[0.045] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-200/65">
                  <BookOpenText size={12} /> {researchLabel(researchCount)}
                </div>
              )}
              <p className="text-sm text-luxury-gray-light leading-relaxed font-light line-clamp-3">
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
                    className="px-2.5 py-1 text-xs bg-luxury-gold/5 text-luxury-gold/80 rounded border border-luxury-gold/20 font-medium tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Dates / Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-cyan-400/10 text-cyan-100/50">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar size={14} className="text-cyan-400/50" />
                  <span>{poet.birthYear} — {poet.deathYear || 'н.в.'}</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400 text-sm font-semibold group-hover:text-cyan-300 transition-colors">
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

import { useState } from 'react';
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const researchCount = getAllEssays().filter((essay) => essay.poetId === poet.id).length;

  return (
    <Link to={`/poets/${poet.id}`} className="group block h-full" data-testid="poet-card-link">
      <TiltCard intensity={5.5}>
        <div
          className="relative z-10 flex h-full flex-col overflow-hidden rounded-2xl border border-cyan-400/15 bg-[#050505]/70"
          data-testid="poet-card"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-luxury-gold/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="relative h-72 flex-shrink-0 overflow-hidden bg-[#050505]">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-luxury-dark-200/20 via-transparent to-black/30" />

            <img
              src={asset(poet.photo)}
              alt={poet.name}
              style={vtShared(`poet-portrait-${poet.id}`)}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
              data-loaded={imageLoaded ? 'true' : 'false'}
              data-testid="poet-card-image"
              className={`poet-card-image h-full w-full object-cover object-[center_18%] contrast-[1.03] saturate-[1.02] ${imageLoaded ? 'is-loaded' : ''}`}
            />

            <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-luxury-gold/30 bg-[#050505]/80 px-3 py-1.5 shadow-[0_0_10px_rgba(212,175,55,0.2)] backdrop-blur-md">
              <Star size={14} className="fill-luxury-gold text-luxury-gold" />
              <span className="gold-glow-text text-sm font-bold text-luxury-gold">{poet.rating}</span>
            </div>

            <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-luxury-gold/10 bg-[#050505]/80 px-3 py-1.5 backdrop-blur-md">
              <MapPin size={12} className="text-luxury-gray-light" />
              <span className="text-xs font-medium tracking-wide text-luxury-gray-light">{poet.nationality}</span>
            </div>
          </div>

          <div className="relative z-20 flex flex-grow flex-col p-8">
            <div className="mb-4 flex-grow">
              <h3 className="mb-1 font-serif text-2xl font-bold leading-tight text-white transition-colors duration-300 group-hover:text-luxury-gold">
                {poet.name}
              </h3>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-luxury-gold/60">{poet.fullName}</p>
              {researchCount > 0 && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/15 bg-cyan-400/[0.045] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-200/65">
                  <BookOpenText size={12} /> {researchLabel(researchCount)}
                </div>
              )}
              <p className="line-clamp-3 text-sm font-light leading-relaxed text-luxury-gray-light">
                {poet.shortBio}
              </p>
              <FeedbackMiniSummary targetType="poet" targetId={poet.id} />
            </div>

            <div className="space-y-4">
              <div className="mb-4 flex flex-wrap gap-2">
                {poet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-luxury-gold/20 bg-luxury-gold/5 px-2.5 py-1 text-xs font-medium tracking-wide text-luxury-gold/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-cyan-400/10 pt-4 text-cyan-100/50">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar size={14} className="text-cyan-400/50" />
                  <span>{poet.birthYear} — {poet.deathYear || 'н.в.'}</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-cyan-400 transition-colors group-hover:text-cyan-300">
                  <span>Подробнее</span>
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
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

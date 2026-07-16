import { Link } from './ui/Link';
import { Star, Calendar, MapPin, ArrowRight } from './PremiumIcons';
import { vtShared } from '../lib/viewTransition';
import { Poet } from '../types/poet';
import TiltCard from './TiltCard';
import PoetImage from './PoetImage';
import FeedbackMiniSummary from './community/FeedbackMiniSummary';

interface PoetCardProps {
  poet: Poet;
}

/**
 * Catalog card for a poet. Uses PoetImage so a missing/broken portrait falls
 * back to the branded monogram placeholder instead of a broken-image glyph.
 */
const PoetCard = ({ poet }: PoetCardProps) => {
  return (
    <Link to={`/poets/${poet.id}`} className="group block h-full">
      <TiltCard intensity={8}>
        <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-2xl border border-cyan-400/15 bg-[#050505]/70 breath-hover">
          {/* Glowing background accent on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-luxury-gold/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Shine effect */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-all duration-1000 group-hover:translate-x-full group-hover:opacity-100" />

          {/* Image */}
          <div className="relative h-72 flex-shrink-0 overflow-hidden bg-[#050505]">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-luxury-dark-200/20 via-transparent to-black/30" />

            <PoetImage
              src={poet.photo}
              name={poet.name}
              alt={poet.name}
              style={vtShared(`poet-portrait-${poet.id}`)}
              className="h-full w-full object-cover object-[center_18%] opacity-95 contrast-[1.03] saturate-[1.02] transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:opacity-100"
            />

            <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-luxury-gold/30 bg-[#050505]/80 px-3 py-1.5 shadow-[0_0_10px_rgba(212,175,55,0.2)] backdrop-blur-md">
              <Star size={14} className="text-luxury-gold" />
              <span className="text-sm font-bold text-luxury-gold gold-glow-text">{poet.rating}</span>
            </div>

            <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-luxury-gold/10 bg-[#050505]/80 px-3 py-1.5 backdrop-blur-md">
              <MapPin size={12} className="text-luxury-gray-light" />
              <span className="text-xs font-medium tracking-wide text-luxury-gray-light">{poet.nationality}</span>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-20 flex flex-grow flex-col p-8">
            <div className="mb-4 flex-grow">
              <h3 className="mb-1 font-serif text-2xl font-bold leading-tight text-white transition-colors duration-300 group-hover:text-luxury-gold">
                {poet.name}
              </h3>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-luxury-gold/60">{poet.fullName}</p>
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
                  <span>
                    {poet.birthYear} — {poet.deathYear || 'н.в.'}
                  </span>
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

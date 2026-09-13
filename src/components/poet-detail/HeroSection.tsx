import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from '../ui/Link';
import { ArrowLeft } from 'lucide-react';
import { Poet } from '../../types/poet';
import { asset } from '../../utils/asset';
import { vtShared } from '../../lib/viewTransition';

interface HeroSectionProps {
  poet: Poet;
}

export default function HeroSection({ poet }: HeroSectionProps) {
  // Compute particle placement once so re-renders don't re-randomize them.
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      })),
    [],
  );
  const primaryTag = poet.tags[0];
  return (
    <div className="theme-dark-island relative flex h-[90vh] w-full flex-col justify-end overflow-hidden pb-12 md:h-[56vw] md:max-h-[1100px] md:min-h-[620px]">
      {/* Height is width-driven (not vh) from md up: on short/wide desktop
          windows a pure vh height crops the portrait down to hairline —
          keying off vw holds the crop ratio steady regardless of window
          height, so the face stays in frame. */}
      {/* Animated Background Image */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 pointer-events-none"
      >
        <img
          src={asset(poet.photo)}
          alt={poet.name}
          style={vtShared(`poet-portrait-${poet.id}`)}
          className="w-full h-full object-cover object-[center_18%] contrast-[1.03] opacity-90"
        />
        <div className="poet-hero-shade absolute inset-0" />
      </motion.div>
      
      {/* Floating Particles Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-luxury-gold/30 rounded-full"
            style={{ left: particle.left, top: particle.top }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            to="/poets"
            className="theme-dark-island-accent mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-colors hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
          >
            <ArrowLeft size={14} /> Все поэты
          </Link>
          
          {primaryTag && (
            <div className="mb-4">
              <span className="theme-dark-island-accent inline-block rounded-full border border-cyan-400/30 bg-cyan-950/30 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] neon-cyan-glow">
                {primaryTag}
              </span>
            </div>
          )}
          
          <h1 className="text-5xl md:text-8xl lg:text-[8rem] font-serif font-bold leading-[0.9] tracking-tighter editorial-title drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <span className="gold-gradient gold-glow-text">{poet.name}</span>
          </h1>
          <p className="theme-dark-island-muted mt-6 max-w-2xl font-serif text-xl italic drop-shadow-lg md:text-3xl">
            {poet.fullName}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

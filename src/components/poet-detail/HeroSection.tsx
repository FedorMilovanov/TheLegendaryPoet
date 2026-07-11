import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Poet } from '../../types/poet';
import { asset } from '../../utils/asset';

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
    <div className="relative w-full h-[90vh] overflow-hidden bg-[#050505] flex flex-col justify-end pb-12">
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
          className="w-full h-full object-cover object-top contrast-[1.03] opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
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
            className="inline-flex items-center gap-2 text-cyan-300/80 hover:text-cyan-300 mb-6 transition-colors text-[10px] font-bold tracking-[0.2em] uppercase backdrop-blur-md px-5 py-2.5 rounded-full border border-cyan-400/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
          >
            <ArrowLeft size={14} /> Все поэты
          </Link>
          
          {primaryTag && (
            <div className="mb-4">
              <span className="inline-block text-[10px] font-bold tracking-[0.3em] text-cyan-300 bg-cyan-950/30 px-4 py-1.5 rounded-full border border-cyan-400/30 uppercase neon-cyan-glow">
                {primaryTag}
              </span>
            </div>
          )}
          
          <h1 className="text-5xl md:text-8xl lg:text-[8rem] font-serif font-bold leading-[0.9] tracking-tighter editorial-title drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <span className="gold-gradient gold-glow-text">{poet.name}</span>
          </h1>
          <p className="text-xl md:text-3xl text-luxury-gray-light font-serif italic mt-6 max-w-2xl drop-shadow-lg">
            {poet.fullName}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

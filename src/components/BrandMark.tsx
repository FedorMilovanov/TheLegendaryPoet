import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-11 w-11',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

const premiumEase = [0.16, 1, 0.3, 1] as const;
const BRAND_VERSION = 'cloak-20260725-4';

/**
 * Owner-approved emblem: the selected faceless hooded figure in a heavy
 * black-blue cloak. No substitute vector mascot is rendered underneath it:
 * the header always uses the approved artwork itself.
 */
export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const titleId = `${useId().replace(/:/g, '')}-brand-title`;
  const artworkUrl = `${import.meta.env.BASE_URL}brand-emblem-master.webp?v=${BRAND_VERSION}`;

  return (
    <motion.span
      data-brand-mark
      data-brand-version={BRAND_VERSION}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-visible',
        sizes[size],
        className,
      )}
      initial="idle"
      animate="idle"
      whileHover="hover"
    >
      <motion.svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 96 96"
        role="img"
        aria-labelledby={titleId}
        style={{ pointerEvents: 'none' }}
        variants={{
          idle: { filter: 'drop-shadow(0 0 4px rgba(46,216,255,0.12))' },
          hover: {
            filter: 'drop-shadow(0 0 11px rgba(70,215,255,0.46))',
            transition: { duration: 0.72, ease: premiumEase },
          },
        }}
      >
        <title id={titleId}>THE LEGENDARY POET</title>

        <motion.image
          data-brand-glow
          href={artworkUrl}
          x="-2"
          y="-2"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid meet"
          variants={{
            idle: {
              opacity: 0.08,
              scale: 1.01,
              filter: 'blur(2.8px) brightness(1.04) saturate(1.05)',
            },
            hover: {
              opacity: 0.28,
              scale: 1.065,
              filter: 'blur(3.8px) brightness(1.18) saturate(1.16)',
              transition: { duration: 0.82, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 49px' }}
        />

        <motion.image
          data-brand-figure
          href={artworkUrl}
          x="-2"
          y="-2"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid meet"
          variants={{
            idle: {
              y: 0,
              scale: 1,
              opacity: 1,
              filter: 'brightness(1) saturate(1)',
            },
            hover: {
              y: -0.6,
              scale: 1.028,
              opacity: 1,
              filter: 'brightness(1.08) saturate(1.08)',
              transition: { duration: 0.72, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 50px' }}
        />
      </motion.svg>
    </motion.span>
  );
}

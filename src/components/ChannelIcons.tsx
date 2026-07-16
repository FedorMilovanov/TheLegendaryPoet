import { useId } from 'react';
import { motion } from 'framer-motion';

interface IconProps {
  className?: string;
}

/**
 * YouTube — official compact icon, 2024+ color.
 * Kept close to Simple Icons geometry.
 */
export function YouTubeIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      whileHover={{ scale: 1.06, y: -1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814Z"
        fill="#FF0033"
      />
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568Z" fill="#FFF" />
    </motion.svg>
  );
}

/**
 * Rutube — official compact sign rebuilt from current brand assets.
 * Dark rounded square + red corner sector + white R.
 * Colors from brandbook:
 *   Russian Violet  #100943
 *   Red Munsell     #ED143B
 */
export function RutubeIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 1000 1000"
      fill="none"
      className={className}
      aria-hidden="true"
      whileHover={{ scale: 1.06, y: -1, rotate: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      {/* Base rounded square */}
      <path
        d="M243.2 1000h513.5c134.3 0 243.2-108.9 243.2-243.2V243.2C1000 109.2 891.5.4 757.5 0H242.5C108.5.4 0 109.2 0 243.2v513.5C0 891.1 108.9 1000 243.2 1000Z"
        fill="#100943"
      />
      {/* Red top-right sector */}
      <path
        d="M757.5 0H500c0 276.1 223.9 500 500 500V243.2C1000 109.2 891.5.4 757.5 0Z"
        fill="#ED143B"
      />
      {/* White R */}
      <path
        d="M617.7 477.2H322.3V360.3h295.4c17.3 0 29.3 3 35.3 8.3 6 5.3 9.8 15 9.8 29.2v42c0 15-3.7 24.7-9.8 30-6 5.2-18 7.4-35.3 7.4ZM638 250H197v500h125.3V587.3h230.9L662.7 750H803L682.2 586.6c44.5-6.6 64.5-20.3 81-42.7 16.5-22.5 24.8-58.5 24.8-106.4v-37.5c0-28.5-3-51-8.3-68.2-5.3-17.2-14.2-32.2-27-45.7-13.5-12.8-28.5-21.7-46.5-27.7-18-5.4-40.5-8.4-68.2-8.4Z"
        fill="#FFFFFF"
      />
    </motion.svg>
  );
}

/**
 * VK — official Simple Icons glyph.
 */
export function VKIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      whileHover={{ scale: 1.06, y: -1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      <path
        d="m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z"
        fill="#0777FF"
      />
    </motion.svg>
  );
}

/**
 * BookMonogram — premium catalog/book sign.
 */
export function BookMonogramIcon({ className = 'h-5 w-5' }: IconProps) {
  // Unique gradient id per instance — multiple icons on one page must not share
  // a fixed #bookGrad or the SVG paint server resolves to the first definition.
  const bookGrad = `bookGrad-${useId().replace(/:/g, '')}`;

  return (
    <motion.svg
      viewBox="0 0 72 72"
      fill="none"
      className={className}
      aria-hidden="true"
      whileHover="hover"
      initial="rest"
    >
      <defs>
        <linearGradient id={bookGrad} x1="12" y1="10" x2="60" y2="62">
          <stop offset="0" stopColor="#c9fbff" />
          <stop offset="0.48" stopColor="#2ed8ff" />
          <stop offset="1" stopColor="#1f88ff" />
        </linearGradient>
      </defs>
      <motion.path
        variants={{ rest: { opacity: 0.48 }, hover: { opacity: 0.8, x: -2, y: -2 } }}
        d="M16 14h9.5c2.2 0 4 1.8 4 4v40H20c-2.2 0-4-1.8-4-4V14Z"
        fill={`url(#${bookGrad})`}
      />
      <motion.path
        variants={{ rest: { opacity: 0.34 }, hover: { opacity: 0.6, x: 2, y: 2 } }}
        d="M42.5 14H56v40c0 2.2-1.8 4-4 4h-9.5V14Z"
        fill={`url(#${bookGrad})`}
      />
      <motion.path
        variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
        style={{ transformOrigin: 'center' }}
        d="M31 13.5h10v45H31v-45Z"
        fill={`url(#${bookGrad})`}
      />
      <motion.path
        variants={{ rest: { opacity: 0.72 }, hover: { opacity: 1 } }}
        d="M20.5 23H25M20.5 31H25M47 23h4.5M47 31h4.5"
        stroke="#e8feff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <motion.path
        variants={{ rest: { scale: 1 }, hover: { scale: 1.1 } }}
        style={{ transformOrigin: 'center' }}
        d="M31 18c1.7-1.4 3.4-2.1 5-2.1s3.3.7 5 2.1"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
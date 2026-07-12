import { useEffect, useMemo, useState } from 'react';
import { asset } from '../utils/asset';

interface PoetImageProps {
  src?: string;
  name: string;
  alt?: string;
  className?: string;
}

function makePlaceholder(name: string) {
  const initials = name.split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#07131c"/>
          <stop offset="55%" stop-color="#0a1d2c"/>
          <stop offset="100%" stop-color="#050505"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="26%" r="55%">
          <stop offset="0%" stop-color="rgba(46,216,255,0.28)"/>
          <stop offset="100%" stop-color="rgba(46,216,255,0)"/>
        </radialGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#bg)"/>
      <rect width="800" height="1000" fill="url(#glow)"/>
      <circle cx="400" cy="320" r="140" fill="rgba(255,255,255,0.05)" stroke="rgba(46,216,255,0.22)" stroke-width="3"/>
      <path d="M190 835c35-164 137-247 210-247 75 0 176 83 211 247" fill="rgba(255,255,255,0.04)" stroke="rgba(46,216,255,0.18)" stroke-width="3"/>
      <text x="50%" y="90%" text-anchor="middle" fill="#d8fdff" font-size="110" font-family="Georgia, serif" opacity="0.92">${initials}</text>
      <text x="50%" y="95%" text-anchor="middle" fill="rgba(216,253,255,0.58)" font-size="28" font-family="Inter, Arial, sans-serif" letter-spacing="4">THE LEGENDARY POET</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function PoetImage({ src, name, alt, className = '' }: PoetImageProps) {
  const fallbackSrc = useMemo(() => makePlaceholder(name), [name]);
  // Resolve real image paths against the app base ("/TheLegendaryPoet/" on
  // GitHub Pages) so bare "/images/..." paths don't 404. The generated
  // placeholder is a data: URI and must not be prefixed.
  const resolvedSrc = useMemo(() => (src ? asset(src) : fallbackSrc), [src, fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);

  useEffect(() => {
    setCurrentSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt || name}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
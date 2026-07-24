import type { CSSProperties } from 'react';

const fragments = [
  { text: 'Духовной жаждою томим', top: '14%', left: '4%', rotate: -8, size: 'text-5xl', opacity: 0.035, dx: 12, dy: -14, duration: 18 },
  { text: 'Мысль изреченная есть ложь', top: '30%', left: '68%', rotate: 7, size: 'text-4xl', opacity: 0.03, dx: -10, dy: 16, duration: 20 },
  { text: 'Не жалею, не зову, не плачу', top: '58%', left: '2%', rotate: 5, size: 'text-4xl', opacity: 0.032, dx: 12, dy: -14, duration: 22 },
  { text: 'В минуту жизни трудную', top: '76%', left: '66%', rotate: -5, size: 'text-5xl', opacity: 0.028, dx: -10, dy: 16, duration: 24 },
  { text: 'Шепот, робкое дыханье', top: '44%', left: '42%', rotate: -13, size: 'text-3xl', opacity: 0.026, dx: 12, dy: -14, duration: 26 },
  { text: 'Гул затих. Я вышел на подмостки', top: '8%', left: '48%', rotate: 3, size: 'text-3xl', opacity: 0.026, dx: -10, dy: 16, duration: 28 },
  { text: 'Перед этим горем гнутся горы', top: '88%', left: '18%', rotate: 2, size: 'text-3xl', opacity: 0.024, dx: 12, dy: -14, duration: 30 },
];

type FragmentStyle = CSSProperties & {
  '--fragment-opacity': number;
  '--fragment-opacity-peak': number;
  '--fragment-rotate': string;
  '--fragment-dx': string;
  '--fragment-dy': string;
  '--fragment-duration': string;
  '--fragment-delay': string;
};

/**
 * Ambient typography deliberately stays outside React/Framer's animation loop.
 * Seven infinite Framer animations plus a scroll MotionValue used to compete with
 * image decoding and Tilt on card-heavy pages. CSS owns the slow decorative drift;
 * coarse pointers and reduced-motion users receive a still backdrop.
 */
export default function PoetryBackdrop() {
  return (
    <div className="poetry-backdrop pointer-events-none fixed inset-0 z-[1] overflow-hidden select-none" aria-hidden="true">
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_0%,black_48%,transparent_80%)]" />
      {fragments.map((fragment, index) => {
        const style: FragmentStyle = {
          top: fragment.top,
          left: fragment.left,
          textShadow: '0 0 28px rgba(0,212,255,0.16)',
          '--fragment-opacity': fragment.opacity,
          '--fragment-opacity-peak': fragment.opacity * 1.55,
          '--fragment-rotate': `${fragment.rotate}deg`,
          '--fragment-dx': `${fragment.dx}px`,
          '--fragment-dy': `${fragment.dy}px`,
          '--fragment-duration': `${fragment.duration}s`,
          '--fragment-delay': `${index * 0.8}s`,
        };

        return (
          <div
            key={fragment.text}
            className={`poetry-backdrop-fragment absolute whitespace-nowrap font-serif italic tracking-wide text-cyan-100/100 ${fragment.size}`}
            style={style}
          >
            {fragment.text}
          </div>
        );
      })}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <path d="M80 210 C260 140, 390 260, 560 180 S900 70, 1120 220" fill="none" stroke="#d4af37" strokeWidth="1.2" />
        <path d="M120 620 C310 520, 520 690, 740 560 S980 430, 1140 590" fill="none" stroke="#2ed8ff" strokeWidth="1" />
      </svg>
    </div>
  );
}

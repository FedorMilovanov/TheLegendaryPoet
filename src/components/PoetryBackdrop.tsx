import { motion, useScroll, useTransform } from 'framer-motion';

const fragments = [
  { text: 'Духовной жаждою томим', top: '14%', left: '4%', rotate: -8, size: 'text-5xl', opacity: 0.035 },
  { text: 'Мысль изреченная есть ложь', top: '30%', left: '68%', rotate: 7, size: 'text-4xl', opacity: 0.03 },
  { text: 'Не жалею, не зову, не плачу', top: '58%', left: '2%', rotate: 5, size: 'text-4xl', opacity: 0.032 },
  { text: 'В минуту жизни трудную', top: '76%', left: '66%', rotate: -5, size: 'text-5xl', opacity: 0.028 },
  { text: 'Шепот, робкое дыханье', top: '44%', left: '42%', rotate: -13, size: 'text-3xl', opacity: 0.026 },
  { text: 'Гул затих. Я вышел на подмостки', top: '8%', left: '48%', rotate: 3, size: 'text-3xl', opacity: 0.026 },
  { text: 'Перед этим горем гнутся горы', top: '88%', left: '18%', rotate: 2, size: 'text-3xl', opacity: 0.024 },
];

export default function PoetryBackdrop() {
  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 800], [1, 0.2]);

  return (
    <motion.div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden select-none" aria-hidden="true" style={{ opacity: scrollOpacity }}>
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_0%,black_48%,transparent_80%)]" />
      {fragments.map((fragment, index) => (
        <motion.div
          key={fragment.text}
          className={`absolute whitespace-nowrap font-serif italic tracking-wide text-cyan-100/100 ${fragment.size}`}
          style={{ top: fragment.top, left: fragment.left, rotate: `${fragment.rotate}deg`, opacity: fragment.opacity, textShadow: '0 0 28px rgba(0,212,255,0.16)' }}
          animate={{ y: [0, index % 2 ? 16 : -14, 0], x: [0, index % 2 ? -10 : 12, 0], opacity: [fragment.opacity, fragment.opacity * 1.6, fragment.opacity] }}
          transition={{ duration: 18 + index * 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.8 }}
        >
          {fragment.text}
        </motion.div>
      ))}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <path d="M80 210 C260 140, 390 260, 560 180 S900 70, 1120 220" fill="none" stroke="#d4af37" strokeWidth="1.2" />
        <path d="M120 620 C310 520, 520 690, 740 560 S980 430, 1140 590" fill="none" stroke="#2ed8ff" strokeWidth="1" />
      </svg>
    </motion.div>
  );
}
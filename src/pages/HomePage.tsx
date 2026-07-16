import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '../components/ui/Link';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { poets, musicTracks } from '../data/poets';
import { getAllArticles } from '../utils/articleLibrary';
import { getAllEssays } from '../data/essays';
import PoetCard from '../components/PoetCard';
import MagneticButton from '../components/MagneticButton';
import { BookMonogramIcon, RutubeIcon, YouTubeIcon, VKIcon } from '../components/ChannelIcons';
import PoetImage from '../components/PoetImage';
import { ArrowRight, Quote, BookOpen, FileText, AudioWaveform, Star, Sparkles } from '../components/PremiumIcons';
import KineticText from '../components/KineticText';
import Reveal from '../components/Reveal';
import PoemOfDay from '../components/PoemOfDay';
import { asset } from '../utils/asset';
import { useSeo } from '../hooks/useSeo';
import { titleCase } from '../utils/titleCase';
import { siteConfig } from '../config/site';

const portraits = [
  { name: 'Сергей Есенин', src: '/images/yesenin.jpg' },
  { name: 'Михаил Лермонтов', src: '/images/lermontov.jpg' },
  { name: 'Александр Пушкин', src: '/images/pushkin.jpg' },
  { name: 'Федор Тютчев', src: '/images/tyutchev.jpg' },
  { name: 'Владимир Маяковский', src: '/images/mayakovsky.jpg' },
  { name: 'Афанасий Фет', src: '/images/fet.jpg' },
];

function HeroTitle() {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const words = [
    { text: 'THE', key: 'the', delay: '0.08s', extra: '' },
    { text: 'LEGENDARY', key: 'legendary', delay: '0.2s', extra: 'italic' },
    { text: 'POET', key: 'poet', delay: '0.32s', extra: '' },
  ];

  return (
    <h1
      className="hero-title-lockup hero-title-crisp editorial-title mb-8 flex w-full flex-col items-center overflow-visible px-6 font-serif text-[clamp(2.8rem,12vw,9.25rem)] font-bold leading-[0.95] sm:px-10"
      onPointerLeave={() => setHoveredWord(null)}
    >
      {words.map((w) => {
        const isHovered = hoveredWord === w.key;
        const isSibling = hoveredWord !== null && !isHovered;

        return (
          <span
            key={w.key}
            className={`hero-blur-reveal hero-word-reveal ${w.key === 'legendary' ? 'hero-blur-reveal-strong' : ''}`}
            style={{ animationDelay: w.delay }}
          >
            <span className={`hero-word-scale ${w.key === 'legendary' ? 'hero-word-scale-legendary' : ''}`}>
              <motion.span
                className={`hero-word-text neon-blue-gradient cursor-default select-none ${w.extra.replace('hero-blur-reveal-strong', '')}`}
                onPointerEnter={() => setHoveredWord(w.key)}
                animate={
                  isHovered
                    ? {
                        y: -10,
                        scale: 1.04,
                        filter: 'blur(0px)',
                        opacity: 1,
                        textShadow: '0 0 18px rgba(0,212,255,0.9), 0 0 40px rgba(0,212,255,0.5), 0 0 70px rgba(0,120,255,0.3)',
                      }
                    : isSibling
                      ? {
                          y: 0,
                          scale: 0.98,
                          filter: 'blur(5px)',
                          opacity: 0.42,
                          textShadow: 'none',
                        }
                      : {
                          y: 0,
                          scale: 1,
                          filter: 'blur(0px)',
                          opacity: 1,
                          textShadow: '0 0 3px rgba(0,212,255,0.72), 0 0 10px rgba(0,212,255,0.42), 0 0 22px rgba(0,120,255,0.22)',
                        }
                }
                transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 0.8 }}
              >
                {w.text}
              </motion.span>
            </span>
          </span>
        );
      })}
    </h1>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#020811] pt-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.14),transparent_48%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/20 via-transparent to-[#050505]" />
        <div className="absolute inset-x-0 top-24 mx-auto h-[460px] max-w-6xl rounded-full bg-cyan-500/10 blur-[90px]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-6rem)] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="w-full">
          <div className="mx-auto mb-16 grid max-w-5xl grid-cols-3 gap-6 opacity-80 sm:grid-cols-6 lg:gap-8">
            {portraits.map((portrait, index) => (
              <motion.div key={portrait.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 * index, duration: 0.65 }} className="relative aspect-[4/5] overflow-hidden rounded-t-full border border-cyan-400/20 bg-black/40 shadow-[0_0_32px_rgba(0,212,255,0.10)]">
                <PoetImage src={portrait.src} name={portrait.name} alt={`Портрет: ${portrait.name}`} className="h-full w-full object-cover grayscale contrast-125 opacity-75" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020811] via-transparent to-cyan-400/10" />
              </motion.div>
            ))}
          </div>
          <HeroTitle />
          <p className="mx-auto mb-10 max-w-3xl font-serif text-xl italic tracking-wide text-cyan-100/70 md:text-2xl">
            <span className="neon-blue-gradient neon-glow-text">"Я памятник себе воздвиг нерукотворный..."</span> — исследуем судьбы, тексты и духовные поиски великих поэтов сквозь призму истории и веры.
          </p>
          <div className="mx-auto mt-2 grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-5 lg:gap-5">
            <motion.div whileHover={{ scale: 1.055, y: -6 }} whileTap={{ scale: 0.965 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
              <Link to="/poets" className="group relative flex min-h-[132px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-cyan-400/12 bg-gradient-to-br from-cyan-500/8 via-transparent to-transparent px-4 py-5 text-center backdrop-blur-md transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_40px_rgba(0,212,255,0.15)] sm:min-h-[160px] sm:gap-3 sm:px-5 sm:py-7">
                <BookMonogramIcon className="h-14 w-14 text-cyan-300 drop-shadow-[0_0_20px_rgba(0,212,255,0.42)] transition-transform duration-500 group-hover:scale-[1.1] group-hover:-rotate-2" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-100 transition-colors group-hover:text-white">Каталог</span>
                <span className="text-[9px] font-medium text-cyan-100/34 transition-colors group-hover:text-cyan-100/58">Исследовать поэтов</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.055, y: -6 }} whileTap={{ scale: 0.965 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
              <Link to="/hall" className="group relative flex min-h-[132px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-luxury-gold/12 bg-gradient-to-br from-luxury-gold/8 via-transparent to-transparent px-4 py-5 text-center backdrop-blur-md transition-all duration-300 hover:border-luxury-gold/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] sm:min-h-[160px] sm:gap-3 sm:px-5 sm:py-7">
                <Sparkles className="h-14 w-14 text-luxury-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.42)] transition-transform duration-500 group-hover:scale-[1.1] group-hover:rotate-12" size={56} />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-luxury-gold-light/90 transition-colors group-hover:text-luxury-gold-light">Зал 3D</span>
                <span className="text-[9px] font-medium text-cyan-100/34 transition-colors group-hover:text-cyan-100/58">Интерактивный</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.055, y: -6 }} whileTap={{ scale: 0.965 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
              <a href={siteConfig.channels.youtube} target="_blank" rel="noopener noreferrer" className="group relative flex min-h-[132px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-red-500/12 bg-gradient-to-br from-red-500/8 via-transparent to-transparent px-4 py-5 text-center backdrop-blur-md transition-all duration-300 hover:border-red-400/30 hover:shadow-[0_0_40px_rgba(255,0,51,0.15)] sm:min-h-[160px] sm:gap-3 sm:px-5 sm:py-7">
                <YouTubeIcon className="h-14 w-14 drop-shadow-[0_0_20px_rgba(255,0,51,0.42)] transition-transform duration-500 group-hover:scale-[1.1]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-200/90 transition-colors group-hover:text-red-100">YouTube</span>
                <span className="text-[9px] font-medium text-cyan-100/34 transition-colors group-hover:text-cyan-100/58">Смотреть видео</span>
              </a>
            </motion.div>
            <motion.div whileHover={{ scale: 1.055, y: -6 }} whileTap={{ scale: 0.965 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
              <a href={siteConfig.channels.rutube} target="_blank" rel="noopener noreferrer" className="group relative flex min-h-[132px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-sky-400/12 bg-gradient-to-br from-sky-500/8 via-transparent to-transparent px-4 py-5 text-center backdrop-blur-md transition-all duration-300 hover:border-sky-300/30 hover:shadow-[0_0_40px_rgba(18,204,237,0.15)] sm:min-h-[160px] sm:gap-3 sm:px-5 sm:py-7">
                <RutubeIcon className="h-14 w-14 drop-shadow-[0_0_20px_rgba(18,204,237,0.42)] transition-transform duration-500 group-hover:scale-[1.08]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-sky-200/90 transition-colors group-hover:text-sky-100">Rutube</span>
                <span className="text-[9px] font-medium text-cyan-100/34 transition-colors group-hover:text-cyan-100/58">Канал проекта</span>
              </a>
            </motion.div>
            <motion.div whileHover={{ scale: 1.055, y: -6 }} whileTap={{ scale: 0.965 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
              <a href={siteConfig.channels.vk} target="_blank" rel="noopener noreferrer" className="group relative flex min-h-[132px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-blue-500/12 bg-gradient-to-br from-blue-500/8 via-transparent to-transparent px-4 py-5 text-center backdrop-blur-md transition-all duration-300 hover:border-blue-400/30 hover:shadow-[0_0_40px_rgba(7,119,255,0.15)] sm:min-h-[160px] sm:gap-3 sm:px-5 sm:py-7">
                <VKIcon className="h-14 w-14 drop-shadow-[0_0_20px_rgba(7,119,255,0.42)] transition-transform duration-500 group-hover:scale-[1.1]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-200/90 transition-colors group-hover:text-blue-100">ВКонтакте</span>
                <span className="text-[9px] font-medium text-cyan-100/34 transition-colors group-hover:text-cyan-100/58">Сообщество</span>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const springValue = useSpring(0, { stiffness: 40, damping: 15, restDelta: 0.001 });
  const displayValue = useTransform(springValue, (latest: number) => Math.floor(latest));
  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => { springValue.set(value); }, 150);
      return () => clearTimeout(timer);
    }
  }, [isInView, springValue, value]);
  return <div ref={ref} className="inline"><motion.span>{displayValue}</motion.span></div>;
}

const stats = [
  { icon: BookOpen, label: 'Поэтов в базе', getValue: () => poets.length },
  { icon: FileText, label: 'Текстов стихов', getValue: () => poets.reduce((acc, p) => acc + p.poems.length, 0) },
  { icon: AudioWaveform, label: 'Аудио-треков', getValue: () => musicTracks.length },
  // Count every published long-form piece: global articles, poet-attached ones, essays.
  { icon: Star, label: 'Глубоких статей', getValue: () => getAllArticles().length + getAllEssays().length },
];

function StatsSection() {
  return (
    <section className="py-16 relative z-10 -mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} viewport={{ once: true }} className="luxury-card group rounded-2xl border border-cyan-400/10 bg-[#061018]/60 p-8 text-center backdrop-blur-lg glow-hover">
              <motion.div whileHover={{ scale: 1.18, rotate: -4 }} transition={{ type: 'spring', stiffness: 440, damping: 16 }} className="mx-auto mb-4 flex h-14 w-14 items-center justify-center text-cyan-300 drop-shadow-[0_0_18px_rgba(0,212,255,0.38)]"><stat.icon size={38} /></motion.div>
              <div className="mx-auto mb-4 h-px w-14 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
              <div className="mb-2 font-serif text-4xl font-bold tracking-tight text-white"><AnimatedCounter value={stat.getValue()} /></div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100/45">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  useSeo({
    title: 'THE LEGENDARY POET | Поэзия, анализ, история',
    description: 'Великие русские поэты: биографии, тексты стихов, глубокий литературный и — где это оправдано — христианский разбор. Пушкин, Лермонтов, Ахматова, Есенин, Блок и другие.',
    path: '/',
  });
  const featuredPoets = useMemo(() => [...poets].sort((a, b) => b.rating - a.rating).slice(0, 3), []);
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-luxury-gold/30">
      <HeroSection />
      <StatsSection />
      <PoemOfDay />
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal direction="up" className="flex items-end justify-between mb-16">
            <div>
              <span className="section-label">Избранные авторы</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">{titleCase('Лица')}{' '}<KineticText text={titleCase('Эпохи')} variant="wave" focusMode stagger={0.04} className="neon-blue-gradient neon-glow-text italic" /></h2>
              <p className="text-cyan-100/48 text-base">Те, кто менял мир одним словом</p>
            </div>
            <Link to="/poets" className="home-all-poets-link items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-all font-semibold shrink-0">Все поэты <ArrowRight size={16} /></Link>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPoets.map((poet, idx) => (<Reveal key={poet.id} direction="up" delay={idx * 0.1}><PoetCard poet={poet} /></Reveal>))}
          </div>
        </div>
      </section>
      <section className="py-32 relative overflow-hidden bg-gradient-to-b from-[#050505] via-[#0b0a08] to-[#050505]">
        <div className="absolute inset-0 shimmer opacity-20 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Quote size={60} className="text-luxury-gold/20 mx-auto mb-8" />
          <blockquote className="text-3xl md:text-4xl font-serif italic text-white mb-8 leading-relaxed tracking-wide">"Поэзия — это память языка о человеческой боли, красоте и достоинстве. Это голос, который звучит сквозь века."</blockquote>
          <cite className="neon-blue-gradient neon-glow-text font-serif text-lg tracking-wider">— THE LEGENDARY POET</cite>
        </div>
      </section>
      <section className="py-24 relative overflow-hidden bg-[#0a0a0a]">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center luxury-card overflow-hidden p-12 md:p-16 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#061018] to-[#050505] shadow-2xl">
          <img
            src={asset('/images/sections/articles-cover.jpg')}
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#061018]/40" />
          <div className="relative z-10">
            <h2 className="text-4xl font-serif font-bold text-white mb-6">{titleCase('Вера, культура и')} <KineticText text={titleCase('трезвая оценка')} variant="wave" focusMode stagger={0.025} className="neon-blue-gradient neon-glow-text" /></h2>
            <p className="text-xl text-cyan-100/55 mb-10 leading-relaxed font-light">Отдельные материалы рассматривают жизнь и тексты поэтов с христианской позиции трезво и ответственно: без натяжек и ложных сенсаций, без объявления поэтов верующими там, где нет оснований. Там же, где есть прямое богоборчество или очевидные библейские мотивы — даём ясный, аргументированный комментарий.</p>
            <div className="flex justify-center gap-6"><MagneticButton to="/articles" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_26px_rgba(0,212,255,0.35)]">Изучить статьи</MagneticButton></div>
          </div>
        </div>
      </section>
    </div>
  );
}
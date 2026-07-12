import { motion } from 'framer-motion';
import { Landmark } from 'lucide-react';
import MagneticButton from '../MagneticButton';
import { BookMonogramIcon, RutubeIcon, YouTubeIcon } from '../ChannelIcons';
import { brandLinks } from '../../config/site';
import { asset } from '../../utils/asset';

const portraits = [
  { src: '/images/pushkin.jpg', name: 'Александр Пушкин' },
  { src: '/images/lermontov.jpg', name: 'Михаил Лермонтов' },
  { src: '/images/tyutchev.jpg', name: 'Фёдор Тютчев' },
  { src: '/images/fet.jpg', name: 'Афанасий Фет' },
  { src: '/images/yesenin.jpg', name: 'Сергей Есенин' },
  { src: '/images/mayakovsky.jpg', name: 'Владимир Маяковский' },
  { src: '/images/akhmatova.jpg', name: 'Анна Ахматова' },
  { src: '/images/gumilev.jpg', name: 'Николай Гумилёв' },
  { src: '/images/blok.jpg', name: 'Александр Блок' },
  { src: '/images/pasternak.jpg', name: 'Борис Пастернак' },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[100vh] overflow-hidden bg-[#020811] pt-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.14),transparent_48%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/20 via-transparent to-[#050505]" />
        <div className="absolute inset-x-0 top-24 mx-auto h-[460px] max-w-6xl rounded-full bg-cyan-500/10 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="mx-auto mb-8 grid max-w-5xl grid-cols-5 gap-3 opacity-95 sm:grid-cols-10">
            {portraits.map((portrait, index) => (
              <motion.div
                key={portrait.src}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.65 }}
                className="relative aspect-[4/5] overflow-hidden rounded-t-full border border-cyan-400/20 bg-black/40 shadow-[0_0_32px_rgba(0,212,255,0.10)]"
              >
                <img src={asset(portrait.src)} alt={`Портрет: ${portrait.name}`} loading="lazy" className="h-full w-full object-cover object-[center_20%] contrast-[1.03] opacity-95" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020811] via-transparent to-cyan-400/10" />
              </motion.div>
            ))}
          </div>

          <h1 className="editorial-title mb-8 flex flex-col items-center overflow-hidden font-serif text-7xl font-bold leading-[0.86] md:text-[10rem]">
            <motion.span
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 0.72 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="neon-blue-gradient neon-glow-text"
            >
              THE
            </motion.span>
            <motion.span
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
              className="neon-blue-gradient neon-glow-text italic"
            >
              LEGENDARY
            </motion.span>
            <motion.span
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.34 }}
              className="neon-blue-gradient neon-glow-text"
            >
              POET
            </motion.span>
          </h1>

          <p className="mx-auto mb-10 max-w-3xl font-serif text-xl italic tracking-wide text-cyan-100/70 md:text-2xl">
            <span className="neon-blue-gradient neon-glow-text">"Я памятник себе воздвиг нерукотворный..."</span> — исследуем наследие, которое осталось в вечности.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-5">
            <MagneticButton
              to="/poets"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:shadow-[0_0_50px_rgba(0,212,255,0.8)]"
            >
              <BookMonogramIcon className="h-5 w-5" /> ИССЛЕДОВАТЬ КАТАЛОГ
            </MagneticButton>
            <MagneticButton
              to="/hall"
              className="border border-luxury-gold/40 text-luxury-gold font-bold hover:bg-luxury-gold/10 hover:border-luxury-gold/70 hover:shadow-[0_0_28px_rgba(212,175,55,0.28)]"
            >
              <Landmark className="h-5 w-5" /> ЗАЛ ПОЭТОВ · 3D
            </MagneticButton>
            <MagneticButton
              href={brandLinks.youtube}
              className="border border-cyan-400/40 text-cyan-300 font-bold hover:bg-cyan-950/30 hover:border-cyan-400/70 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
            >
              <YouTubeIcon className="h-5 w-5" /> YOUTUBE КАНАЛ
            </MagneticButton>
            <MagneticButton
              href={brandLinks.rutube}
              className="border border-cyan-400/30 text-cyan-200/80 font-bold hover:bg-cyan-950/20 hover:border-cyan-400/60 hover:shadow-[0_0_24px_rgba(0,212,255,0.2)]"
            >
              <RutubeIcon className="h-5 w-5" /> RUTUBE
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
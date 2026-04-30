import { motion } from 'framer-motion';

export default function PoetsHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mb-16 flex flex-col gap-8 border-b border-luxury-gold/10 pb-10 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold gold-glow-text">
          Архив создателей
        </span>
        <h1 className="editorial-title text-6xl font-bold tracking-tight text-white md:text-8xl font-serif">
          Лица <span className="gold-gradient italic gold-glow-text">Эпохи</span>
        </h1>
      </div>
      <p className="max-w-md border-l border-luxury-gold/20 pl-6 text-xl font-light leading-relaxed text-luxury-gray-light">
        От золотого века до советского надлома — исследуйте судьбы гениев сквозь призму вечности.
      </p>
    </motion.div>
  );
}

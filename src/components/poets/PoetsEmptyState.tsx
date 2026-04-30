import { motion } from 'framer-motion';

export default function PoetsEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-3xl border border-dashed border-cyan-400/20 py-32 text-center"
    >
      <p className="mb-4 font-serif text-xl italic text-cyan-100/50">Архивы молчат...</p>
      <p className="text-sm font-light text-cyan-200/30">Попробуйте изменить параметры поиска</p>
    </motion.div>
  );
}

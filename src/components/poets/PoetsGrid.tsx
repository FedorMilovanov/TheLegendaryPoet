import { motion } from 'framer-motion';
import { Poet } from '../../types/poet';
import PoetCard from '../PoetCard';

interface PoetsGridProps {
  poets: Poet[];
}

export default function PoetsGrid({ poets }: PoetsGridProps) {
  return (
    <motion.div layout className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
      {poets.map((poet) => (
        <motion.div
          key={poet.id}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          <PoetCard poet={poet} />
        </motion.div>
      ))}
    </motion.div>
  );
}

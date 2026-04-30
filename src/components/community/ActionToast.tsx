import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ActionToastProps {
  message: string;
  tone: 'success' | 'warning';
}

export default function ActionToast({ message, tone }: ActionToastProps) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className={`rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${
          tone === 'success'
            ? 'border-cyan-400/25 bg-cyan-950/85 text-cyan-100'
            : 'border-amber-400/25 bg-amber-950/85 text-amber-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className={tone === 'success' ? 'text-cyan-300' : 'text-amber-300'} />
          <span>{message}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

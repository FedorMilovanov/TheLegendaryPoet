import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ActionToastProps {
  message: string;
  tone: 'success' | 'warning';
}

export default function ActionToast({ message, tone }: ActionToastProps) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;

  // Both tones paint their own dark surface, so the toast and its glyph carry
  // the community-toast marker: the shared light-theme remap must not repaint
  // either of them onto that background.
  return (
    <AnimatePresence>
      <motion.div
        role={tone === 'warning' ? 'alert' : 'status'}
        aria-live={tone === 'warning' ? 'assertive' : 'polite'}
        aria-atomic="true"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className={`theme-community-toast rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${
          tone === 'success'
            ? 'border-cyan-400/25 bg-cyan-950/85 text-cyan-100'
            : 'border-amber-400/25 bg-amber-950/85 text-amber-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} aria-hidden="true" className={`theme-community-toast ${tone === 'success' ? 'text-cyan-300' : 'text-amber-300'}`} />
          <span>{message}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { ArrowUp } from './PremiumIcons';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const shouldShow = latest > 400;
    if (shouldShow !== isVisible) {
      setIsVisible(shouldShow);
    }
  });

  const scrollToTop = () => {
    window.dispatchEvent(new Event('tlp-scroll-top'));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button onClick={scrollToTop}
          className="fixed bottom-28 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/20 bg-[#050505]/80 text-cyan-300 shadow-[0_0_20px_rgba(0,212,255,0.1)] backdrop-blur-xl transition-all hover:border-cyan-400/40 hover:text-white md:bottom-8 md:right-8"
          initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          aria-label="Прокрутить наверх">
          <ArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
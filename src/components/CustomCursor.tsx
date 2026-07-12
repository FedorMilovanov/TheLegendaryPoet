import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  // The immersive 3D hall uses the native pointer — a gold cursor dot floating
  // in the scene reads as an artifact and fights the WebGL interaction.
  const { pathname } = useLocation();
  const onHall = pathname === '/hall';

  useEffect(() => {
    // Touch devices and the 3D hall keep the native pointer.
    if (onHall || window.matchMedia('(pointer: coarse)').matches) {
      setIsVisible(false);
      document.body.classList.remove('has-custom-cursor');
      return;
    }
    setIsVisible(true);
    // Only now hide the native cursor — so if this component never mounts
    // (or fails), the real pointer is preserved.
    document.body.classList.add('has-custom-cursor');

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') ||
        target.closest('button')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      document.body.classList.remove('has-custom-cursor');
    };
  }, [onHall]);

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-luxury-gold rounded-full pointer-events-none z-[9999] mix-blend-difference"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
          scale: isHovering ? 2.5 : 1,
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.2 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 border border-luxury-gold/30 rounded-full pointer-events-none z-[9998]"
        animate={{
          x: mousePosition.x - 24,
          y: mousePosition.y - 24,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.6 }}
      />
    </>
  );
};

export default CustomCursor;

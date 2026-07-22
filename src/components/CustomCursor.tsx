import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * Desktop cursor that never re-renders React on pointer movement.
 *
 * The previous version called setState for every mousemove and asked two Framer
 * components to reconcile new animate props at pointer frequency. That competed
 * directly with TiltCard's requestAnimationFrame work on image grids. Motion
 * values now write to the compositor without entering React's render loop; only
 * rare route/media-capability changes update component state.
 */
const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false);
  const { pathname } = useLocation();
  const onHall = pathname === '/hall';

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringTargetX = useMotionValue(-100);
  const ringTargetY = useMotionValue(-100);
  const dotScale = useMotionValue(1);
  const ringScale = useMotionValue(1);
  const opacity = useMotionValue(0);
  const ringX = useSpring(ringTargetX, { stiffness: 420, damping: 38, mass: 0.34 });
  const ringY = useSpring(ringTargetY, { stiffness: 420, damping: 38, mass: 0.34 });

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const updateCapability = () => setEnabled(!onHall && !coarsePointer.matches);
    updateCapability();
    coarsePointer.addEventListener?.('change', updateCapability);
    return () => coarsePointer.removeEventListener?.('change', updateCapability);
  }, [onHall]);

  useEffect(() => {
    if (!enabled) {
      opacity.set(0);
      document.body.classList.remove('has-custom-cursor');
      return;
    }

    document.body.classList.add('has-custom-cursor');

    const move = (event: PointerEvent) => {
      dotX.set(event.clientX - 8);
      dotY.set(event.clientY - 8);
      ringTargetX.set(event.clientX - 24);
      ringTargetY.set(event.clientY - 24);
      opacity.set(1);
    };

    const updateInteractiveState = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const interactive = Boolean(target?.closest('a, button, input, select, textarea, [role="button"]'));
      dotScale.set(interactive ? 2.15 : 1);
      ringScale.set(interactive ? 1.32 : 1);
    };

    const hide = () => opacity.set(0);
    const show = () => opacity.set(1);

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', updateInteractiveState, { passive: true });
    document.documentElement.addEventListener('mouseleave', hide);
    document.documentElement.addEventListener('mouseenter', show);

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', updateInteractiveState);
      document.documentElement.removeEventListener('mouseleave', hide);
      document.documentElement.removeEventListener('mouseenter', show);
      document.body.classList.remove('has-custom-cursor');
      opacity.set(0);
    };
  }, [enabled, dotScale, dotX, dotY, opacity, ringScale, ringTargetX, ringTargetY]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden="true"
        data-testid="custom-cursor-dot"
        className="fixed left-0 top-0 z-[9999] h-4 w-4 rounded-full bg-luxury-gold mix-blend-difference pointer-events-none"
        style={{ x: dotX, y: dotY, scale: dotScale, opacity }}
      />
      <motion.div
        aria-hidden="true"
        data-testid="custom-cursor-ring"
        className="fixed left-0 top-0 z-[9998] h-12 w-12 rounded-full border border-luxury-gold/30 pointer-events-none"
        style={{ x: ringX, y: ringY, scale: ringScale, opacity }}
      />
    </>
  );
};

export default CustomCursor;

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, summary, [role="button"], [role="link"], [data-cursor-interactive]';

const CustomCursor = () => {
  const { pathname } = useLocation();
  const onHall = pathname === '/hall';
  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const ringX = useSpring(rawX, { stiffness: 620, damping: 48, mass: 0.34 });
  const ringY = useSpring(rawY, { stiffness: 620, damping: 48, mass: 0.34 });
  const [enabled, setEnabled] = useState(false);
  const [insideWindow, setInsideWindow] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forcedColors = window.matchMedia('(forced-colors: active)');

    const updateCapability = () => {
      setEnabled(!onHall && finePointer.matches && !reducedMotion.matches && !forcedColors.matches);
    };

    updateCapability();
    finePointer.addEventListener?.('change', updateCapability);
    reducedMotion.addEventListener?.('change', updateCapability);
    forcedColors.addEventListener?.('change', updateCapability);
    return () => {
      finePointer.removeEventListener?.('change', updateCapability);
      reducedMotion.removeEventListener?.('change', updateCapability);
      forcedColors.removeEventListener?.('change', updateCapability);
    };
  }, [onHall]);

  useEffect(() => {
    if (!enabled) {
      setInsideWindow(false);
      setIsHovering(false);
      hoverRef.current = false;
      document.body.classList.remove('has-custom-cursor');
      return;
    }

    document.body.classList.add('has-custom-cursor');

    const updateHover = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      const next = Boolean(element?.closest(INTERACTIVE_SELECTOR));
      if (next === hoverRef.current) return;
      hoverRef.current = next;
      setIsHovering(next);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      rawX.set(event.clientX);
      rawY.set(event.clientY);
      setInsideWindow((current) => current || true);
      updateHover(event.target);
    };
    const onPointerOver = (event: PointerEvent) => updateHover(event.target);
    const onPointerLeave = () => setInsideWindow(false);
    const onPointerEnter = () => setInsideWindow(true);
    const onBlur = () => setInsideWindow(false);
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') setInsideWindow(false);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerover', onPointerOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.documentElement.addEventListener('pointerenter', onPointerEnter);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerover', onPointerOver);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.documentElement.removeEventListener('pointerenter', onPointerEnter);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.classList.remove('has-custom-cursor');
    };
  }, [enabled, rawX, rawY]);

  if (!enabled) return null;

  const opacity = insideWindow ? 1 : 0;
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-4 w-4 rounded-full bg-luxury-gold mix-blend-difference"
        style={{ x: rawX, y: rawY, marginLeft: -8, marginTop: -8 }}
        animate={{ opacity, scale: isHovering ? 2.25 : 1 }}
        transition={{ opacity: { duration: 0.14 }, scale: { type: 'spring', stiffness: 420, damping: 27 } }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-12 w-12 rounded-full border border-luxury-gold/30"
        style={{ x: ringX, y: ringY, marginLeft: -24, marginTop: -24 }}
        animate={{ opacity, scale: isHovering ? 1.42 : 1 }}
        transition={{ opacity: { duration: 0.2 }, scale: { type: 'spring', stiffness: 280, damping: 24 } }}
      />
    </>
  );
};

export default CustomCursor;

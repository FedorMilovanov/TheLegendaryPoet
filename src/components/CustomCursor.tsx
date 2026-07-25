import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, summary, [role="button"], [role="link"], [data-cursor-interactive]';

type IdleCapableWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const CustomCursor = () => {
  const { pathname } = useLocation();
  const onHall = pathname === '/hall';
  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const ringX = useSpring(rawX, { stiffness: 680, damping: 52, mass: 0.3 });
  const ringY = useSpring(rawY, { stiffness: 680, damping: 52, mass: 0.3 });
  const [enabled, setEnabled] = useState(false);
  const [insideWindow, setInsideWindow] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const insideRef = useRef(false);
  const hoverRef = useRef(false);
  const activatedRef = useRef(false);
  const pointerFrameRef = useRef<number | null>(null);
  const latestPointerRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forcedColors = window.matchMedia('(forced-colors: active)');
    const idleWindow = window as IdleCapableWindow;
    let idleId = 0;
    let fallbackId = 0;
    let cancelled = false;

    const cancelSchedule = () => {
      if (idleId) idleWindow.cancelIdleCallback?.(idleId);
      if (fallbackId) window.clearTimeout(fallbackId);
      idleId = 0;
      fallbackId = 0;
    };

    const updateCapability = () => {
      cancelSchedule();
      const capable = !onHall && finePointer.matches && !reducedMotion.matches && !forcedColors.matches;
      if (!capable) {
        setEnabled(false);
        return;
      }

      // Never replace the OS cursor while the first viewport is decoding and
      // animating. A DOM cursor inevitably freezes during any main-thread task;
      // deferring it preserves hardware-smooth pointer feedback on page open.
      const activate = () => {
        if (!cancelled) setEnabled(true);
      };
      if (idleWindow.requestIdleCallback) idleId = idleWindow.requestIdleCallback(activate, { timeout: 1_600 });
      else fallbackId = window.setTimeout(activate, 850);
    };

    updateCapability();
    finePointer.addEventListener?.('change', updateCapability);
    reducedMotion.addEventListener?.('change', updateCapability);
    forcedColors.addEventListener?.('change', updateCapability);
    return () => {
      cancelled = true;
      cancelSchedule();
      finePointer.removeEventListener?.('change', updateCapability);
      reducedMotion.removeEventListener?.('change', updateCapability);
      forcedColors.removeEventListener?.('change', updateCapability);
    };
  }, [onHall]);

  useEffect(() => {
    activatedRef.current = false;
    insideRef.current = false;
    hoverRef.current = false;

    const cancelPointerFrame = () => {
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
    };

    const setInside = (next: boolean) => {
      if (insideRef.current === next) return;
      insideRef.current = next;
      setInsideWindow(next);
    };

    const setHovering = (next: boolean) => {
      if (hoverRef.current === next) return;
      hoverRef.current = next;
      setIsHovering(next);
    };

    if (!enabled) {
      setInsideWindow(false);
      setIsHovering(false);
      document.body.classList.remove('custom-cursor-ready', 'has-custom-cursor');
      return undefined;
    }

    const updateHover = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      setHovering(Boolean(element?.closest(INTERACTIVE_SELECTOR)));
    };

    const flushPointer = () => {
      pointerFrameRef.current = null;
      rawX.set(latestPointerRef.current.x);
      rawY.set(latestPointerRef.current.y);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      latestPointerRef.current = { x: event.clientX, y: event.clientY };
      if (pointerFrameRef.current === null) pointerFrameRef.current = requestAnimationFrame(flushPointer);

      if (!activatedRef.current) {
        activatedRef.current = true;
        document.body.classList.add('custom-cursor-ready');
        document.body.classList.remove('has-custom-cursor');
      }
      setInside(true);
    };

    const onPointerOver = (event: PointerEvent) => updateHover(event.target);
    const onPointerLeave = () => {
      setInside(false);
      setHovering(false);
    };
    const onPointerEnter = () => {
      if (activatedRef.current) setInside(true);
    };
    const onBlur = () => onPointerLeave();
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') onPointerLeave();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerover', onPointerOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.documentElement.addEventListener('pointerenter', onPointerEnter);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelPointerFrame();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerover', onPointerOver);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.documentElement.removeEventListener('pointerenter', onPointerEnter);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.classList.remove('custom-cursor-ready', 'has-custom-cursor');
    };
  }, [enabled, rawX, rawY]);

  if (!enabled) return null;

  const opacity = insideWindow ? 1 : 0;
  return (
    <>
      <motion.div
        data-custom-cursor-dot
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2.5 w-2.5 rounded-full bg-cyan-50 shadow-[0_0_9px_rgba(216,246,255,0.85),0_0_20px_rgba(46,216,255,0.42)]"
        style={{ x: rawX, y: rawY, marginLeft: -5, marginTop: -5, willChange: 'transform' }}
        animate={{ opacity, scale: isHovering ? 1.65 : 1 }}
        transition={{ opacity: { duration: 0.1 }, scale: { type: 'spring', stiffness: 460, damping: 30 } }}
      />
      <motion.div
        data-custom-cursor-ring
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-10 w-10 rounded-full border border-cyan-200/35 shadow-[0_0_16px_rgba(46,216,255,0.1),inset_0_0_12px_rgba(212,175,55,0.04)]"
        style={{ x: ringX, y: ringY, marginLeft: -20, marginTop: -20, willChange: 'transform' }}
        animate={{ opacity: opacity * 0.92, scale: isHovering ? 1.34 : 1 }}
        transition={{ opacity: { duration: 0.16 }, scale: { type: 'spring', stiffness: 310, damping: 27 } }}
      />
    </>
  );
};

export default CustomCursor;

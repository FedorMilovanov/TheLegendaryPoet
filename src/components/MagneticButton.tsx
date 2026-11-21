import type { PointerEvent, ReactNode } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';
import { Link } from './ui/Link';

interface MagneticButtonProps {
  children: ReactNode;
  to?: string;
  href?: string;
  className?: string;
  onClick?: () => void;
}

const spring = { stiffness: 220, damping: 24, mass: 0.5 };

export default function MagneticButton({ children, to, href, className = '', onClick }: MagneticButtonProps) {
  const reduced = useReducedMotion();
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const reset = () => { x.set(0); y.set(0); };
  const track = (event: PointerEvent<HTMLElement>) => {
    if (reduced || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * 12);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * 6);
  };

  // The pill, keyboard outline and hit region stay together. Only its ink
  // follows the pointer; the pill clips both the ink and the shine sweep.
  const props = {
    onClick, onPointerMove: track, onPointerLeave: reset, onPointerCancel: reset, onBlur: reset,
    className: `group relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-4 font-medium tracking-wide transition-[color,border-color,background-color,box-shadow] duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] ${className}`,
  };
  const content = <>
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out motion-safe:group-hover:translate-x-full" />
    <motion.span className="pointer-events-none relative z-10 flex items-center gap-2" style={reduced ? undefined : { x, y }}>{children}</motion.span>
  </>;

  if (to) return <Link to={to} {...props}>{content}</Link>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{content}</a>;
  return <button type="button" {...props}>{content}</button>;
}

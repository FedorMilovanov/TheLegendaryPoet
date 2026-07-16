import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from './ui/Link';

interface MagneticButtonProps {
  children: ReactNode;
  to?: string;
  href?: string;
  className?: string;
  onClick?: () => void;
}

export default function MagneticButton({
  children,
  to,
  href,
  className = '',
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const Content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-4 font-medium tracking-wide transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] ${className}`}
      onClick={onClick}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block">
        {Content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
        {Content}
      </a>
    );
  }
  return <div className="inline-block cursor-pointer">{Content}</div>;
}

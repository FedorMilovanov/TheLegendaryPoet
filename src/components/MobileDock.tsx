import { useCallback, useLayoutEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Home, Search } from './PremiumIcons';
import { Link } from './ui/Link';
import { titleCase } from '../utils/titleCase';

/**
 * Premium mobile bottom dock. The four persistent destinations prioritise the
 * site's main reading and participation loops; the centre jewel opens every
 * other section through the command palette.
 */
const dockLinks = [
  { label: 'Главная', path: '/', icon: Home },
  { label: 'Поэты', path: '/poets', icon: BookOpen },
  { label: 'Рейтинг', path: '/ratings', icon: Trophy },
  { label: 'Статьи', path: '/articles', icon: FileText },
];

function hapticFeedback() {
  if (navigator.vibrate) navigator.vibrate(10);
}

function DockLink({ link, active }: { link: (typeof dockLinks)[number]; active: boolean }) {
  const Icon = link.icon;
  return (
    <Link
      to={link.path}
      aria-current={active ? 'page' : undefined}
      aria-label={link.label}
      onClick={hapticFeedback}
      className={`dock-item ${active ? 'active' : ''}`}
    >
      {active && (
        <motion.span
          layoutId="dock-active-pill"
          className="dock-pill"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="dock-ic"><Icon size={21} /></span>
      <span className="dock-label">{titleCase(link.label)}</span>
    </Link>
  );
}

export default function MobileDock() {
  const location = useLocation();
  const dockRef = useRef<HTMLElement | null>(null);

  const publishVisualHeight = useCallback(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const rail = dock.querySelector<HTMLElement>('.dock-rail');
    if (!rail) return;
    const railRect = rail.getBoundingClientRect();
    const fab = rail.querySelector<HTMLElement>('.dock-fab');
    const fabRect = fab?.getBoundingClientRect();
    // Measure elements that share the same animated transform coordinate space.
    // Mixing the fixed nav rect with the translating rail rect over-reports the
    // clearance during entrance motion (notably in WebKit).
    const top = fabRect ? Math.min(railRect.top, fabRect.top) : railRect.top;
    const bottom = fabRect ? Math.max(railRect.bottom, fabRect.bottom) : railRect.bottom;
    const visualHeight = bottom - top;
    if (visualHeight > 1) {
      document.documentElement.style.setProperty('--tlp-mobile-dock-clearance', `${Math.ceil(visualHeight)}px`);
    }
  }, []);

  useLayoutEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const root = document.documentElement;

    publishVisualHeight();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(publishVisualHeight);
    observer?.observe(dock);
    const fab = dock.querySelector<HTMLElement>('.dock-fab');
    if (fab) observer?.observe(fab);
    window.addEventListener('resize', publishVisualHeight, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', publishVisualHeight);
      root.style.removeProperty('--tlp-mobile-dock-clearance');
    };
  }, [publishVisualHeight]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const openPalette = () => {
    hapticFeedback();
    window.dispatchEvent(new Event('tlp-open-command-palette'));
  };

  return (
    <nav ref={dockRef} className="mobile-dock" role="navigation" aria-label="Мобильная навигация">
      <motion.div
        className="dock-rail"
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30, delay: 0.15 }}
        onAnimationComplete={publishVisualHeight}
      >
        {dockLinks.slice(0, 2).map((link) => <DockLink key={link.path} link={link} active={isActive(link.path)} />)}

        <button onClick={openPalette} className="dock-fab" aria-label="Открыть поиск и все разделы">
          <span className="dock-fab-ring" aria-hidden="true" />
          <Search size={22} />
        </button>

        {dockLinks.slice(2).map((link) => <DockLink key={link.path} link={link} active={isActive(link.path)} />)}
      </motion.div>
    </nav>
  );
}

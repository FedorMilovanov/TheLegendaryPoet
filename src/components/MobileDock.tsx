import { useLocation } from 'react-router-dom';
import { Link } from './ui/Link';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Home, Search, Heart } from './PremiumIcons';
import { titleCase } from '../utils/titleCase';

/**
 * Premium mobile bottom dock (shown < md). A single glass rail with four
 * destinations, an illuminated active "pill" that slides between them
 * (framer layoutId), and a raised gold→cyan jewel button that opens the
 * command palette. Universal — lives at the app root, so every route gets it.
 */
const dockLinks = [
  { label: 'Главная', path: '/', icon: Home },
  { label: 'Поэты', path: '/poets', icon: BookOpen },
  { label: 'Статьи', path: '/articles', icon: FileText },
  { label: 'Архив', path: '/archive', icon: Heart },
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
      <span className="dock-ic">
        <Icon size={21} />
      </span>
      <span className="dock-label">{titleCase(link.label)}</span>
    </Link>
  );
}

export default function MobileDock() {
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const openPalette = () => {
    hapticFeedback();
    window.dispatchEvent(new Event('tlp-open-command-palette'));
  };

  return (
    // The fixed positioner stays a plain element so its CSS translateX(-50%)
    // centering is never overridden by framer's inline transform. The entrance
    // animation lives on the inner rail instead.
    <nav className="mobile-dock" role="navigation" aria-label="Мобильная навигация">
      <motion.div
        className="dock-rail"
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30, delay: 0.15 }}
      >
        {dockLinks.slice(0, 2).map((link) => (
          <DockLink key={link.path} link={link} active={isActive(link.path)} />
        ))}

        <button onClick={openPalette} className="dock-fab" aria-label="Открыть поиск">
          <span className="dock-fab-ring" aria-hidden="true" />
          <Search size={22} />
        </button>

        {dockLinks.slice(2).map((link) => (
          <DockLink key={link.path} link={link} active={isActive(link.path)} />
        ))}
      </motion.div>
    </nav>
  );
}

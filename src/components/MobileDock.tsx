import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Home, Search, Heart } from './PremiumIcons';

const dockLinks = [
  { label: 'Главная', path: '/', icon: Home },
  { label: 'Поэты', path: '/poets', icon: BookOpen },
  { label: 'Статьи', path: '/articles', icon: FileText },
  { label: 'Архив', path: '/archive', icon: Heart },
];

function hapticFeedback() {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
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
    <nav className="mobile-dock" role="navigation" aria-label="Мобильная навигация">
      {dockLinks.slice(0, 2).map((link) => {
        const active = isActive(link.path);
        return (
          <Link 
            key={link.path} 
            to={link.path} 
            aria-current={active ? 'page' : undefined} 
            aria-label={link.label}
            className={`dock-item relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] ${active ? 'active' : ''}`}
            onClick={hapticFeedback}
          >
            <div className="relative">
              <link.icon size={22} />
              {active && (
                <motion.div layoutId={`dock-glow-${link.path}`} className="absolute inset-0 -m-1 rounded-full bg-cyan-400/10" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
              )}
            </div>
            <span className="mt-0.5 text-[9px] tracking-[0.5px]">{link.label}</span>
          </Link>
        );
      })}

      <button 
        onClick={openPalette} 
        className="relative -mt-5 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border border-cyan-400/25 bg-[#061018]/95 text-cyan-300 shadow-[0_0_30px_rgba(0,212,255,0.18)] backdrop-blur-xl transition hover:text-white active:scale-95" 
        aria-label="Открыть поиск"
      >
        <Search size={24} />
      </button>

      {dockLinks.slice(2).map((link) => {
        const active = isActive(link.path);
        return (
          <Link 
            key={link.path} 
            to={link.path} 
            aria-current={active ? 'page' : undefined}
            aria-label={link.label}
            className={`dock-item relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] ${active ? 'active' : ''}`}
            onClick={hapticFeedback}
          >
            <div className="relative">
              <link.icon size={22} />
              {active && (
                <motion.div layoutId={`dock-glow-${link.path}`} className="absolute inset-0 -m-1 rounded-full bg-cyan-400/10" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
              )}
            </div>
            <span className="mt-0.5 text-[9px] tracking-[0.5px]">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
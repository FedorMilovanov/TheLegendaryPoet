import { useLocation } from 'react-router-dom';
import { Link } from './ui/Link';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import BrandMark from './BrandMark';
import { RutubeIcon, YouTubeIcon, VKIcon } from './ChannelIcons';
import { Search } from './PremiumIcons';
import ThemeToggle from './ThemeToggle';
import { titleCase } from '../utils/titleCase';

const Header = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Главная', path: '/', accent: false },
    { name: 'Поэты', path: '/poets', accent: false },
    { name: 'Зал', path: '/hall', accent: true },
    { name: 'Статьи', path: '/articles', accent: false },
    { name: 'Музыка', path: '/music', accent: false },
    { name: 'Архив', path: '/archive', accent: false },
    { name: 'О проекте', path: '/about', accent: false },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-cyan-400/10 bg-[#050505]/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4 lg:gap-8">
          <Link to="/" className="group flex min-h-11 shrink-0 items-center gap-3">
            <BrandMark size="sm" />
            {/* At tablet width the seven-item navigation needs the horizontal
                space more than the repeated wordmark. The full lockup returns
                on desktop, while the brand icon remains visible everywhere. */}
            <div className="hidden flex-col leading-[1.2] lg:flex">
              <span className="whitespace-nowrap font-serif text-xl font-semibold neon-blue-gradient neon-glow-text">
                THE LEGENDARY POET
              </span>
              <span className="whitespace-nowrap text-[11px] font-medium tracking-[0.18em] text-cyan-200/55">
                ПОЭЗИЯ • АНАЛИЗ • ИСТОРИЯ
              </span>
            </div>
          </Link>

          <nav className="header-nav flex-1 items-center justify-center gap-4 lg:gap-7 xl:gap-8">
            {navigation.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative inline-flex min-h-11 min-w-9 shrink-0 items-center justify-center text-sm font-medium transition-colors hover:text-cyan-300",
                  isActive(item.path) ? "text-cyan-300 neon-glow-text" : "text-cyan-100/55",
                  item.accent && !isActive(item.path) && "text-luxury-gold/70 hover:text-luxury-gold"
                )}
              >
                {titleCase(item.name)}
                {isActive(item.path) && (
                  <motion.span 
                    layoutId="header-nav-indicator"
                    className={cn(
                      "absolute bottom-1 inset-x-0 h-0.5 rounded-full",
                      item.accent 
                        ? "bg-luxury-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]" 
                        : "bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.8)]"
                    )}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="header-controls ml-auto shrink-0 items-center gap-2.5 lg:gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('tlp-open-command-palette'))}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-cyan-400/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/55 transition hover:border-cyan-400/35 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
              aria-label="Открыть поиск"
            >
              <Search size={13} />
              <span className="header-search-label">Ctrl K</span>
            </button>
            <a href="https://youtube.com/@TheLegendaryPoet" target="_blank" rel="noopener noreferrer" className="header-social group/social flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 hover:bg-red-500/10" aria-label="YouTube">
              <YouTubeIcon className="h-[20px] w-[20px] transition-transform duration-300 group-hover/social:scale-110 group-hover/social:drop-shadow-[0_0_10px_rgba(255,0,51,0.5)]" />
            </a>
            <a href="https://rutube.ru/channel/74579453" target="_blank" rel="noopener noreferrer" className="header-social group/social flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 hover:bg-sky-500/10" aria-label="Rutube">
              <RutubeIcon className="h-[21px] w-[21px] transition-transform duration-300 group-hover/social:scale-110 group-hover/social:drop-shadow-[0_0_10px_rgba(18,204,237,0.5)]" />
            </a>
            <a href="https://vk.com/thelegendarypoet" target="_blank" rel="noopener noreferrer" className="header-social group/social flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 hover:bg-blue-500/10" aria-label="VK">
              <VKIcon className="h-[20px] w-[20px] transition-transform duration-300 group-hover/social:scale-110 group-hover/social:drop-shadow-[0_0_10px_rgba(7,119,255,0.5)]" />
            </a>
          </div>

          {/* Mobile: theme toggle only — search lives in the dock's centre jewel,
              a second search button here would duplicate it. */}
          <div className="header-mobile-controls ml-auto shrink-0 items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

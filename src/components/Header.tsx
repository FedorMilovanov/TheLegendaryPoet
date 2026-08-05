import { useLocation } from 'react-router';
import { Link } from './ui/Link';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import SpectralBrandMark from './SpectralBrandMark';
import { RutubeIcon, YouTubeIcon, VKIcon } from './ChannelIcons';
import { Search } from './PremiumIcons';
import ThemeToggle from './ThemeToggle';
import { titleCase } from '../utils/titleCase';

const Header = () => {
  const location = useLocation();
  const navigation = [
    { name: 'Главная', path: '/', accent: false },
    { name: 'Поэты', path: '/poets', accent: false },
    { name: 'Рейтинг', path: '/ratings', accent: true },
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
        <div className="flex h-20 items-center justify-between gap-3 lg:gap-8">
          <Link to="/" className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 md:flex-none">
            <SpectralBrandMark size="sm" variant="header" priority className="scale-[1.08]" />

            <div aria-hidden="true" className="relative flex min-w-0 flex-1 items-center pb-[7px] md:hidden">
              <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap bg-[linear-gradient(90deg,#e7fcff_0%,#8eeeff_34%,#2ed8ff_68%,#89a7ff_100%)] bg-clip-text font-serif text-[clamp(10.4px,3.08vw,13.4px)] font-semibold uppercase leading-none tracking-[clamp(0.055em,0.62vw,0.11em)] text-transparent [filter:drop-shadow(0_0_6px_rgba(46,216,255,0.24))_drop-shadow(0_0_16px_rgba(66,110,255,0.10))]">
                THE LEGENDARY POET
              </span>
              <span className="pointer-events-none absolute bottom-0 left-0 h-px w-[58%] bg-[linear-gradient(90deg,rgba(212,175,55,0.72),rgba(46,216,255,0.42),transparent)] shadow-[0_0_7px_rgba(212,175,55,0.10)]" />
            </div>

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
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative inline-flex min-h-11 min-w-9 shrink-0 items-center justify-center text-sm font-medium transition-colors hover:text-cyan-300',
                  isActive(item.path) ? 'text-cyan-300 neon-glow-text' : 'text-cyan-100/55',
                  item.accent && !isActive(item.path) && 'text-luxury-gold/70 hover:text-luxury-gold',
                )}
              >
                {titleCase(item.name)}
                {isActive(item.path) && (
                  <motion.span
                    layoutId="header-nav-indicator"
                    className={cn(
                      'absolute inset-x-0 bottom-1 h-0.5 rounded-full',
                      item.accent
                        ? 'bg-luxury-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]'
                        : 'bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.8)]',
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
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-cyan-400/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/55 transition hover:border-cyan-400/35 hover:text-cyan-300"
              aria-label="Открыть поиск"
            >
              <Search size={13} />
              <span className="header-search-label">Ctrl K</span>
            </button>
            <a
              href="https://youtube.com/@TheLegendaryPoet"
              target="_blank"
              rel="noopener noreferrer"
              className="header-social group/social flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 hover:bg-red-500/10"
              aria-label="YouTube"
            >
              <YouTubeIcon className="h-[20px] w-[20px] transition-transform duration-300 group-hover/social:scale-110" />
            </a>
            <a
              href="https://rutube.ru/channel/74579453"
              target="_blank"
              rel="noopener noreferrer"
              className="header-social group/social flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 hover:bg-sky-500/10"
              aria-label="Rutube"
            >
              <RutubeIcon className="h-[21px] w-[21px] transition-transform duration-300 group-hover/social:scale-110" />
            </a>
            <a
              href="https://vk.com/thelegendarypoet"
              target="_blank"
              rel="noopener noreferrer"
              className="header-social group/social flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 hover:bg-blue-500/10"
              aria-label="VK"
            >
              <VKIcon className="h-[20px] w-[20px] transition-transform duration-300 group-hover/social:scale-110" />
            </a>
          </div>

          <div className="header-mobile-controls ml-auto h-11 w-11 shrink-0 self-center items-center justify-center [&>button]:m-0 [&>button]:flex [&>button]:h-10 [&>button]:w-10 [&>button]:items-center [&>button]:justify-center [&_svg]:block [&_svg]:shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

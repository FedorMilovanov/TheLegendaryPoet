import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MessageCircle, Search } from 'lucide-react';
import BrandMark from './BrandMark';
import { RutubeIcon, YouTubeIcon } from './ChannelIcons';
import { siteConfig } from '../config/site';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Главная', path: '/' },
    { name: 'Поэты', path: '/poets' },
    { name: 'Зал 3D', path: '/hall' },
    { name: 'Статьи', path: '/articles' },
    { name: 'Музыка', path: '/music' },
    { name: 'О проекте', path: '/about' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-cyan-400/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <BrandMark size="sm" />
            <div className="hidden min-w-0 sm:block">
              <h1 className="truncate text-xl font-serif font-semibold neon-blue-gradient neon-glow-text">
                THE LEGENDARY POET
              </h1>
              <p className="-mt-1 truncate text-xs tracking-[0.14em] text-cyan-200/60">ПОЭЗИЯ • АНАЛИЗ • ИСТОРИЯ</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative text-sm font-medium transition-colors hover:text-cyan-300 ${
                  location.pathname === item.path
                    ? 'text-cyan-300 neon-glow-text'
                    : 'text-cyan-100/50'
                }`}
              >
                {item.name}
                {location.pathname === item.path && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Social Links */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('tlp-open-command-palette'))}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/55 transition hover:border-cyan-400/35 hover:text-cyan-300"
              aria-label="Открыть поиск"
            >
              <Search size={14} /> Ctrl K
            </button>
            <a
              href={siteConfig.channels.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-200/50 hover:text-red-500 transition-colors"
              aria-label="YouTube"
            >
              <YouTubeIcon className="h-5 w-5" />
            </a>
            <a
              href={siteConfig.channels.rutube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-200/50 hover:text-cyan-300 transition-colors"
              aria-label="Rutube"
            >
              <RutubeIcon className="h-5 w-5" />
            </a>
            <a
              href={siteConfig.channels.vk}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-200/50 hover:text-blue-400 transition-colors"
              aria-label="VK"
            >
              <MessageCircle size={20} />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-luxury-gray-light hover:text-white transition-colors"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#050505] border-t border-cyan-400/10">
          <div className="px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors hover:text-cyan-400 ${
                  location.pathname === item.path
                    ? 'text-cyan-400'
                    : 'text-cyan-100/50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex items-center space-x-4 pt-3 border-t border-cyan-400/10">
              <a href={siteConfig.channels.youtube} target="_blank" rel="noopener noreferrer" className="text-cyan-200/50 hover:text-red-500" aria-label="YouTube">
                <YouTubeIcon className="h-5 w-5" />
              </a>
              <a href={siteConfig.channels.rutube} target="_blank" rel="noopener noreferrer" className="text-cyan-200/50 hover:text-cyan-400" aria-label="Rutube">
                <RutubeIcon className="h-5 w-5" />
              </a>
              <a href={siteConfig.channels.vk} target="_blank" rel="noopener noreferrer" className="text-cyan-200/50 hover:text-blue-400" aria-label="VK">
                <MessageCircle size={20} />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

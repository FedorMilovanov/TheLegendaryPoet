import type { ComponentType } from 'react';
import { Link } from './ui/Link';
import { RutubeIcon, YouTubeIcon, VKIcon } from './ChannelIcons';
import { Mail } from './PremiumIcons';
import SpectralBrandMark from './SpectralBrandMark';
import { getWordOfDay } from '../utils/dailyContent';
import { titleCase } from '../utils/titleCase';
import { siteConfig } from '../config/site';

const footerLinks = [
  { label: 'Поэты', path: '/poets' },
  { label: 'Зал Поэтов', path: '/hall' },
  { label: 'Статьи', path: '/articles' },
  { label: 'Музыка', path: '/music' },
  { label: 'Мой Архив', path: '/archive' },
  { label: 'О проекте', path: '/about' },
];

const trustLinks = [
  { label: 'Редакционная политика', path: '/editorial-policy' },
  { label: 'Конфиденциальность', path: '/privacy' },
  { label: 'RSS / Atom', href: '/feed.xml' },
];

interface SocialLink {
  Icon: ComponentType<{ className?: string }>;
  href: string;
  label: string;
  hoverBg: string;
}

const socials: SocialLink[] = [
  { Icon: YouTubeIcon, href: siteConfig.channels.youtube, label: 'YouTube', hoverBg: 'hover:bg-red-500/10' },
  { Icon: RutubeIcon, href: siteConfig.channels.rutube, label: 'Rutube', hoverBg: 'hover:bg-sky-500/10' },
  { Icon: VKIcon, href: siteConfig.channels.vk, label: 'VK', hoverBg: 'hover:bg-blue-500/10' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const wordOfDay = getWordOfDay();

  return (
    <footer className="theme-page-surface relative mt-20 border-t border-cyan-400/8">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link to="/" className="group mb-5 inline-flex min-h-11 items-center gap-3">
              <SpectralBrandMark size="md" variant="primary" className="scale-[1.06]" />
              <span className="flex flex-col leading-tight">
                <span className="neon-blue-gradient neon-glow-text font-serif text-lg font-semibold">THE LEGENDARY POET</span>
                <span className="text-[10px] tracking-[0.16em] theme-functional-subtle">ПОЭЗИЯ • АНАЛИЗ • ИСТОРИЯ</span>
              </span>
            </Link>
            <p className="mb-5 max-w-lg text-sm leading-relaxed theme-functional-muted">
              Проект о великих поэтах, их биографиях, текстах и историческом контексте. Отдельные материалы затрагивают веру, культуру и нравственную оценку.
            </p>

            <div className="mb-6 max-w-sm border-l-2 border-cyan-400/15 pl-4">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] theme-functional-muted">Слово дня</div>
              <div className="font-serif text-xl italic theme-text">«{wordOfDay.word}»</div>
              <div className="mt-1 text-xs theme-functional-subtle">{wordOfDay.poet.name}, «{wordOfDay.poem.title}»</div>
            </div>

            <div className="flex items-center gap-2">
              {socials.map(({ Icon, href, label, hoverBg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`group/social flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${hoverBg}`}
                >
                  <Icon className="h-5 w-5 transition-transform duration-300 group-hover/social:scale-110" />
                </a>
              ))}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                aria-label={`Email: ${siteConfig.contactEmail}`}
                className="group/social flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 hover:bg-luxury-gold/10"
              >
                <Mail size={18} className="theme-control-idle transition-transform duration-300 group-hover/social:scale-110" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] theme-functional-muted">Разделы</h4>
            <ul className="space-y-1">
              {footerLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="group/link inline-flex min-h-11 items-center gap-1.5 text-sm theme-control-idle transition-colors"
                  >
                    <span className="h-px w-0 bg-cyan-400 transition-all duration-300 group-hover/link:w-3" />
                    {titleCase(item.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] theme-functional-muted">Информация</h4>
            <ul className="space-y-1">
              {trustLinks.map((item) => (
                <li key={item.path || item.href}>
                  {'path' in item ? (
                    <Link to={item.path!} className="inline-flex min-h-11 items-center text-sm theme-control-idle transition">
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} className="inline-flex min-h-11 items-center text-sm theme-control-idle transition">
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <ul className="mt-5 space-y-2 text-sm theme-functional-subtle">
              <li>© {year} THE LEGENDARY POET</li>
              <li>Все права защищены</li>
              <li className="italic theme-functional-subtle">Независимая редакция</li>
            </ul>
          </div>
        </div>

        <div className="my-8 h-px bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent" />
        <p className="text-center text-[11px] tracking-wide theme-functional-subtle">
          THE LEGENDARY POET — независимый редакторский проект о поэзии, истории и культурном контексте.
        </p>
      </div>
    </footer>
  );
}

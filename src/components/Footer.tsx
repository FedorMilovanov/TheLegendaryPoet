import { MessageCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RutubeIcon, YouTubeIcon } from './ChannelIcons';

const footerLinks = [
  { label: 'Поэты', path: '/poets' },
  { label: 'Статьи', path: '/articles' },
  { label: 'Музыка', path: '/music' },
  { label: 'О проекте', path: '/about' },
];

const Footer = () => {
  return (
    <footer className="bg-[#050505] border-t border-cyan-400/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="mb-4 text-2xl font-serif font-semibold neon-blue-gradient neon-glow-text">
              THE LEGENDARY POET
            </h3>
            <p className="mb-4 max-w-xl text-sm leading-relaxed text-cyan-100/50">
              Проект о великих поэтах, их биографиях, текстах, статьях, музыке и историческом контексте. Отдельные материалы затрагивают веру, культуру и нравственную оценку — только там, где это действительно оправдано.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://youtube.com/@TheLegendaryPoet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-200/50 hover:text-red-500 transition-colors"
                aria-label="YouTube"
              >
                <YouTubeIcon className="h-5 w-5" />
              </a>
              <a
                href="https://rutube.ru/channel/74579453"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-200/50 hover:text-cyan-300 transition-colors"
                aria-label="Rutube"
              >
                <RutubeIcon className="h-5 w-5" />
              </a>
              <a
                href="https://vk.com/thelegendarypoet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-200/50 hover:text-blue-400 transition-colors"
                aria-label="VK"
              >
                <MessageCircle size={20} />
              </a>
              <a
                href="mailto:contact@legendarypoet.com"
                className="text-cyan-200/50 hover:text-cyan-300 transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-cyan-100 font-semibold mb-4">Разделы</h4>
            <ul className="space-y-2">
              {footerLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="text-cyan-200/50 hover:text-cyan-300 text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-cyan-100 font-semibold mb-4">Информация</h4>
            <ul className="space-y-2 text-sm text-cyan-200/50">
              <li>© 2024 THE LEGENDARY POET</li>
              <li>Все права защищены</li>
              <li>Редакторская сборка проекта</li>
            </ul>
          </div>
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent my-8" />

        <div className="text-center text-sm text-cyan-200/30">
          <p>
            THE LEGENDARY POET — независимый редакторский проект о поэзии, истории и культурном контексте.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

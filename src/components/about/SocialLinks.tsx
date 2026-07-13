import { MessageCircle } from 'lucide-react';
import { RutubeIcon, YouTubeIcon } from '../ChannelIcons';
import { siteConfig } from '../../config/site';
import { titleCase } from '../../utils/titleCase';

const socials = [
  { icon: <YouTubeIcon className="h-7 w-7" />, label: 'YouTube', href: siteConfig.channels.youtube, color: 'hover:text-red-500' },
  { icon: <RutubeIcon className="h-7 w-7" />, label: 'Rutube', href: siteConfig.channels.rutube, color: 'hover:text-cyan-300' },
  { icon: <MessageCircle size={28} />, label: 'VK', href: siteConfig.channels.vk, color: 'hover:text-blue-400' },
];

export default function SocialLinks() {
  return (
    <section className="mb-12 text-center">
      <h2 className="mb-8 font-serif text-3xl font-bold text-white">{titleCase('Мы в соцсетях')}</h2>
      <div className="flex justify-center gap-6">
        {socials.map((social) => (
          <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className={`text-luxury-gray-light ${social.color} transition-colors`} aria-label={social.label}>
            {social.icon}
          </a>
        ))}
      </div>
    </section>
  );
}
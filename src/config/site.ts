/**
 * Single source of truth for brand-level links and metadata.
 *
 * Previously the YouTube / Rutube / VK / e-mail values were hard-coded and
 * duplicated across ~15 files. Change them ONCE here before launch — confirm
 * each channel and the mail domain actually resolve.
 */
export const siteConfig = {
  name: 'THE LEGENDARY POET',
  shortName: 'TLP',
  description:
    'Канал о великих поэтах: биографии, тексты, глубокий литературный и, где это оправдано, христианский разбор.',
  // Production URL (GitHub Pages project site). Change together with the OG
  // tags in index.html and VITE_BASE if you move to a custom domain.
  url: 'https://fedormilovanov.github.io/TheLegendaryPoet',
  locale: 'ru_RU',
  channels: {
    youtube: 'https://youtube.com/@TheLegendaryPoet',
    rutube: 'https://rutube.ru/channel/74579453',
    vk: 'https://vk.com/thelegendarypoet',
  },
  contactEmail: 'oldpoet2025@gmail.com',
} as const;

export const brandLinks = siteConfig.channels;

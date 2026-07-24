import { siteConfig } from '../config/site';
import type { Essay } from '../types/essay';
import type { Article, MusicTrack, Poet } from '../types/poet';

function absoluteUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return `${siteConfig.url}/og-image.jpg`;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${siteConfig.url}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null || item === '') return false;
      if (Array.isArray(item) && item.length === 0) return false;
      return true;
    }),
  ) as T;
}

function organization() {
  return {
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon-512.png` },
  };
}

function breadcrumb(name: string, url: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: siteConfig.name,
        item: `${siteConfig.url}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name,
        item: url,
      },
    ],
  };
}

export function poetsCollectionStructuredData(poets: Poet[]): Record<string, unknown> {
  const url = `${siteConfig.url}/poets`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        url,
        name: 'Русские поэты: биографии, стихи и исследования',
        description:
          'Каталог русских поэтов: биографии, избранные стихи, свидетельства современников и документальные исследования.',
        inLanguage: 'ru-RU',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: poets.length,
          itemListElement: poets.map((poet, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Person',
              '@id': `${siteConfig.url}/poets/${poet.id}#person`,
              name: poet.fullName || poet.name,
              url: `${siteConfig.url}/poets/${poet.id}`,
              image: absoluteUrl(poet.photo),
            },
          })),
        },
        publisher: organization(),
      },
      breadcrumb('Поэты', url),
    ],
  };
}

export function articlesCollectionStructuredData(
  essays: Essay[],
  articles: Article[],
): Record<string, unknown> {
  const url = `${siteConfig.url}/articles`;
  const entries = [
    ...essays.map((essay) => ({
      id: `${siteConfig.url}/essays/${essay.slug}#article`,
      name: essay.title,
      url: `${siteConfig.url}/essays/${essay.slug}`,
      image: absoluteUrl(essay.cardCover || essay.cover),
    })),
    ...articles.map((article) => ({
      id: `${siteConfig.url}/articles/${article.id}#article`,
      name: article.title,
      url: `${siteConfig.url}/articles/${article.id}`,
      image: absoluteUrl(article.image),
    })),
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        url,
        name: 'Статьи, биографии и литературные исследования',
        description:
          'Большие биографии поэтов, документальные расследования, история произведений, архивные источники и литературный анализ.',
        inLanguage: 'ru-RU',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: entries.length,
          itemListElement: entries.map((entry, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Article',
              '@id': entry.id,
              name: entry.name,
              url: entry.url,
              image: entry.image,
            },
          })),
        },
        publisher: organization(),
      },
      breadcrumb('Статьи', url),
    ],
  };
}

export function musicCollectionStructuredData(tracks: MusicTrack[]): Record<string, unknown> {
  const url = `${siteConfig.url}/music`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        url,
        name: 'Музыкальные интерпретации поэзии',
        description: 'Музыкальные интерпретации и декламации великих стихов на каналах проекта.',
        inLanguage: 'ru-RU',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: tracks.length,
          itemListElement: tracks.map((track, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: compact({
              '@type': 'MusicRecording',
              name: track.title,
              byArtist: { '@type': 'Person', name: track.poet },
              description: track.description,
              duration: track.duration,
              url: track.externalUrl || track.videoUrl || url,
              contentUrl: track.audioUrl ? absoluteUrl(track.audioUrl) : undefined,
            }),
          })),
        },
        publisher: organization(),
      },
      breadcrumb('Музыка', url),
    ],
  };
}

export function aboutPageStructuredData(): Record<string, unknown> {
  const url = `${siteConfig.url}/about`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${url}#about`,
        url,
        name: 'О проекте THE LEGENDARY POET',
        description:
          'Независимый редакторский проект о поэзии, истории и культуре с осторожным христианским анализом.',
        inLanguage: 'ru-RU',
        mainEntity: organization(),
      },
      organization(),
      breadcrumb('О проекте', url),
    ],
  };
}

export function hallPageStructuredData(): Record<string, unknown> {
  const url = `${siteConfig.url}/hall`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#page`,
        url,
        name: 'Зал Поэтов — в разработке',
        description: 'Иммерсивный Храм Русской Поэзии сейчас в разработке.',
        inLanguage: 'ru-RU',
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${siteConfig.url}/#website`,
          url: siteConfig.url,
        },
        publisher: organization(),
      },
      breadcrumb('Зал Поэтов', url),
    ],
  };
}

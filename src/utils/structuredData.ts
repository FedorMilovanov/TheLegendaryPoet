import { siteConfig } from '../config/site';
import type { Essay } from '../types/essay';
import type { Article, Poet } from '../types/poet';

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

function breadcrumb(items: Array<{ name: string; url: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function relatedEssaysFor(essay: Essay, essays: Essay[]): Essay[] {
  const manual = new Set(essay.relatedEssayIds ?? []);
  return essays
    .filter((candidate) => {
      if (candidate.id === essay.id) return false;
      if (manual.has(candidate.id)) return true;
      return Boolean(essay.cluster?.id && candidate.cluster?.id === essay.cluster.id);
    })
    .sort((a, b) => {
      const aManual = essay.relatedEssayIds?.indexOf(a.id) ?? -1;
      const bManual = essay.relatedEssayIds?.indexOf(b.id) ?? -1;
      if (aManual >= 0 || bManual >= 0) {
        if (aManual < 0) return 1;
        if (bManual < 0) return -1;
        return aManual - bManual;
      }
      return (a.cluster?.order ?? 999) - (b.cluster?.order ?? 999);
    });
}

export function legacyArticleStructuredData(article: Article): Record<string, unknown> {
  const url = `${siteConfig.url}/articles/${article.id}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      compact({
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: article.title,
        description: article.excerpt,
        image: absoluteUrl(article.image),
        url,
        inLanguage: 'ru-RU',
        datePublished: article.date,
        dateModified: article.date,
        timeRequired: `PT${article.readTime}M`,
        articleSection: article.category,
        author: {
          '@type': 'Organization',
          name: article.author || siteConfig.name,
          url: `${siteConfig.url}/about`,
        },
        publisher: {
          '@type': 'Organization',
          name: siteConfig.name,
          url: siteConfig.url,
          logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon-512.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      }),
      breadcrumb([
        { name: siteConfig.name, url: `${siteConfig.url}/` },
        { name: 'Статьи', url: `${siteConfig.url}/articles` },
        { name: article.title, url },
      ]),
    ],
  };
}

export function essayStructuredData(
  essay: Essay,
  poet?: Poet,
  relatedEssays: Essay[] = [],
): Record<string, unknown> {
  const url = `${siteConfig.url}/essays/${essay.slug}`;
  const image = absoluteUrl(essay.cover);
  const articleId = `${url}#article`;
  const clusterId = essay.cluster
    ? `${siteConfig.url}/articles#cluster-${essay.cluster.id}`
    : undefined;

  const article = compact({
    '@type': 'Article',
    '@id': articleId,
    headline: essay.title,
    alternativeHeadline: essay.subtitle,
    description: essay.seoDescription ?? essay.excerpt,
    image: {
      '@type': 'ImageObject',
      url: image,
      caption: essay.coverAlt ?? essay.title,
      creditText: essay.coverCredit,
    },
    url,
    inLanguage: 'ru-RU',
    datePublished: essay.date,
    dateModified: essay.date,
    timeRequired: `PT${essay.readTime}M`,
    keywords: essay.seoKeywords ?? essay.tags,
    articleSection: essay.cluster?.label ?? essay.kicker,
    author: {
      '@type': 'Organization',
      name: essay.author,
      url: `${siteConfig.url}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    about: poet
      ? {
          '@type': 'Person',
          '@id': `${siteConfig.url}/poets/${poet.id}#person`,
          name: poet.fullName || poet.name,
          alternateName: poet.name,
          url: `${siteConfig.url}/poets/${poet.id}`,
        }
      : undefined,
    isPartOf: clusterId ? { '@id': clusterId } : undefined,
    citation: (essay.sources ?? [])
      .filter((source) => source.url)
      .slice(0, 24)
      .map((source) => ({
        '@type': source.kind === 'primary' ? 'CreativeWork' : 'ScholarlyArticle',
        name: source.title,
        url: source.url,
      })),
  });

  const graph: Record<string, unknown>[] = [
    article,
    breadcrumb([
      { name: siteConfig.name, url: `${siteConfig.url}/` },
      { name: 'Статьи', url: `${siteConfig.url}/articles` },
      { name: essay.title, url },
    ]),
  ];

  if (essay.cluster && clusterId) {
    graph.push({
      '@type': 'CollectionPage',
      '@id': clusterId,
      name: essay.cluster.label,
      url: `${siteConfig.url}/articles`,
      inLanguage: 'ru-RU',
      hasPart: [essay, ...relatedEssays]
        .filter((entry, index, entries) => entries.findIndex((item) => item.id === entry.id) === index)
        .slice(0, 10)
        .map((entry) => ({
          '@type': 'Article',
          '@id': `${siteConfig.url}/essays/${entry.slug}#article`,
          name: entry.title,
          url: `${siteConfig.url}/essays/${entry.slug}`,
        })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function poetStructuredData(
  poet: Poet,
  relatedEssays: Essay[] = [],
): Record<string, unknown> {
  const url = `${siteConfig.url}/poets/${poet.id}`;
  const personId = `${url}#person`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      compact({
        '@type': 'ProfilePage',
        '@id': `${url}#profile`,
        url,
        name: `${poet.name} — биография, стихи и исследования`,
        description: poet.shortBio,
        inLanguage: 'ru-RU',
        mainEntity: { '@id': personId },
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${siteConfig.url}/#website`,
          name: siteConfig.name,
          url: `${siteConfig.url}/`,
        },
      }),
      compact({
        '@type': 'Person',
        '@id': personId,
        name: poet.fullName || poet.name,
        alternateName: poet.name,
        description: poet.shortBio,
        image: absoluteUrl(poet.photo),
        url,
        birthDate: String(poet.birthYear),
        deathDate: poet.deathYear ? String(poet.deathYear) : undefined,
        nationality: poet.nationality,
        jobTitle: 'Поэт',
        knowsAbout: poet.tags,
        subjectOf: relatedEssays.slice(0, 12).map((essay) => ({
          '@type': 'Article',
          '@id': `${siteConfig.url}/essays/${essay.slug}#article`,
          name: essay.title,
          url: `${siteConfig.url}/essays/${essay.slug}`,
        })),
      }),
      breadcrumb([
        { name: siteConfig.name, url: `${siteConfig.url}/` },
        { name: 'Поэты', url: `${siteConfig.url}/poets` },
        { name: poet.name, url },
      ]),
    ],
  };
}

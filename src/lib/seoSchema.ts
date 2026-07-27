import { siteConfig } from '../config/site';

export type JsonLdNode = Record<string, unknown>;

export interface SeoBreadcrumb {
  name: string;
  path: string;
}

export const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
export const WEBSITE_ID = `${siteConfig.url}/#website`;

export function absoluteUrl(pathOrUrl?: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteConfig.url}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export function secondsToIsoDuration(seconds?: number): string | undefined {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return undefined;
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;
  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${remainingSeconds || (!hours && !minutes) ? `${remainingSeconds}S` : ''}`;
}

export function organizationSchema(): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: siteConfig.name,
    url: `${siteConfig.url}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}/icon-512.png`,
      width: 512,
      height: 512,
    },
    description: siteConfig.description,
    email: siteConfig.contactEmail,
    sameAs: Object.values(siteConfig.channels),
  };
}

export function websiteSchema(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: siteConfig.name,
    url: `${siteConfig.url}/`,
    inLanguage: 'ru-RU',
    description: siteConfig.description,
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function breadcrumbSchema(items: SeoBreadcrumb[]): JsonLdNode | undefined {
  if (items.length < 2) return undefined;
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(items.at(-1)?.path)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function schemaGraph(nodes: Array<JsonLdNode | undefined>): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter((node): node is JsonLdNode => Boolean(node)),
  };
}

interface WebPageSchemaInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  breadcrumbs?: SeoBreadcrumb[];
  mainEntity?: JsonLdNode;
  datePublished?: string;
  dateModified?: string;
}

export function buildWebPageSchema({
  title,
  description,
  path,
  image,
  breadcrumbs = [],
  mainEntity,
  datePublished,
  dateModified,
}: WebPageSchemaInput): JsonLdNode {
  const url = absoluteUrl(path)!;
  const pageId = `${url}#webpage`;
  return schemaGraph([
    {
      '@type': 'WebPage',
      '@id': pageId,
      url,
      name: title,
      description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': WEBSITE_ID },
      primaryImageOfPage: image ? { '@type': 'ImageObject', url: absoluteUrl(image) } : undefined,
      breadcrumb: breadcrumbs.length > 1 ? { '@id': `${url}#breadcrumb` } : undefined,
      mainEntity,
      datePublished,
      dateModified,
    },
    breadcrumbSchema(breadcrumbs),
  ]);
}

interface ArticleSchemaInput extends WebPageSchemaInput {
  author: string;
  tags?: string[];
  section?: string;
  poet?: { id: string; name: string };
}

export function buildArticlePageSchema({
  title,
  description,
  path,
  image,
  breadcrumbs = [],
  author,
  tags = [],
  section = 'Исследования о русской поэзии',
  poet,
  datePublished,
  dateModified,
}: ArticleSchemaInput): JsonLdNode {
  const url = absoluteUrl(path)!;
  const articleId = `${url}#article`;
  const imageUrl = absoluteUrl(image);
  const authorNode = /legendary poet|редакц/i.test(author)
    ? { '@type': 'Organization', '@id': ORGANIZATION_ID, name: author, url: `${siteConfig.url}/about` }
    : { '@type': 'Person', name: author, url: `${siteConfig.url}/about` };
  const about = poet
    ? { '@type': 'Person', '@id': `${siteConfig.url}/poets/${poet.id}#person`, name: poet.name }
    : undefined;

  return schemaGraph([
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': WEBSITE_ID },
      breadcrumb: breadcrumbs.length > 1 ? { '@id': `${url}#breadcrumb` } : undefined,
      primaryImageOfPage: imageUrl ? { '@type': 'ImageObject', url: imageUrl } : undefined,
      mainEntity: { '@id': articleId },
      datePublished,
      dateModified: dateModified || datePublished,
    },
    {
      '@type': 'Article',
      '@id': articleId,
      headline: title,
      description,
      image: imageUrl ? [imageUrl] : undefined,
      url,
      inLanguage: 'ru-RU',
      datePublished,
      dateModified: dateModified || datePublished,
      articleSection: section,
      keywords: tags.length ? tags.join(', ') : undefined,
      about,
      author: authorNode,
      publisher: { '@id': ORGANIZATION_ID },
      isPartOf: { '@id': WEBSITE_ID },
      mainEntityOfPage: { '@id': `${url}#webpage` },
    },
    breadcrumbSchema(breadcrumbs),
  ]);
}

interface PoetPageSchemaInput extends WebPageSchemaInput {
  poet: {
    id: string;
    name: string;
    fullName: string;
    shortBio: string;
    photo: string;
    birthYear: number;
    deathYear?: number;
    nationality: string;
    tags: string[];
  };
}

export function buildPoetPageSchema({ title, description, path, breadcrumbs = [], poet }: PoetPageSchemaInput): JsonLdNode {
  const url = absoluteUrl(path)!;
  const personId = `${url}#person`;
  return schemaGraph([
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': WEBSITE_ID },
      breadcrumb: breadcrumbs.length > 1 ? { '@id': `${url}#breadcrumb` } : undefined,
      primaryImageOfPage: { '@type': 'ImageObject', url: absoluteUrl(poet.photo) },
      mainEntity: { '@id': personId },
    },
    {
      '@type': 'Person',
      '@id': personId,
      name: poet.fullName || poet.name,
      alternateName: poet.fullName !== poet.name ? poet.name : undefined,
      description: poet.shortBio,
      image: absoluteUrl(poet.photo),
      birthDate: String(poet.birthYear),
      deathDate: poet.deathYear ? String(poet.deathYear) : undefined,
      nationality: poet.nationality,
      jobTitle: 'Поэт',
      knowsAbout: poet.tags,
      mainEntityOfPage: { '@id': `${url}#webpage` },
    },
    breadcrumbSchema(breadcrumbs),
  ]);
}

interface MusicPageSchemaInput extends WebPageSchemaInput {
  track: {
    id: string;
    title: string;
    poet: string;
    poetId?: string;
    availability: 'published' | 'coming-soon' | 'archived';
    publishedAt?: string;
    scheduledFor?: string;
    durationSeconds?: number;
    audioUrl?: string;
    coverUrl?: string;
    wideCoverUrl?: string;
  };
}

export function buildMusicPageSchema({ title, description, path, breadcrumbs = [], track }: MusicPageSchemaInput): JsonLdNode {
  const url = absoluteUrl(path)!;
  const workId = `${url}#recording`;
  const image = absoluteUrl(track.wideCoverUrl || track.coverUrl);
  const poetNode = {
    '@type': 'Person',
    '@id': track.poetId ? `${siteConfig.url}/poets/${track.poetId}#person` : undefined,
    name: track.poet,
  };

  const work: JsonLdNode = track.availability === 'published'
    ? {
        '@type': 'MusicRecording',
        '@id': workId,
        name: track.title,
        description,
        url,
        image,
        inLanguage: 'ru-RU',
        datePublished: track.publishedAt,
        duration: secondsToIsoDuration(track.durationSeconds),
        byArtist: { '@type': 'MusicGroup', '@id': ORGANIZATION_ID, name: siteConfig.name },
        recordingOf: {
          '@type': 'MusicComposition',
          name: track.title,
          lyricist: poetNode,
        },
        audio: track.audioUrl
          ? {
              '@type': 'AudioObject',
              contentUrl: absoluteUrl(track.audioUrl),
              encodingFormat: 'audio/mpeg',
              duration: secondsToIsoDuration(track.durationSeconds),
            }
          : undefined,
        isAccessibleForFree: true,
        copyrightHolder: { '@id': ORGANIZATION_ID },
        mainEntityOfPage: { '@id': `${url}#webpage` },
      }
    : {
        '@type': 'CreativeWork',
        '@id': workId,
        name: track.title,
        description,
        url,
        image,
        inLanguage: 'ru-RU',
        dateCreated: track.scheduledFor,
        creator: { '@id': ORGANIZATION_ID },
        author: poetNode,
        mainEntityOfPage: { '@id': `${url}#webpage` },
      };

  return schemaGraph([
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': WEBSITE_ID },
      breadcrumb: breadcrumbs.length > 1 ? { '@id': `${url}#breadcrumb` } : undefined,
      primaryImageOfPage: image ? { '@type': 'ImageObject', url: image } : undefined,
      mainEntity: { '@id': workId },
      datePublished: track.publishedAt,
    },
    work,
    breadcrumbSchema(breadcrumbs),
  ]);
}

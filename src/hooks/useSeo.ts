import { useEffect } from 'react';
import { siteConfig } from '../config/site';
import {
  buildArticlePageSchema,
  buildWebPageSchema,
  type JsonLdNode,
  type SeoBreadcrumb,
} from '../lib/seoSchema';
import {
  applyDiscoveryHead,
  discoveryStateForPath,
  getDiscoveryPolicy,
  type DiscoveryStateName,
} from '../routes/discoveryHead';

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  state?: DiscoveryStateName;
  type?: 'website' | 'article' | 'profile' | 'music.song';
  image?: string;
  imageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string;
  breadcrumbs?: SeoBreadcrumb[];
  robots?: string;
  jsonLd?: JsonLdNode;
}

function absUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteConfig.url}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export function useSeo({
  title,
  description,
  path,
  state: requestedState,
  type = 'website',
  image,
  imageAlt,
  publishedTime,
  modifiedTime,
  author,
  keywords,
  breadcrumbs = [],
  robots,
  jsonLd,
}: SeoOptions) {
  const state = requestedState ?? discoveryStateForPath(path);
  const policy = getDiscoveryPolicy(state);
  const robotsValue = robots ?? (path === '/archive' ? 'noindex,nofollow' : policy.robots);

  useEffect(() => {
    const img = absUrl(image || '/og-image.jpg');
    const schema = policy.schema
      ? (jsonLd || (type === 'article'
        ? buildArticlePageSchema({
            title,
            description,
            path,
            image: img,
            author: author || siteConfig.name,
            datePublished: publishedTime,
            dateModified: modifiedTime || publishedTime,
            tags: keywords ? keywords.split(',').map((item) => item.trim()).filter(Boolean) : [],
            breadcrumbs,
          })
        : buildWebPageSchema({ title, description, path, image: img, breadcrumbs })))
      : null;

    applyDiscoveryHead({
      state,
      path,
      title,
      description,
      type,
      image: img,
      imageAlt,
      robots: robotsValue,
      publishedTime,
      modifiedTime,
      author,
      jsonLdText: schema ? JSON.stringify(schema) : null,
    });
  }, [
    title,
    description,
    path,
    state,
    policy.schema,
    type,
    image,
    imageAlt,
    publishedTime,
    modifiedTime,
    author,
    keywords,
    breadcrumbs,
    robotsValue,
    jsonLd,
  ]);
}

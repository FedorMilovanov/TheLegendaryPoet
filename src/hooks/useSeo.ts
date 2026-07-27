import { useEffect } from 'react';
import { siteConfig } from '../config/site';
import {
  buildArticlePageSchema,
  buildWebPageSchema,
  type JsonLdNode,
  type SeoBreadcrumb,
} from '../lib/seoSchema';

const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

interface SeoOptions {
  title: string;
  description: string;
  path: string;
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

function imageMime(url: string) {
  const pathname = url.split(/[?#]/, 1)[0].toLowerCase();
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

function ensureMeta(key: string, value: string, kind: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${kind}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(kind, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function removeMeta(key: string, kind: 'name' | 'property' = 'name') {
  document.head.querySelector(`meta[${kind}="${key}"]`)?.remove();
}

function ensureLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function useSeo({
  title,
  description,
  path,
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
  const robotsValue = robots ?? (
    path === '/archive'
      ? 'noindex,nofollow'
      : path === '/hall'
        ? 'noindex,follow'
        : DEFAULT_ROBOTS
  );

  useEffect(() => {
    const url = `${siteConfig.url}${path}`;
    const img = absUrl(image || '/og-image.jpg');
    const resolvedImageAlt = imageAlt || title;

    document.title = title;
    ensureMeta('description', description);
    ensureMeta('robots', robotsValue);
    ensureMeta('googlebot', robotsValue);
    ensureLink('canonical', url);

    // Search engines ignore meta keywords. Remove stale tags instead of emitting noise.
    removeMeta('keywords');

    ensureMeta('og:title', title, 'property');
    ensureMeta('og:description', description, 'property');
    ensureMeta('og:url', url, 'property');
    ensureMeta('og:type', type, 'property');
    ensureMeta('og:image', img, 'property');
    ensureMeta('og:image:secure_url', img, 'property');
    ensureMeta('og:image:type', imageMime(img), 'property');
    ensureMeta('og:image:alt', resolvedImageAlt, 'property');
    ensureMeta('twitter:card', 'summary_large_image');
    ensureMeta('twitter:title', title);
    ensureMeta('twitter:description', description);
    ensureMeta('twitter:image', img);
    ensureMeta('twitter:image:alt', resolvedImageAlt);

    if (type === 'article' && publishedTime) ensureMeta('article:published_time', publishedTime, 'property');
    else removeMeta('article:published_time', 'property');
    if (type === 'article' && modifiedTime) ensureMeta('article:modified_time', modifiedTime, 'property');
    else removeMeta('article:modified_time', 'property');
    if (type === 'article' && author) ensureMeta('article:author', author, 'property');
    else removeMeta('article:author', 'property');

    const schema = jsonLd || (type === 'article'
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
      : buildWebPageSchema({ title, description, path, image: img, breadcrumbs }));

    let ld = document.getElementById('route-jsonld') as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement('script');
      ld.id = 'route-jsonld';
      ld.type = 'application/ld+json';
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(schema);
  }, [
    title,
    description,
    path,
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

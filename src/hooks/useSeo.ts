import { useEffect } from 'react';
import { siteConfig } from '../config/site';

interface SeoOptions {
  title: string;
  description: string;
  /** Route path beginning with "/" (e.g. "/poets/alexander-pushkin"). */
  path: string;
  /** OG type. Use 'article' for essays/articles, 'profile' for poets. */
  type?: 'website' | 'article' | 'profile';
  /** Site-root-relative image path (e.g. "/images/essays/x.jpg"). Absolutised for OG. */
  image?: string;
  /** ISO date for articles (sets article:published_time + JSON-LD datePublished). */
  publishedTime?: string;
  /** Author name for articles. */
  author?: string;
  /** Comma-joined keywords. */
  keywords?: string;
  /** Optional pre-built JSON-LD object; overrides the default WebPage/Article schema. */
  jsonLd?: Record<string, unknown>;
}

function absUrl(pathOrUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${siteConfig.url}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/** Set an attribute on an existing head tag, creating a <meta> if it is missing. */
function ensureMeta(key: string, value: string, kind: 'name' | 'property' = 'name') {
  let el = document.head.querySelector(`meta[${kind}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(kind, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function ensureLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Per-route metadata for a client-rendered SPA. Updates head tags in place —
 * title, description, canonical, Open Graph, Twitter, article meta, and a
 * per-route JSON-LD block (WebPage / Article) so Google & Yandex can build
 * rich results. Both crawlers render JS, so client-side injection is indexed.
 */
export function useSeo({ title, description, path, type = 'website', image, publishedTime, author, keywords, jsonLd }: SeoOptions) {
  useEffect(() => {
    // siteConfig.url has no trailing slash; path is "/..." or "/". Avoid a bare
    // origin without "/" for the homepage canonical (search engines prefer it).
    const url = path === '/' ? `${siteConfig.url}/` : `${siteConfig.url}${path}`;
    const img = absUrl(image || '/og-image.jpg');

    document.title = title;
    ensureMeta('description', description);
    ensureLink('canonical', url);
    if (keywords) ensureMeta('keywords', keywords);

    // Open Graph
    ensureMeta('og:title', title, 'property');
    ensureMeta('og:description', description, 'property');
    ensureMeta('og:url', url, 'property');
    ensureMeta('og:type', type, 'property');
    ensureMeta('og:image', img, 'property');

    // Twitter
    ensureMeta('twitter:title', title);
    ensureMeta('twitter:description', description);
    ensureMeta('twitter:image', img);

    // Article-specific
    if (type === 'article' && publishedTime) ensureMeta('article:published_time', publishedTime, 'property');
    if (type === 'article' && author) ensureMeta('article:author', author, 'property');

    // Per-route JSON-LD (structured data)
    const schema =
      jsonLd ||
      (type === 'article'
        ? {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description,
            image: img,
            url,
            inLanguage: 'ru-RU',
            datePublished: publishedTime,
            author: { '@type': 'Organization', name: author || siteConfig.name },
            publisher: {
              '@type': 'Organization',
              name: siteConfig.name,
              logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon-512.png` },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          }
        : {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            description,
            url,
            inLanguage: 'ru-RU',
            isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: `${siteConfig.url}/` },
          });

    let ld = document.getElementById('route-jsonld');
    if (!ld) {
      ld = document.createElement('script');
      ld.id = 'route-jsonld';
      (ld as HTMLScriptElement).type = 'application/ld+json';
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(schema);
  }, [title, description, path, type, image, publishedTime, author, keywords, jsonLd]);
}

import { useEffect } from 'react';
import { siteConfig } from '../config/site';

const BRAND_VERSION = 'cloak-20260726-8';
const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article' | 'profile';
  image?: string;
  publishedTime?: string;
  author?: string;
  keywords?: string;
  robots?: string;
  jsonLd?: Record<string, unknown>;
}

function absUrl(pathOrUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
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
  let el = document.head.querySelector(`meta[${kind}="${key}"]`);
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
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSeo({
  title,
  description,
  path,
  type = 'website',
  image,
  publishedTime,
  author,
  keywords,
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
    const img = absUrl(image || `/og-image.jpg?v=${BRAND_VERSION}`);
    document.title = title;
    ensureMeta('description', description);
    ensureMeta('robots', robotsValue);
    ensureMeta('googlebot', robotsValue);
    ensureLink('canonical', url);
    if (keywords) ensureMeta('keywords', keywords);
    else removeMeta('keywords');
    ensureMeta('og:title', title, 'property');
    ensureMeta('og:description', description, 'property');
    ensureMeta('og:url', url, 'property');
    ensureMeta('og:type', type, 'property');
    ensureMeta('og:image', img, 'property');
    ensureMeta('og:image:secure_url', img, 'property');
    ensureMeta('og:image:type', imageMime(img), 'property');
    ensureMeta('twitter:title', title);
    ensureMeta('twitter:description', description);
    ensureMeta('twitter:image', img);
    if (type === 'article' && publishedTime) ensureMeta('article:published_time', publishedTime, 'property');
    else removeMeta('article:published_time', 'property');
    if (type === 'article' && author) ensureMeta('article:author', author, 'property');
    else removeMeta('article:author', 'property');

    const schema = jsonLd || (type === 'article' ? {
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
        logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon-512.png?v=${BRAND_VERSION}` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    } : {
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
  }, [title, description, path, type, image, publishedTime, author, keywords, robotsValue, jsonLd]);
}

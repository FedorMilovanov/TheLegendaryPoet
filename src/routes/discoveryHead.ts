import { createContext } from 'react';
import routeContractData from './route-contract.json';
import discoveryPolicyData from './discovery-policy.json';
import { siteConfig } from '../config/site';
import { canonicalRoutePath, canonicalRouteUrl } from './publicUrl';

export type DiscoveryStateName = 'ready' | 'noindex' | 'not-found' | 'loading' | 'error' | 'redirect';

type CanonicalMode = 'self' | 'target' | 'none';
type OgUrlMode = 'self' | 'none';

type DiscoveryPolicy = {
  robots: string;
  canonical: CanonicalMode;
  ogUrl: OgUrlMode;
  schema: boolean;
  sitemap: boolean;
  indexNow: boolean;
  title?: string;
  description?: string;
};

type RouteDiscoveryRecord = {
  path: string;
  discoveryState: Extract<DiscoveryStateName, 'ready' | 'noindex' | 'not-found'>;
};

type ApplyDiscoveryHeadOptions = {
  state: DiscoveryStateName;
  path: string;
  canonicalPath?: string;
  title?: string;
  description?: string;
  type?: 'website' | 'article' | 'profile' | 'music.song';
  image?: string;
  imageAlt?: string;
  robots?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  jsonLdText?: string | null;
};

const states = discoveryPolicyData.states as Record<DiscoveryStateName, DiscoveryPolicy>;
const routes = routeContractData.routes as RouteDiscoveryRecord[];

export function getDiscoveryPolicy(state: DiscoveryStateName): DiscoveryPolicy {
  const policy = states[state];
  if (!policy) throw new Error(`Unknown discovery state: ${state}`);
  return policy;
}

function matchRoutePattern(pattern: string, pathname: string) {
  if (pattern === '*') return true;
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, index) => part.startsWith(':') || part === pathParts[index]);
}

export function discoveryStateForPath(pathname: string): Extract<DiscoveryStateName, 'ready' | 'noindex' | 'not-found'> {
  const explicit = routes.find((route) => route.path !== '*' && matchRoutePattern(route.path, pathname));
  if (explicit) return explicit.discoveryState;
  const wildcard = routes.find((route) => route.path === '*');
  return wildcard?.discoveryState ?? 'not-found';
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

function removeLink(rel: string) {
  document.head.querySelector(`link[rel="${rel}"]`)?.remove();
}

function applyDiscoveryHead(options: ApplyDiscoveryHeadOptions) {
  if (typeof document === 'undefined') return;

  const policy = getDiscoveryPolicy(options.state);
  const title = options.title || policy.title || siteConfig.name;
  const description = options.description || policy.description || siteConfig.description;
  const type = options.type || 'website';
  const image = absUrl(options.image || '/og-image.jpg');
  const imageAlt = options.imageAlt || title;
  const robots = options.robots || policy.robots;
  const selfUrl = canonicalRouteUrl(siteConfig.url, options.path);

  document.title = title;
  ensureMeta('description', description);
  ensureMeta('robots', robots);
  ensureMeta('googlebot', robots);
  removeMeta('keywords');

  if (policy.canonical === 'self') {
    ensureLink('canonical', selfUrl);
  } else if (policy.canonical === 'target') {
    if (!options.canonicalPath) throw new Error('redirect discovery state requires canonicalPath');
    ensureLink('canonical', canonicalRouteUrl(siteConfig.url, options.canonicalPath));
  } else {
    removeLink('canonical');
  }

  if (policy.ogUrl === 'self') ensureMeta('og:url', selfUrl, 'property');
  else removeMeta('og:url', 'property');

  ensureMeta('og:title', title, 'property');
  ensureMeta('og:description', description, 'property');
  ensureMeta('og:type', type, 'property');
  ensureMeta('og:image', image, 'property');
  ensureMeta('og:image:secure_url', image, 'property');
  ensureMeta('og:image:type', imageMime(image), 'property');
  ensureMeta('og:image:alt', imageAlt, 'property');
  ensureMeta('twitter:card', 'summary_large_image');
  ensureMeta('twitter:title', title);
  ensureMeta('twitter:description', description);
  ensureMeta('twitter:image', image);
  ensureMeta('twitter:image:alt', imageAlt);

  if (policy.schema && options.jsonLdText) {
    let ld = document.getElementById('route-jsonld') as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement('script');
      ld.id = 'route-jsonld';
      ld.type = 'application/ld+json';
      document.head.appendChild(ld);
    }
    ld.textContent = options.jsonLdText;
  } else {
    document.getElementById('route-jsonld')?.remove();
  }

  if (policy.schema && type === 'article' && options.publishedTime) ensureMeta('article:published_time', options.publishedTime, 'property');
  else removeMeta('article:published_time', 'property');
  if (policy.schema && type === 'article' && options.modifiedTime) ensureMeta('article:modified_time', options.modifiedTime, 'property');
  else removeMeta('article:modified_time', 'property');
  if (policy.schema && type === 'article' && options.author) ensureMeta('article:author', options.author, 'property');
  else removeMeta('article:author', 'property');
}

// The selected outlet owns the original browser pathname, including basename
// and percent escapes. Rebuilding it from decoded route params can turn a
// perfectly readable /priv%61cy/ into a perpetual loading state.
export const RouteHeadAddress = createContext<string | null>(null);
export const PAGE_HEAD_AVAILABLE = 'tlp-page-head-available';

// Keep only the mounted page's head, not a history of page snapshots. Back
// can resume that exact tree; its useSeo effect need not run a second time.
interface HeadOwner {
  pathname: string;
  options: ApplyDiscoveryHeadOptions;
  visitKey?: string;
}
let painted: HeadOwner | undefined;
let shown: HeadOwner | 'loading' | undefined;

export function hasSettledPageHead(href: string) {
  return window.location.pathname === href && !!painted && shown === painted &&
    painted.pathname === canonicalRoutePath(href) && painted.options.state !== 'error';
}

export function syncDiscoveryAddress() {
  const path = window.location.pathname;
  if (painted && canonicalRoutePath(path) === painted.pathname &&
      (!painted.visitKey || painted.visitKey === (window.history.state?.key ?? 'default'))) {
    if (shown === painted) return;
    const pending = shown === 'loading';
    applyDiscoveryHead(painted.options);
    shown = painted;
    if (pending && painted.options.state !== 'error') window.dispatchEvent(new Event(PAGE_HEAD_AVAILABLE));
    return;
  }
  if (shown === 'loading') return;
  // Only the untouched matching prerender can speak before the first paint.
  if (!shown && document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href === canonicalRouteUrl(siteConfig.url, path) &&
      document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content.startsWith('index,')) return;
  applyDiscoveryHead({ state: 'loading', path });
  shown = 'loading';
}

export function ownDiscoveryHead(href: string, options: ApplyDiscoveryHeadOptions, visitKey?: string) {
  const owner = { pathname: canonicalRoutePath(new URL(href, window.location.href).pathname), options, visitKey };
  painted = owner;
  syncDiscoveryAddress();
  return () => { if (painted === owner) painted = undefined; };
}

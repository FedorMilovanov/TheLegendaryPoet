import { useEffect } from 'react';
import { siteConfig } from '../config/site';

interface SeoOptions {
  title: string;
  description: string;
  /** Route path beginning with "/" (e.g. "/poets/alexander-pushkin"). */
  path: string;
}

function setAttr(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Per-route metadata for a client-rendered SPA. Updates the existing head
 * tags in place (no duplicates), so each route gets its own title, description,
 * canonical URL and social-preview text.
 */
export function useSeo({ title, description, path }: SeoOptions) {
  useEffect(() => {
    const url = `${siteConfig.url}${path}`;
    document.title = title;
    setAttr('meta[name="description"]', 'content', description);
    setAttr('link[rel="canonical"]', 'href', url);
    setAttr('meta[property="og:title"]', 'content', title);
    setAttr('meta[property="og:description"]', 'content', description);
    setAttr('meta[property="og:url"]', 'content', url);
    setAttr('meta[name="twitter:title"]', 'content', title);
    setAttr('meta[name="twitter:description"]', 'content', description);
  }, [title, description, path]);
}

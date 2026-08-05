/**
 * Optional analytics with explicit prior consent.
 *
 * Repository variables consumed by the production build:
 *   VITE_YANDEX_METRIKA_ID
 *   VITE_GA_ID
 *
 * When neither variable is configured, this module is a complete no-op and the
 * consent interface remains hidden.
 */

import { safeRead, safeWrite } from './browserStorage';

export type AnalyticsConsent = 'granted' | 'denied';

const CONSENT_STORAGE_KEY = 'tlp:analytics-consent:v1';
export const ANALYTICS_CONSENT_EVENT = 'tlp:analytics-consent-change';

let started = false;

function metrikaId() {
  return (import.meta.env.VITE_YANDEX_METRIKA_ID as string | undefined)?.trim();
}

function gaId() {
  return (import.meta.env.VITE_GA_ID as string | undefined)?.trim();
}

export function hasConfiguredAnalytics() {
  return Boolean(metrikaId() || gaId());
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
  const value = safeRead(CONSENT_STORAGE_KEY);
  return value === 'granted' || value === 'denied' ? value : null;
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
  if (typeof window === 'undefined') return;
  // Consent still applies to the current page even when storage is blocked.
  safeWrite(CONSENT_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent<AnalyticsConsent>(ANALYTICS_CONSENT_EVENT, { detail: value }));
}

export function initAnalytics() {
  if (started || typeof window === 'undefined' || getAnalyticsConsent() !== 'granted') return;

  const yandexId = metrikaId();
  const googleId = gaId();
  if (!yandexId && !googleId) return;
  started = true;

  if (yandexId) {
    (function (m: any, e: Document, t: string, r: string, i: string) {
      m[i] = m[i] || function (...args: unknown[]) { (m[i].a = m[i].a || []).push(args); };
      m[i].l = 1 * (new Date() as unknown as number);
      const script = e.createElement(t) as HTMLScriptElement;
      const firstScript = e.getElementsByTagName(t)[0];
      script.async = true;
      script.src = r;
      firstScript?.parentNode?.insertBefore(script, firstScript);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

    (window as any).ym(Number(yandexId), 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      defer: true,
    });
  }

  if (googleId) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleId)}`;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: unknown[]) { (window as any).dataLayer.push(args); }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', googleId, { send_page_view: false });
  }
}

export function trackPageView(path: string, title: string) {
  if (typeof window === 'undefined' || getAnalyticsConsent() !== 'granted') return;
  initAnalytics();
  if (!started) return;

  const url = new URL(path, window.location.origin).href;
  const yandexId = metrikaId();
  const googleId = gaId();

  if (yandexId && typeof (window as any).ym === 'function') {
    (window as any).ym(Number(yandexId), 'hit', url, { title, referer: document.referrer || undefined });
  }
  if (googleId && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'page_view', {
      page_title: title,
      page_location: url,
      page_path: path,
    });
  }
}

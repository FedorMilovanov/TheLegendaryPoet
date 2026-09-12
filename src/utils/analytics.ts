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
export type AnalyticsConsentState = AnalyticsConsent | null;

export type AnalyticsRouteSettledDetail = {
  path: string;
  title: string;
  navigationToken: string;
};

export const ANALYTICS_CONSENT_STORAGE_KEY = 'tlp:analytics-consent:v1';
export const ANALYTICS_CONSENT_EVENT = 'tlp:analytics-consent-change';
export const ANALYTICS_ROUTE_SETTLED_EVENT = 'tlp:analytics-route-settled';

let sessionConsent: AnalyticsConsentState = null;
let googleInitialized = false;
let yandexInitialized = false;

function envValue(key: 'VITE_YANDEX_METRIKA_ID' | 'VITE_GA_ID') {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.[key]?.trim();
}

function metrikaId() {
  return envValue('VITE_YANDEX_METRIKA_ID');
}

function gaId() {
  return envValue('VITE_GA_ID');
}

function parseConsent(value: string | null): AnalyticsConsentState {
  return value === 'granted' || value === 'denied' ? value : null;
}

function googleDisableKey(id: string) {
  return `ga-disable-${id}`;
}

function yandexDisableKey(id: string) {
  return `disableYaCounter${id}`;
}

function setProviderCollectionEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;

  const googleId = gaId();
  if (googleId) {
    (window as any)[googleDisableKey(googleId)] = !enabled;
  }

  const yandexId = metrikaId();
  if (yandexId) {
    (window as any)[yandexDisableKey(yandexId)] = !enabled;
  }
}

function ensureYandexLoader() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const target = window as any;

  if (typeof target.ym !== 'function') {
    target.ym = function (...args: unknown[]) {
      (target.ym.a = target.ym.a || []).push(args);
    };
    target.ym.l = 1 * (new Date() as unknown as number);
  }

  if (!document.querySelector('script[data-tlp-analytics-provider="yandex"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    script.dataset.tlpAnalyticsProvider = 'yandex';
    document.head.appendChild(script);
  }
}

function ensureYandexProvider() {
  const id = metrikaId();
  if (!id || typeof window === 'undefined' || yandexInitialized) return;

  (window as any)[yandexDisableKey(id)] = false;
  ensureYandexLoader();
  if (typeof (window as any).ym !== 'function') return;

  (window as any).ym(Number(id), 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    defer: true,
  });
  yandexInitialized = true;
}

function disableYandexProvider() {
  const id = metrikaId();
  if (!id || typeof window === 'undefined') return;

  (window as any)[yandexDisableKey(id)] = true;
  if (yandexInitialized && typeof (window as any).ym === 'function') {
    // Yandex documents destruct() as the SPA mechanism that stops a counter.
    (window as any).ym(Number(id), 'destruct');
  }
  yandexInitialized = false;
}

function ensureGoogleProvider() {
  const id = gaId();
  if (!id || typeof window === 'undefined' || typeof document === 'undefined') return;

  (window as any)[googleDisableKey(id)] = false;
  (window as any).dataLayer = (window as any).dataLayer || [];

  if (typeof (window as any).gtag !== 'function') {
    (window as any).gtag = (...args: unknown[]) => {
      (window as any).dataLayer.push(args);
    };
  }

  if (!document.querySelector('script[data-tlp-analytics-provider="google"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    script.dataset.tlpAnalyticsProvider = 'google';
    document.head.appendChild(script);
  }

  if (!googleInitialized) {
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', id, { send_page_view: false });
    googleInitialized = true;
  }
}

function disableGoogleProvider() {
  const id = gaId();
  if (!id || typeof window === 'undefined') return;
  // Google documents ga-disable-MEASUREMENT_ID as the collection kill switch.
  (window as any)[googleDisableKey(id)] = true;
}

function applyProviderConsent(value: AnalyticsConsentState) {
  if (value === 'granted') {
    setProviderCollectionEnabled(true);
    return;
  }

  disableGoogleProvider();
  disableYandexProvider();
}

function publishConsent(value: AnalyticsConsentState) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AnalyticsConsentState>(ANALYTICS_CONSENT_EVENT, { detail: value }));
}

function applyConsent(value: AnalyticsConsentState, { persist, publish }: { persist: boolean; publish: boolean }) {
  const previous = sessionConsent;
  sessionConsent = value;

  if (persist && value !== null) {
    safeWrite(ANALYTICS_CONSENT_STORAGE_KEY, value);
  }

  applyProviderConsent(value);
  if (publish && previous !== value) publishConsent(value);
}

export function hasConfiguredAnalytics() {
  return Boolean(metrikaId() || gaId());
}

export function getAnalyticsConsent(): AnalyticsConsentState {
  if (sessionConsent !== null) return sessionConsent;
  const persisted = parseConsent(safeRead(ANALYTICS_CONSENT_STORAGE_KEY));
  if (persisted !== null) sessionConsent = persisted;
  return persisted;
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
  if (typeof window === 'undefined') return;
  applyConsent(value, { persist: true, publish: true });
}

export function observeAnalyticsConsentStorage() {
  if (typeof window === 'undefined') return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== ANALYTICS_CONSENT_STORAGE_KEY) return;
    applyConsent(parseConsent(event.newValue), { persist: false, publish: true });
  };

  // Apply a fail-closed provider state immediately for an existing denied or
  // unset choice. A persisted grant still waits for a settled route to call
  // initAnalytics(), so observing consent does not itself emit a page view.
  applyProviderConsent(getAnalyticsConsent());
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

export function notifyAnalyticsRouteSettled(detail: AnalyticsRouteSettledDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AnalyticsRouteSettledDetail>(ANALYTICS_ROUTE_SETTLED_EVENT, { detail }));
}

export function initAnalytics() {
  if (typeof window === 'undefined' || getAnalyticsConsent() !== 'granted') return;
  if (!hasConfiguredAnalytics()) return;

  setProviderCollectionEnabled(true);
  ensureYandexProvider();
  ensureGoogleProvider();
}

export function trackPageView(path: string, title: string) {
  if (typeof window === 'undefined' || getAnalyticsConsent() !== 'granted') return;
  initAnalytics();

  const url = new URL(path, window.location.origin).href;
  const yandexId = metrikaId();
  const googleId = gaId();

  if (yandexId && yandexInitialized && typeof (window as any).ym === 'function') {
    (window as any).ym(Number(yandexId), 'hit', url, { title, referer: document.referrer || undefined });
  }
  if (googleId && googleInitialized && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'page_view', {
      page_title: title,
      page_location: url,
      page_path: path,
    });
  }
}

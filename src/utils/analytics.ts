/**
 * Optional analytics: Yandex.Metrika and Google Analytics (gtag).
 *
 * Both are OFF unless the corresponding build-time variable is set as a GitHub
 * repo *Variable* (Vite inlines VITE_* at build), exactly like the Supabase
 * keys:
 *   VITE_YANDEX_METRIKA_ID   e.g. "99999999"
 *   VITE_GA_ID               e.g. "G-XXXXXXX"
 * With neither set this is a complete no-op — no network, no globals.
 */

interface AnalyticsWindow extends Window {
  ym?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

let started = false;

function env(key: string): string | undefined {
  const bag =
    (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string | undefined>)) ||
    {};
  const value = bag[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function initAnalytics() {
  if (started || typeof window === 'undefined') return;
  started = true;

  const metrikaId = env('VITE_YANDEX_METRIKA_ID');
  const gaId = env('VITE_GA_ID');
  const w = window as AnalyticsWindow;

  if (metrikaId) {
    // Yandex.Metrika loader (official snippet, typed without `any`).
    const queueKey = 'ym' as const;
    type YmFn = ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };
    if (!w.ym) {
      const fn: YmFn = (...args: unknown[]) => {
        (fn.a = fn.a || []).push(args);
      };
      fn.l = Date.now();
      w.ym = fn;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://mc.yandex.ru/metrika/tag.js';
      const first = document.getElementsByTagName('script')[0];
      first?.parentNode?.insertBefore(script, first);
    }
    w.ym?.(Number(metrikaId), 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });
    void queueKey;
  }

  if (gaId) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s);
    w.dataLayer = w.dataLayer || [];
    function gtag(...args: unknown[]) {
      w.dataLayer?.push(args);
    }
    w.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId);
  }
}

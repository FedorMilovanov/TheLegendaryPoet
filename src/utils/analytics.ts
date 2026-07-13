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
let started = false;

export function initAnalytics() {
  if (started || typeof window === 'undefined') return;
  started = true;

  const metrikaId = import.meta.env.VITE_YANDEX_METRIKA_ID as string | undefined;
  const gaId = import.meta.env.VITE_GA_ID as string | undefined;

  if (metrikaId) {
    // Yandex.Metrika counter
    (function (m: any, e: Document, t: string, r: string, i: string) {
      m[i] = m[i] || function (...args: unknown[]) { (m[i].a = m[i].a || []).push(args); };
      m[i].l = 1 * (new Date() as unknown as number);
      const k = e.createElement(t) as HTMLScriptElement;
      const a = e.getElementsByTagName(t)[0];
      k.async = true;
      k.src = r;
      a.parentNode?.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    (window as any).ym(Number(metrikaId), 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });
  }

  if (gaId) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s);
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: unknown[]) { (window as any).dataLayer.push(args); }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId);
  }
}

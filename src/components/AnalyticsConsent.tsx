import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Link } from './ui/Link';
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  hasConfiguredAnalytics,
  initAnalytics,
  setAnalyticsConsent,
  trackPageView,
  type AnalyticsConsent,
} from '../utils/analytics';

export function AnalyticsRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}`;
    const send = () => {
      if (getAnalyticsConsent() !== 'granted') return;
      initAnalytics();
      window.setTimeout(() => trackPageView(pagePath, document.title), 0);
    };

    send();
    const handleConsent = (event: Event) => {
      if ((event as CustomEvent<AnalyticsConsent>).detail === 'granted') send();
    };
    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
  }, [location.pathname, location.search]);

  return null;
}

export default function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(() => getAnalyticsConsent());

  useEffect(() => {
    const handleConsent = (event: Event) => setConsent((event as CustomEvent<AnalyticsConsent>).detail);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
  }, []);

  if (!hasConfiguredAnalytics() || consent !== null) return null;

  const choose = (value: AnalyticsConsent) => {
    setAnalyticsConsent(value);
    setConsent(value);
  };

  return (
    <aside
      aria-label="Настройки аналитики"
      className="fixed inset-x-3 bottom-20 z-[140] mx-auto max-w-3xl rounded-3xl border border-cyan-300/18 bg-[#071018]/96 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.7)] backdrop-blur-2xl md:bottom-5 md:p-6"
    >
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="font-serif text-xl font-semibold text-white">Помочь улучшать проект?</h2>
          <p className="mt-2 text-sm leading-relaxed text-cyan-100/55">
            Необязательная аналитика Google и Яндекса загружается только после согласия. Отказ не ограничивает статьи, музыку и другие функции. Подробнее — в{' '}
            <Link to="/privacy" className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4 hover:text-cyan-200">
              политике конфиденциальности
            </Link>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="min-h-11 rounded-full border border-white/12 px-5 text-sm font-bold text-white/60 transition hover:border-white/25 hover:text-white"
          >
            Без аналитики
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="min-h-11 rounded-full bg-cyan-300 px-5 text-sm font-bold text-[#031017] transition hover:bg-cyan-200"
          >
            Разрешить
          </button>
        </div>
      </div>
    </aside>
  );
}

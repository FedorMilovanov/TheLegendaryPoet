import { useEffect, useState } from 'react';
import Breadcrumbs from '../components/seo/Breadcrumbs';
import { Link } from '../components/ui/Link';
import { siteConfig } from '../config/site';
import { useSeo } from '../hooks/useSeo';
import { buildWebPageSchema, type SeoBreadcrumb } from '../lib/seoSchema';
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  hasConfiguredAnalytics,
  setAnalyticsConsent,
  type AnalyticsConsent,
  type AnalyticsConsentState,
} from '../utils/analytics';

const breadcrumbs: SeoBreadcrumb[] = [
  { name: 'Главная', path: '/' },
  { name: 'Конфиденциальность', path: '/privacy' },
];

export default function PrivacyPage() {
  const [analyticsConsent, setAnalyticsConsentState] = useState<AnalyticsConsentState>(() => getAnalyticsConsent());
  const analyticsConfigured = hasConfiguredAnalytics();
  const title = 'Политика конфиденциальности — THE LEGENDARY POET';
  const description = 'Какие технические данные использует THE LEGENDARY POET, как работают общественные функции и аналитика и как управлять согласием.';

  useSeo({
    title,
    description,
    path: '/privacy',
    breadcrumbs,
    jsonLd: buildWebPageSchema({ title, description, path: '/privacy', breadcrumbs }),
  });

  useEffect(() => {
    const handleConsent = (event: Event) => {
      setAnalyticsConsentState((event as CustomEvent<AnalyticsConsentState>).detail);
    };
    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
  }, []);

  const chooseAnalytics = (value: AnalyticsConsent) => {
    setAnalyticsConsent(value);
    setAnalyticsConsentState(value);
  };

  const analyticsStatus = analyticsConsent === 'granted'
    ? 'Разрешена'
    : analyticsConsent === 'denied'
      ? 'Отключена'
      : 'Не выбрано';

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-28 text-white">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} className="mb-10" />
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/65">Данные посетителей</p>
        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-6xl">Политика конфиденциальности</h1>
        <p className="mt-6 text-lg leading-relaxed text-cyan-100/60">
          THE LEGENDARY POET использует только данные, необходимые для работы сайта, добровольных пользовательских функций, защиты от злоупотреблений и оценки качества публикаций.
        </p>

        <div className="mt-12 space-y-5">
          <section className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Технические журналы</h2>
            <p className="mt-3 leading-relaxed text-cyan-100/55">
              Хостинг и сетевые провайдеры могут временно обрабатывать IP-адрес, время запроса, адрес страницы, тип браузера и сведения об ошибках для доставки сайта, защиты от злоупотреблений и диагностики.
            </p>
          </section>

          <section className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8" aria-labelledby="analytics-privacy-title">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="analytics-privacy-title" className="font-serif text-2xl font-semibold">Аналитика — только после согласия</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-cyan-100/55">
                  Google Analytics 4 и Яндекс.Метрика работают только после явного согласия посетителя и только если соответствующие счётчики включены владельцем проекта. Выбор можно изменить здесь в любой момент; изменение применяется в этой вкладке сразу и синхронизируется между открытыми вкладками сайта.
                </p>
              </div>
              <div className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/65" role="status" aria-live="polite" aria-atomic="true">
                Аналитика: <span className="text-cyan-200">{analyticsConfigured ? analyticsStatus : 'Не настроена'}</span>
              </div>
            </div>

            {analyticsConfigured ? (
              <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label="Управление аналитикой">
                <button
                  type="button"
                  onClick={() => chooseAnalytics('denied')}
                  aria-pressed={analyticsConsent === 'denied'}
                  className="min-h-11 rounded-full border border-white/14 px-5 text-sm font-bold text-white/65 transition hover:border-white/30 hover:text-white aria-pressed:border-cyan-300/35 aria-pressed:bg-cyan-300/[0.08] aria-pressed:text-cyan-100"
                >
                  Отключить аналитику
                </button>
                <button
                  type="button"
                  onClick={() => chooseAnalytics('granted')}
                  aria-pressed={analyticsConsent === 'granted'}
                  className="min-h-11 rounded-full bg-cyan-300 px-5 text-sm font-bold text-[#031017] transition hover:bg-cyan-200 aria-pressed:ring-2 aria-pressed:ring-cyan-100/70"
                >
                  Разрешить аналитику
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-cyan-100/45">
                В этой сборке внешние аналитические счётчики не настроены, поэтому данные аналитики не отправляются.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Локальное хранение</h2>
            <p className="mt-3 leading-relaxed text-cyan-100/55">
              Браузер может хранить настройки интерфейса, состояние аудиоплеера, личный архив, выбор согласия, локальную очередь общественных действий и подписанную анонимную сессию участника. Эти данные помогают продолжить сеанс и не являются публичным профилем. Одноразовые Turnstile-токены в localStorage и очередь не записываются.
            </p>
          </section>

          <section className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Оценки, комментарии и защита от накрутки</h2>
            <p className="mt-3 leading-relaxed text-cyan-100/55">
              Пока общая база не подключена полностью, оценки и комментарии остаются в текущем браузере. В общем режиме введённые вами оценки, имя или псевдоним и текст комментария передаются через Cloudflare Worker в базу Cloudflare D1. Для выпуска анонимной серверной сессии используется Cloudflare Turnstile. Не публикуйте секретные сведения, адреса, документы и персональные данные третьих лиц.
            </p>
            <p className="mt-3 leading-relaxed text-cyan-100/55">
              Для ограничения злоупотреблений Worker получает сетевой адрес соединения от инфраструктуры Cloudflare и преобразует его отдельным серверным HMAC-секретом. В D1 сохраняется только 64-символьный HMAC-ключ для краткоживущих лимитов; исходный IP-адрес и Turnstile-токен в таблицы сообщества не записываются. Публичные ответы API не содержат actor ID или сетевой HMAC-ключ.
            </p>
          </section>

          <section className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Внешние сайты</h2>
            <p className="mt-3 leading-relaxed text-cyan-100/55">
              Ссылки на YouTube, Rutube, VK, библиотеки, архивы и другие источники ведут на самостоятельные сервисы с собственными правилами обработки данных.
            </p>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-luxury-gold/15 bg-luxury-gold/[0.035] p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">Контакт</h2>
          <p className="mt-3 leading-relaxed text-white/60">По вопросам конфиденциальности и удаления отправленных вами данных напишите:</p>
          <a href={`mailto:${siteConfig.contactEmail}`} className="mt-5 inline-flex min-h-11 items-center rounded-full border border-luxury-gold/25 px-5 text-sm font-bold text-luxury-gold transition hover:border-luxury-gold/50 hover:bg-luxury-gold/5">
            {siteConfig.contactEmail}
          </a>
        </section>

        <p className="mt-10 text-sm text-cyan-100/35">
          Обновлено: 12 сентября 2026 года. Редакционные принципы описаны в <Link to="/editorial-policy" className="text-cyan-300/75 hover:text-cyan-200">редакционной политике</Link>.
        </p>
      </main>
    </div>
  );
}
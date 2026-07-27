import Breadcrumbs from '../components/seo/Breadcrumbs';
import { Link } from '../components/ui/Link';
import { siteConfig } from '../config/site';
import { useSeo } from '../hooks/useSeo';
import { buildWebPageSchema, type SeoBreadcrumb } from '../lib/seoSchema';

const breadcrumbs: SeoBreadcrumb[] = [
  { name: 'Главная', path: '/' },
  { name: 'Конфиденциальность', path: '/privacy' },
];

export default function PrivacyPage() {
  const title = 'Политика конфиденциальности — THE LEGENDARY POET';
  const description = 'Какие технические данные использует THE LEGENDARY POET, как работает аналитика и как управлять согласием.';

  useSeo({
    title,
    description,
    path: '/privacy',
    breadcrumbs,
    jsonLd: buildWebPageSchema({ title, description, path: '/privacy', breadcrumbs }),
  });

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-28 text-white">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} className="mb-10" />
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/65">Данные посетителей</p>
        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-6xl">Политика конфиденциальности</h1>
        <p className="mt-6 text-lg leading-relaxed text-cyan-100/60">
          THE LEGENDARY POET собирает только данные, необходимые для работы сайта, добровольных пользовательских функций и оценки качества публикаций.
        </p>

        <div className="mt-12 space-y-5">
          <section className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Технические журналы</h2>
            <p className="mt-3 leading-relaxed text-cyan-100/55">
              Хостинг и сетевые провайдеры могут временно обрабатывать IP-адрес, время запроса, адрес страницы, тип браузера и сведения об ошибках для доставки сайта, защиты от злоупотреблений и диагностики.
            </p>
          </section>

          <section className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Аналитика — только после согласия</h2>
            <p className="mt-3 leading-relaxed text-cyan-100/55">
              Google Analytics 4 и Яндекс.Метрика загружаются только после явного согласия посетителя и только если соответствующие счётчики включены владельцем проекта. До согласия сайт не отправляет события этим системам. Решение сохраняется в браузере и может быть сброшено удалением данных сайта.
            </p>
          </section>

          <section className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Локальное хранение</h2>
            <p className="mt-3 leading-relaxed text-cyan-100/55">
              Браузер может хранить настройки интерфейса, состояние аудиоплеера, личный архив, выбор согласия и служебные маркеры восстановления. Эти данные помогают продолжить сеанс и не являются публичным профилем.
            </p>
          </section>

          <section className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Оценки и комментарии</h2>
            <p className="mt-3 leading-relaxed text-cyan-100/55">
              При использовании общественных функций введённые данные могут передаваться подключённому хранилищу проекта. Не публикуйте секретные сведения, адреса, документы и персональные данные третьих лиц.
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
          Дата публикации: 28 июля 2026 года. Редакционные принципы описаны в <Link to="/editorial-policy" className="text-cyan-300/75 hover:text-cyan-200">редакционной политике</Link>.
        </p>
      </main>
    </div>
  );
}

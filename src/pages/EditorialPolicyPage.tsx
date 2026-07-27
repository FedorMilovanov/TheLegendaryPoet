import Breadcrumbs from '../components/seo/Breadcrumbs';
import { Link } from '../components/ui/Link';
import { siteConfig } from '../config/site';
import { useSeo } from '../hooks/useSeo';
import { buildWebPageSchema, type SeoBreadcrumb } from '../lib/seoSchema';

const breadcrumbs: SeoBreadcrumb[] = [
  { name: 'Главная', path: '/' },
  { name: 'Редакционная политика', path: '/editorial-policy' },
];

const sections = [
  {
    title: 'Авторство и ответственность',
    text: 'Каждый большой материал публикуется с именем автора или указанием редакции проекта. Редакционная подпись не снимает ответственности: проект отвечает за формулировки, подбор источников, иллюстрации и итоговую подачу.',
  },
  {
    title: 'Источники и проверка фактов',
    text: 'Приоритет получают первичные документы, академические издания, каталоги архивов, музейные и библиотечные публикации. Спорные даты, цитаты и свидетельства не выдаются за бесспорные: в тексте обозначаются степень уверенности, версия и происхождение сведений.',
  },
  {
    title: 'Цитаты и библиография',
    text: 'Прямые цитаты сопровождаются указанием автора и источника. В исследовательских материалах публикуется открытая библиотека использованных источников. Ссылки служат проверке утверждений, а не декоративному списку литературы.',
  },
  {
    title: 'Реконструкции и искусственный интеллект',
    text: 'Редакционные реконструкции, реставрации и изображения, созданные с применением генеративных инструментов, не представляются архивными фотографиями. Их происхождение обозначается в подписи или карточке материала. Такие изображения не используются как доказательство исторического события.',
  },
  {
    title: 'Факт, интерпретация и духовный комментарий',
    text: 'Исторический факт, литературная интерпретация и христианское размышление разделяются по функции и тону. Нравственная или богословская оценка обозначается как редакционная интерпретация и не подменяет документальную часть материала.',
  },
  {
    title: 'Исправления',
    text: 'Подтверждённая ошибка исправляется без скрытого сохранения неверного тезиса. Существенные изменения получают дату редакционного обновления. Замечания рассматриваются по существу независимо от позиции автора обращения.',
  },
];

export default function EditorialPolicyPage() {
  const title = 'Редакционная политика и исправления — THE LEGENDARY POET';
  const description = 'Как THE LEGENDARY POET проверяет факты, оформляет источники, обозначает реконструкции и исправляет ошибки.';

  useSeo({
    title,
    description,
    path: '/editorial-policy',
    breadcrumbs,
    jsonLd: buildWebPageSchema({ title, description, path: '/editorial-policy', breadcrumbs }),
  });

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-28 text-white">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} className="mb-10" />
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/65">Принципы проекта</p>
        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-6xl">Редакционная политика</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-cyan-100/60">
          Эти правила применяются к биографиям, исследованиям, страницам поэтов, музыкальным публикациям и редакционным изображениям.
        </p>

        <div className="mt-12 space-y-5">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-cyan-400/10 bg-white/[0.025] p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold text-white">{section.title}</h2>
              <p className="mt-3 leading-relaxed text-cyan-100/55">{section.text}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-luxury-gold/15 bg-luxury-gold/[0.035] p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">Сообщить об ошибке</h2>
          <p className="mt-3 leading-relaxed text-white/60">
            Укажите адрес страницы, спорный фрагмент и источник, который позволяет проверить замечание.
          </p>
          <a href={`mailto:${siteConfig.contactEmail}`} className="mt-5 inline-flex min-h-11 items-center rounded-full border border-luxury-gold/25 px-5 text-sm font-bold text-luxury-gold transition hover:border-luxury-gold/50 hover:bg-luxury-gold/5">
            {siteConfig.contactEmail}
          </a>
        </section>

        <p className="mt-10 text-sm text-cyan-100/35">
          Дата публикации политики: 28 июля 2026 года. См. также <Link to="/privacy" className="text-cyan-300/75 hover:text-cyan-200">политику конфиденциальности</Link>.
        </p>
      </main>
    </div>
  );
}

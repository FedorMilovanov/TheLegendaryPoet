import { useEffect } from 'react';
import { ArrowUpRight, BookOpen } from 'lucide-react';

interface ReadingEntry {
  title: string;
  year: string;
  context: string;
  sourceUrl: string;
  existingExcerptId?: string;
}

const readings: ReadingEntry[] = [
  {
    title: '«Реквием»',
    year: 'Основные части: 1935–1940',
    context:
      'Поэма о тюремных очередях, арестах и материнском горе. Прозаическое «Вместо предисловия» датировано 1957 годом; эпиграф появился позднее. Ниже на этой странице размещены только избранные части — «Посвящение» и «Распятие».',
    sourceUrl: 'https://www.culture.ru/poems/10174/rekviem',
    existingExcerptId: 'akhmatova-1',
  },
  {
    title: '«Так не зря мы вместе бедовали…»',
    year: '1961',
    context:
      'Самостоятельное стихотворение, четыре заключительные строки которого стали эпиграфом «Реквиема». Именно отсюда слова «Я была тогда с моим народом», прозвучавшие в коротком видео.',
    sourceUrl: 'https://www.culture.ru/poems/10114/tak-ne-zrya-my-vmeste-bedovali',
  },
  {
    title: '«Мужество»',
    year: '1942',
    context:
      'Стихотворение военного времени о защите родной речи и культурной памяти. Текст и разбор уже представлены в избранной лирике ниже.',
    sourceUrl: 'https://www.culture.ru/poems/8905/muzhestvo',
    existingExcerptId: 'akhmatova-3',
  },
  {
    title: '«Сжала руки под тёмной вуалью…»',
    year: '1911',
    context:
      'Ранняя любовная лирика Ахматовой: диалог, жест и резкий поворот в финале передают историю расставания без пространных объяснений.',
    sourceUrl: 'https://www.culture.ru/poems/10037/szhala-ruki-pod-temnoi-vualyu',
    existingExcerptId: 'akhmatova-2',
  },
  {
    title: '«Я научилась просто, мудро жить…»',
    year: '1912',
    context:
      'Лирическое размышление о тревоге, одиночестве и поиске внутренней устойчивости. Полный текст доступен в источнике по ссылке.',
    sourceUrl: 'https://www.culture.ru/poems/10329/ya-nauchilas-prosto-mudro-zhit',
  },
];

export default function AkhmatovaReadingGuide() {
  useEffect(() => {
    // A link from a Shorts description must land on the literary guide after rendering.
    if (window.location.hash !== '#akhmatova-requiem') return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('akhmatova-requiem')?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section
      id="akhmatova-requiem"
      aria-labelledby="akhmatova-requiem-title"
      className="luxury-card scroll-mt-28 rounded-[2.5rem] border border-luxury-gold/20 bg-[#0a0a0a]/70 p-6 sm:p-9"
    >
      <div className="mb-7 flex items-start gap-3">
        <BookOpen aria-hidden="true" className="mt-1 shrink-0 text-luxury-gold" size={23} />
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-luxury-gold">
            Путеводитель по произведениям
          </p>
          <h2 id="akhmatova-requiem-title" className="font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl">
            «Реквием» и стихотворения Анны Ахматовой
          </h2>
        </div>
      </div>

      <div className="space-y-4 text-base font-light leading-[1.8] text-luxury-gray-light">
        <p>
          Строки «Я была тогда с моим народом» — часть эпиграфа к «Реквиему»,
          но первоначально они входили в отдельное стихотворение 1961 года
          «Так не зря мы вместе бедовали…». Эпиграф не следует путать
          ни с «Посвящением», ни с датами написания основного корпуса поэмы.
        </p>
        <p>
          В этом разделе собраны проверенные произведения и краткие редакционные
          пояснения. Для каждого произведения указан внешний источник полного
          текста; наши комментарии и избранные части, уже представленные на
          «Легендарном Поэте», доступны ниже. Это тематический путеводитель,
          а не обещание полного собрания сочинений.
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        {readings.map((reading) => (
          <article key={reading.title} className="rounded-3xl border border-luxury-gold/10 bg-[#101010] p-5 sm:p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-luxury-gold">
              {reading.year}
            </p>
            <h3 className="mb-3 font-serif text-xl font-semibold leading-snug text-white sm:text-2xl">
              {reading.title}
            </h3>
            <p className="mb-4 text-sm leading-[1.75] text-luxury-gray-light">{reading.context}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href={reading.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-luxury-gold-light underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-luxury-gold"
              >
                Читать полный текст на Культура.РФ <ArrowUpRight aria-hidden="true" size={17} />
              </a>
              {reading.existingExcerptId && (
                <a
                  href={'#poem-' + reading.existingExcerptId}
                  className="inline-flex min-h-11 items-center text-sm text-luxury-gray-light underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-luxury-gold"
                >
                  Материал в нашей библиотеке
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="mt-6 text-sm leading-[1.75] text-luxury-gray-light">
        Другие произведения Ахматовой можно найти в{' '}
        <a
          href="https://www.culture.ru/literature/poems/author-anna-akhmatova"
          target="_blank"
          rel="noopener noreferrer"
          className="text-luxury-gold-light underline underline-offset-4 hover:text-white"
        >
          каталоге Культура.РФ
        </a>
        . Ссылки на полные тексты ведут на страницы публикации;
        мы не представляем размещённые там тексты как собственные.
      </p>
    </section>
  );
}

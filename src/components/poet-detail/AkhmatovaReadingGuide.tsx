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
    year: 'Основной корпус: 1935–1940',
    context: 'Составная поэма, в которой личное горе матери получает множество голосов и форм: тюремная очередь, историческое причитание, смертный приговор, молитва и памятование. Прозаическое «Вместо предисловия» датировано 1957 годом; эпиграф из отдельного стихотворения 1961 года принят позднее. На этой странице ниже приведены только начало «Посвящения» и глава «Распятие», между ними — значительный пропуск.',
    sourceUrl: 'https://www.culture.ru/poems/10174/rekviem',
    existingExcerptId: 'akhmatova-1',
  },
  {
    title: '«Так не зря мы вместе бедовали…»',
    year: '1961',
    context: 'Самостоятельное стихотворение из трёх четверостиший, а не глава «Реквиема». Важны не только финальные строки о народе: весь текст обращён к общему опыту страха и несвободы, а лирическое «я» говорит рядом с другими, не над ними. В качестве эпиграфа взяты последние четыре строки.',
    sourceUrl: 'https://www.culture.ru/poems/10114/tak-ne-zrya-my-vmeste-bedovali',
  },
  {
    title: '«Мужество»',
    year: '23 февраля 1942, Ташкент',
    context: 'Текст из цикла «Ветер войны», созданный в эвакуации. Первые строфы говорят о смертельной опасности, но итоговая клятва обращена к русской речи: сохранить язык означает сохранить возможность культурной преемственности. Финальное отдельное слово замыкает стихотворение как обет. Полный текст уже представлен ниже.',
    sourceUrl: 'https://www.culture.ru/poems/8905/muzhestvo',
    existingExcerptId: 'akhmatova-3',
  },
  {
    title: '«Сжала руки под тёмной вуалью…»',
    year: '1911',
    context: 'Двенадцать строк строятся как короткая драматическая сцена: жест, бег, диалог и будничная реплика на пороге расставания. Поэт не объясняет чувства за читателя: последняя фраза допускает одновременно и заботу, и окончательную отчуждённость. Стихотворение есть в библиотеке ниже.',
    sourceUrl: 'https://www.culture.ru/poems/10037/szhala-ruki-pod-temnoi-vualyu',
    existingExcerptId: 'akhmatova-2',
  },
  {
    title: '«Я научилась просто, мудро жить…»',
    year: '1912',
    context: 'Ранний лирический текст о повседневных практиках успокоения тревоги. Молитва здесь названа прямо, однако нельзя по одному лирическому голосу строить полную биографию веры автора. Пейзаж, домашний быт и неожиданный поворот финала образуют сложную, а не идиллическую картину покоя.',
    sourceUrl: 'https://www.culture.ru/poems/10329/ya-nauchilas-prosto-mudro-zhit',
  },
];

const documentarySources = [
  {
    title: 'Тексты и последовательность частей «Реквиема»',
    detail: 'Публикация текста, датировок разделов, эпиграфа и «Вместо предисловия»',
    url: 'https://www.culture.ru/poems/10174/rekviem',
  },
  {
    title: 'Архивная история первого издания',
    detail: 'Исследование «Реквием» Ахматовой в тамиздате. 56 писем; история эпиграфа и публикации 1963 года',
    url: 'https://www.colta.ru/articles/literature/21637-rekviem-ahmatovoy-v-tamizdate-56-pisem',
  },
  {
    title: 'Русский музей: хронология и портреты',
    detail: 'Книги, аресты близких, эвакуация, постановление 1946 года и поздние издания',
    url: 'https://rusmuseumvrm.ru/reference/classifier/keyword/kto_izobrazh._anna_ahmatova/index.php?lang=ru&p=807&page=1&ps=20&show=asc',
  },
  {
    title: 'Музей «Анна Ахматова. Серебряный век»',
    detail: 'Военные стихотворения, 23 февраля 1942 года и ташкентский контекст «Мужества»',
    url: 'https://akhmatova-museum.ru/qr-kody-v-ehkspozicii-muzeya/stihotvoreniya-velikoj-otechestvennoj-vojny',
  },
  {
    title: 'Виталий Виленкин: «В сто первом зеркале»',
    detail: 'Воспоминания современника о поздних беседах, музыке, Модильяни и внимании к точности',
    url: 'https://ahmatova.niv.ru/ahmatova/vospominaniya/vilenkin-v-sto-pervom-zerkale/vstrechi-poslednih-let.htm',
  },
  {
    title: 'Российская государственная библиотека',
    detail: 'Библиографическая запись комментированного собрания сочинений под редакцией Н. В. Королёвой',
    url: 'https://search.rsl.ru/ru/record/01000841012',
  },
];

function ExternalSourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-luxury-gold-light underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-luxury-gold"
    >
      {children} <ArrowUpRight aria-hidden="true" size={16} />
    </a>
  );
}

export default function AkhmatovaReadingGuide() {
  useEffect(() => {
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
      <header className="mb-8 flex items-start gap-3">
        <BookOpen aria-hidden="true" className="mt-1 shrink-0 text-luxury-gold" size={24} />
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-luxury-gold">
            Литературное исследование · тексты · свидетельства
          </p>
          <h2 id="akhmatova-requiem-title" className="font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl">
            «Реквием» и поэтический мир Анны Ахматовой
          </h2>
        </div>
      </header>

      <div className="space-y-5 text-base font-light leading-[1.85] text-luxury-gray-light">
        <p>
          В ролике звучат две заключительные строки эпиграфа к «Реквиему».
          Однако их история начинается в другом произведении: в 1961 году Ахматова
          написала «Так не зря мы вместе бедовали…», самостоятельное стихотворение
          из трёх строф. Согласно исследованию писем о первом издании поэмы,
          идею использовать его последние четыре строки как эпиграф в декабре
          1962 года предложил Лев Копелев. Поэтому 1961-й — дата исходного
          стихотворения, а не время написания основной части «Реквиема».
        </p>
        <p>
          Поэма складывалась в 1935–1940 годах. Важнейший контекст — аресты
          Льва Гумилёва, страх за его жизнь и очередь женщин у ленинградских
          тюрем. Но композиция шире личной автобиографии: после «Посвящения»
          и «Вступления» меняются голоса, образы и место действия; в главе
          «Распятие» переживание матери соприкасается с евангельским повествованием,
          а «Эпилог» возвращает читателя к памяти о стоявших рядом женщинах.
        </p>
        <p>
          Нельзя смешивать годы создания частей поэмы, дату прозаического
          «Вместо предисловия» (1 апреля 1957 года) и историю её изданий.
          «Реквием» распространялся в памяти близких, позднее в списках; впервые
          отдельной книгой вышел за границей в 1963 году, а в советской журнальной
          печати — в 1987-м. Такое различение необходимо, чтобы говорить об
          историческом свидетельстве точно, без ретроспективных легенд.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-luxury-gold/15 bg-[#111] p-5 sm:p-7">
        <h3 className="mb-5 font-serif text-2xl font-semibold text-white">Как устроен «Реквием»</h3>
        <div className="space-y-5 text-sm leading-[1.85] text-luxury-gray-light">
          <p>
            <strong className="text-white">Эпиграф и предисловие.</strong> Позднейшие
            обрамляющие тексты определяют, от чьего имени ведётся свидетельство:
            автор говорит о себе, но не присваивает себе горе других. Разговор
            с женщиной из тюремной очереди в предисловии передан как авторское
            воспоминание, а не как независимый протокол события.
          </p>
          <p>
            <strong className="text-white">«Посвящение» и десять глав.</strong> Повторяемые
            жесты ожидания и приговора сменяются молитвенным языком, бытовой
            конкретностью и почти лишёнными повествования фрагментами. В главах
            меняются грамматические лица и дистанция до переживаемого; это не
            единая хроника, где каждая строка обязательно соответствует
            определённому биографическому эпизоду.
          </p>
          <p>
            <strong className="text-white">«Распятие» и «Эпилог».</strong> Глава о
            евангельской Голгофе соединяет страдание матери с христианским
            сюжетом, не утверждая, будто исторические события тождественны
            Распятию. В эпилоге поэма переходит к проблеме имён, невозможного
            списка и общественной памяти. Именно здесь обретает смысл
            возвращение к тюремной очереди как месту памятника.
          </p>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-luxury-gray-light">
          Текст и порядок разделов: публикация «Реквиема» на Культура.РФ;
          история эпиграфа: исследование «56 писем» (ссылки на источники ниже).
        </p>
      </div>

      <div className="mt-10">
        <h3 className="mb-3 font-serif text-2xl font-semibold text-white">Произведения: проверенный маршрут чтения</h3>
        <p className="mb-6 text-sm leading-[1.85] text-luxury-gray-light">
          Двигаться от ранней психологической лирики к стихам военного времени
          и позднему свидетельству — полезнее, чем подменять каждую эпоху
          одной темой страдания. Здесь указаны оригинальные редакционные
          пояснения и проверяемые публикации; полный защищённый текст
          произведений не перепечатывается на нашем сайте.
        </p>
        <div className="grid gap-4">
          {readings.map((reading) => (
            <article key={reading.title} className="rounded-3xl border border-luxury-gold/10 bg-[#101010] p-5 sm:p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-luxury-gold">
                {reading.year}
              </p>
              <h4 className="mb-3 font-serif text-xl font-semibold leading-snug text-white sm:text-2xl">
                {reading.title}
              </h4>
              <p className="mb-4 text-sm leading-[1.85] text-luxury-gray-light">{reading.context}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <ExternalSourceLink href={reading.sourceUrl}>Полный текст на Культура.РФ</ExternalSourceLink>
                {reading.existingExcerptId && (
                  <a
                    href={'#poem-' + reading.existingExcerptId}
                    className="inline-flex min-h-11 items-center text-sm text-luxury-gray-light underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-luxury-gold"
                  >
                    Перейти к материалу в библиотеке
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-luxury-gold/15 p-5 sm:p-7">
        <h3 className="mb-5 font-serif text-2xl font-semibold text-white">Что подтверждается документом, а что остаётся интерпретацией</h3>
        <div className="space-y-4 text-sm leading-[1.85] text-luxury-gray-light">
          <p>
            <strong className="text-white">Документируемое:</strong> дата «Мужества»,
            опубликованные тексты стихотворений, последовательность глав «Реквиема»,
            даты арестов, постановление 1946 года, место и год первого отдельного
            издания. Для таких сведений приведены литературные и музейные источники.
          </p>
          <p>
            <strong className="text-white">Свидетельства:</strong> рассказы Лидии
            Чуковской, Виталия Виленкина и других современников позволяют
            реконструировать чтение, уничтожение записей, быт и разговоры.
            Они принадлежат конкретным свидетелям и не должны автоматически
            превращаться в дословные авторские заявления.
          </p>
          <p>
            <strong className="text-white">Интерпретация:</strong> значение церковных
            образов в «Реквиеме», напряжение между одиночеством и общим голосом,
            интонация финальных строк. Литературный анализ может обосновать
            прочтение, но не позволяет достоверно установить внутреннюю веру
            или скрытые намерения автора.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="mb-5 font-serif text-2xl font-semibold text-white">Источники и границы доказанного</h3>
        <ol className="space-y-4">
          {documentarySources.map((source, index) => (
            <li key={source.url} className="border-b border-luxury-gold/10 pb-4 last:border-b-0">
              <p className="text-sm font-semibold leading-relaxed text-white">
                {index + 1}. {source.title}
              </p>
              <p className="my-1 text-sm leading-[1.7] text-luxury-gray-light">{source.detail}</p>
              <ExternalSourceLink href={source.url}>Открыть источник</ExternalSourceLink>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm leading-[1.85] text-luxury-gray-light">
          <strong className="text-white">О правах и составе библиотеки.</strong>{' '}
          Ниже доступны три ранее опубликованных материала по Ахматовой;
          «Реквием» представлен только фрагментами. Ссылки на внешние тексты
          обозначены явно. Этот раздел не является полным собранием сочинений
          и не подтверждает права сайта на воспроизведение всего корпуса автора.
        </p>
      </div>
    </section>
  );
}

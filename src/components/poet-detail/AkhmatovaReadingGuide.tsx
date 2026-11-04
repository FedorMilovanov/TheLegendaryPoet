import { useEffect, type ReactNode } from 'react';
import { ArrowUpRight, BookOpen } from 'lucide-react';

interface ReadingEntry {
  title: string;
  year: string;
  context: string;
  sourceUrl: string;
  sourceLabel?: string;
  existingExcerptId?: string;
}

const readings: ReadingEntry[] = [
  {
    title: '«Сжала руки под тёмной вуалью…»',
    year: '1911 · ранняя лирика',
    context: 'Три четверостишия складываются в драматическую сцену: вопрос, движение к воротам и короткий разговор. Последняя реплика мужчины может означать одновременно заботу и невозможность вернуть прежние отношения. Это литературное прочтение, а не свидетельство о конкретном романе автора.',
    sourceUrl: 'https://www.culture.ru/poems/10037/szhala-ruki-pod-temnoi-vualyu',
    existingExcerptId: 'akhmatova-2',
  },
  {
    title: '«Песня последней встречи»',
    year: '1911 · ранняя лирика',
    context: 'Сильное чувство передано через ошибку в бытовом жесте и обманчивое восприятие пространства. Стихотворение показывает, как Ахматова делает предметную деталь действием; его нельзя автоматически трактовать как дословную исповедь биографической героини.',
    sourceUrl: 'https://www.culture.ru/poems/8919/pesnya-poslednei-vstrechi',
  },
  {
    title: '«Я научилась просто, мудро жить…»',
    year: '1912 · тревога и повседневность',
    context: 'Молитва, созерцание природы и домашний быт описаны как способы справляться с беспокойством. В последней строфе заявленный покой оказывается сложнее, чем кажется сначала. Лирическое «я» не следует механически отождествлять со всей биографией личной веры автора.',
    sourceUrl: 'https://www.culture.ru/poems/10329/ya-nauchilas-prosto-mudro-zhit',
  },
  {
    title: '«Мне голос был…»',
    year: '1917 · голос и выбор',
    context: 'Стихотворение разыгрывает внутренний спор через чужой призыв покинуть страну и молчаливый отказ. В публикациях встречаются короткий текст «Мне голос был…» и развёрнутый вариант, начинающийся «Когда в тоске самоубийства…». Эти редакционные формы следует различать, а не соединять без указания источника.',
    sourceUrl: 'https://www.culture.ru/poems/8910/mne-golos-byl',
  },
  {
    title: '«Не с теми я, кто бросил землю…»',
    year: '1922 · родина и изгнание',
    context: 'Текст заявляет выбор остаться, но содержит сострадание к изгнаннику. Поэтому делать из него лозунг против всех эмигрантов — значит опустить существенную часть стихотворения. Позиция лирического голоса сложнее простого политического деления на «своих» и «чужих».',
    sourceUrl: 'https://www.culture.ru/poems/10183/ne-s-temi-ya-kto-brosil-zemlyu',
  },
  {
    title: '«Реквием»',
    year: 'Основной корпус: 1935–1940',
    context: 'Составная поэма, где частное материнское горе получает множество голосов: очередь, ожидание приговора, историческое причитание и евангельская сцена. «Вместо предисловия» относится к 1957 году, эпиграф — к отдельному стихотворению 1961 года. Ниже в нашей библиотеке приведены только начало «Посвящения» и глава «Распятие», между ними большой пропуск.',
    sourceUrl: 'https://www.culture.ru/poems/10174/rekviem',
    existingExcerptId: 'akhmatova-1',
  },
  {
    title: '«Мужество»',
    year: '23 февраля 1942 · Ташкент',
    context: 'Военное стихотворение из цикла «Ветер войны». Две строфы обращены к смертельной опасности и утратам, а последняя делает русскую речь предметом общей клятвы. Отдельно вынесенное финальное слово фиксирует интонацию обета. Полный текст уже представлен ниже.',
    sourceUrl: 'https://www.culture.ru/poems/8905/muzhestvo',
    existingExcerptId: 'akhmatova-3',
  },
  {
    title: '«Поэма без героя»',
    year: '1940–1965 · история редакций',
    context: 'Многолетняя работа над поэмой соединяет воспоминания о предвоенном петербургском мире 1910-х годов с памятью о катастрофах XX столетия. Это произведение со сложной историей вариантов: по одному раннему автографу нельзя устанавливать единственный окончательный текст. РГАЛИ хранит первый вариант 1940–1943 годов; в прижизненном «Беге времени» (1965) публиковалась только часть поэмы.',
    sourceUrl: 'https://rgali.ru/storage-unit/2396254',
    sourceLabel: 'Автограф первого варианта в РГАЛИ',
  },
  {
    title: '«Родная земля»',
    year: '1961 · поздняя лирика',
    context: 'Здесь нет сентиментального изображения родины как идеального рая. Природное, материальное значение земли соединяется с опытом жизни и неизбежностью смерти; слово «своя» в финале приобретает тяжесть прожитого, а не декларативную громкость.',
    sourceUrl: 'https://www.culture.ru/poems/8914/rodnaya-zemlya',
  },
  {
    title: '«Так не зря мы вместе бедовали…»',
    year: '1961 · память и свидетельство',
    context: 'Самостоятельное стихотворение из трёх четверостиший, а не глава «Реквиема». В качестве эпиграфа взяты его последние четыре строки. Чтение целиком показывает, как личное «я» говорит вместе с другими, а не присваивает себе право на единственное объяснение их опыта.',
    sourceUrl: 'https://www.culture.ru/poems/10114/tak-ne-zrya-my-vmeste-bedovali',
  },
]

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
    url: 'https://rusmuseumvrm.ru/reference/classifier/keyword/kto_izobrazh._anna_ahmatova/index.php?lang=ru',
  },
  {
    title: 'Музей Анны Ахматовой в Фонтанном доме',
    detail: 'История квартиры Пунина и документированный переезд поэтессы в 1926 году',
    url: 'https://www.akhmatova.spb.ru/akhmatova/flat/punin',
  },
  {
    title: 'Олег Лекманов: двойная адресация поэзии Ахматовой',
    detail: '«Новый мир», № 2, 2021: научный разбор скрытых и публичных адресатов четырёх фрагментов «Реквиема»',
    url: 'https://nm1925.ru/articles/2021/02-2021/o-dvukhadresnoy-ustanovke-poezii-anny-akhmatovoy/',
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
    title: 'РГБ: первое отдельное издание «Реквиема»',
    detail: 'Библиографическое описание: Мюнхен, Товарищество зарубежных писателей, 1963, 23 страницы',
    url: 'https://search.rsl.ru/ru/record/01000358432',
  },
  {
    title: 'Российская государственная библиотека',
    detail: 'Библиографическая запись комментированного собрания сочинений под редакцией Н. В. Королёвой',
    url: 'https://search.rsl.ru/ru/record/01000841012',
  },
];

function ExternalSourceLink({ href, children }: { href: string; children: ReactNode }) {
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

      <nav aria-label="Разделы исследования" className="mb-8 flex flex-wrap gap-2 text-sm">
        <a href="#akhmatova-requiem-analysis" className="inline-flex min-h-11 items-center rounded-xl border border-luxury-gold/20 px-4 text-luxury-gold-light hover:border-luxury-gold/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-luxury-gold">Поэма и композиция</a>
        <a href="#akhmatova-requiem-works" className="inline-flex min-h-11 items-center rounded-xl border border-luxury-gold/20 px-4 text-luxury-gold-light hover:border-luxury-gold/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-luxury-gold">10 произведений</a>
        <a href="#akhmatova-requiem-sources" className="inline-flex min-h-11 items-center rounded-xl border border-luxury-gold/20 px-4 text-luxury-gold-light hover:border-luxury-gold/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-luxury-gold">Источники</a>
      </nav>

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

      <div id="akhmatova-requiem-analysis" className="mt-10 scroll-mt-28 rounded-3xl border border-luxury-gold/15 bg-[#111] p-5 sm:p-7">
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
            <strong className="text-white">Два круга адресатов.</strong> Литературовед
            Олег Лекманов в статье для «Нового мира» (2021) показывает, что
            некоторые фрагменты поэмы обращены одновременно к будущему широкому
            читателю и к узкому кругу людей, знавших личные обстоятельства
            Ахматовой. Исследователь сопоставляет «Вместо предисловия» с повестью
            Лидии Чуковской «Софья Петровна», а отдельные главы — с более ранней
            лирикой. Это аргументированная научная интерпретация, а не прямое
            свидетельство Ахматовой об исчерпывающем замысле каждого образа.
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

      <div id="akhmatova-requiem-works" className="mt-10 scroll-mt-28">
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
                <ExternalSourceLink href={reading.sourceUrl}>{reading.sourceLabel ?? 'Полный текст на Культура.РФ'}</ExternalSourceLink>
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

      <div id="akhmatova-requiem-sources" className="mt-10 scroll-mt-28">
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

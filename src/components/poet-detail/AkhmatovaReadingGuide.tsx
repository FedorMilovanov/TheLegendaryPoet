import { useEffect } from 'react';
import { ArrowUpRight, BookOpen } from 'lucide-react';

// Source-linked reader map; historical interpretation remains in the biography,
// the verified poem commentary, and docs/research/AKHMATOVA_READING_GUIDE_2026-11-04.md.
const EPIGRAPH_TITLE = '«Так не зря мы вместе бедовали…»';

const works = [
  ['«Сжала руки под тёмной вуалью…»', '1911', 'Три строфы, построенные как драматический диалог; жест и финальная реплика важнее авторского объяснения.', 'https://www.culture.ru/poems/10037/szhala-ruki-pod-temnoi-vualyu', 'akhmatova-2'],
  ['«Песня последней встречи»', '1911', 'Надетая не на ту руку перчатка и ошибочное ощущение лестницы передают растерянность героини.', 'https://www.culture.ru/poems/8919/pesnya-poslednei-vstrechi', ''],
  ['«Я научилась просто, мудро жить…»', '1912', 'Молитва, пейзаж и домашние привычки помогают увидеть внутреннее напряжение за заявленным покоем.', 'https://www.culture.ru/poems/10329/ya-nauchilas-prosto-mudro-zhit', ''],
  ['«Мне голос был…»', '1917', 'Спор о судьбе страны передан голосом соблазняющего призыва и сдержанной реакцией. Существуют текстовые варианты.', 'https://www.culture.ru/poems/8910/mne-golos-byl', ''],
  ['«Не с теми я, кто бросил землю…»', '1922', 'Решение остаться не исключает сочувствия к изгнаннику: обе интонации необходимо читать вместе.', 'https://www.culture.ru/poems/10183/ne-s-temi-ya-kto-brosil-zemlyu', ''],
  ['«Реквием»', '1935–1940', 'Поэма материнской скорби и исторической памяти; предисловие (1957) и эпиграф (из стихотворения 1961 года) созданы позднее.', 'https://www.culture.ru/poems/10174/rekviem', 'akhmatova-1'],
  ['«Поэма без героя»', '1940–1965', 'Работа начата в 1940 году и продолжалась десятилетиями. В РГАЛИ хранится ранний авторский вариант (ф. 13, оп. 1, ед. хр. 68, 1940–1943); ссылка открывает архивную карточку, а не цифровую копию поэмы.', 'https://rgali.ru/storage-unit/2396254', ''],
  ['«Мужество»', '1942', 'Написанное в Ташкенте военное стихотворение о сохранении русской речи как культурного наследия.', 'https://www.culture.ru/poems/8905/muzhestvo', 'akhmatova-3'],
  ['«Родная земля»', '1961', 'Родина осмыслена не как отвлечённый идеал, а как реальная земля, с которой соединены жизнь и смерть.', 'https://www.culture.ru/poems/8914/rodnaya-zemlya', ''],
  [EPIGRAPH_TITLE, '1961', 'Самостоятельные три строфы: последние четыре строки позднее стали эпиграфом «Реквиема».', 'https://www.culture.ru/poems/10114/tak-ne-zrya-my-vmeste-bedovali', ''],
] as const;

export default function AkhmatovaReadingGuide() {
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (target !== 'akhmatova-requiem' && target !== 'akhmatova-epigraph') return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section
      id="akhmatova-requiem"
      aria-labelledby="akhmatova-guide-title"
      className="theme-dark-island luxury-card relative isolate scroll-mt-28 overflow-hidden rounded-[2rem] border border-luxury-gold/25 bg-gradient-to-b from-[#15120d] via-[#0b0a09] to-[#080808] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.25)] sm:rounded-[2.5rem] sm:p-9"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-luxury-gold/10 to-transparent" />
      <div className="relative">
        <header className="mb-7 border-b border-luxury-gold/20 pb-7 sm:mb-8 sm:pb-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-luxury-gold">
              <BookOpen size={18} aria-hidden="true" />
              Литературный путеводитель
            </span>
            <span className="rounded-full border border-luxury-gold/25 bg-luxury-gold/5 px-3 py-1 text-xs font-semibold text-luxury-gold-light">
              10 произведений
            </span>
          </div>
          <h2 id="akhmatova-guide-title" className="max-w-2xl font-serif text-3xl font-semibold leading-[1.13] tracking-tight text-white sm:text-4xl">
            Анна Ахматова: поэзия, свидетельство и история «Реквиема»
          </h2>
          <p className="mt-5 max-w-[68ch] text-base leading-[1.85] text-luxury-gray-light">
            В ролике «Я была тогда с моим народом…» звучат заключительные строки эпиграфа
            к «Реквиему». Их источник — самостоятельное стихотворение «Так не зря мы вместе
            бедовали…» (1961), а не одна из глав поэмы 1935–1940 годов. Здесь произведения
            расположены по началу работы над ними; многолетние редакции отмечены отдельно.
          </p>
          <a
            href="#akhmatova-epigraph"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-luxury-gold/45 bg-luxury-gold/10 px-5 py-3 text-center text-sm font-semibold leading-relaxed text-luxury-gold-light transition-colors hover:border-luxury-gold/75 hover:bg-luxury-gold/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-luxury-gold sm:w-auto"
          >
            К стихотворению из эпиграфа
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </header>

        <p className="mb-6 max-w-[68ch] text-sm leading-[1.85] text-luxury-gray-light">
          В библиотеке сайта уже представлены три произведения; «Реквием» — лишь начало
          «Посвящения» и глава X «Распятие», разделённые значительной купюрой.
          Остальные карточки ведут к полным текстам на Культура.РФ либо к архивному
          описанию рукописи в РГАЛИ. Все внешние переходы подписаны.
        </p>

        <ol aria-label="Десять произведений по времени начала создания" className="list-none space-y-3">
          {works.map(([name, year, note, url, local], index) => {
            const isEpigraph = name === EPIGRAPH_TITLE;
            const isArchive = name === '«Поэма без героя»';
            return (
              <li
                key={name}
                id={isEpigraph ? 'akhmatova-epigraph' : undefined}
                className={`group scroll-mt-28 rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none sm:p-6 ${isEpigraph
                  ? 'border-luxury-gold/55 bg-gradient-to-br from-[#231b0f] via-[#15120d] to-[#0f0e0c] shadow-[inset_3px_0_0_rgba(212,175,55,0.65)] target:ring-2 target:ring-luxury-gold'
                  : 'border-luxury-gold/15 bg-[#101010]/80 hover:border-luxury-gold/40 hover:bg-[#171410]'}`}
              >
                <div className="flex items-start gap-4">
                  <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-serif text-lg font-semibold tabular-nums ${isEpigraph
                    ? 'border-luxury-gold/50 bg-luxury-gold/15 text-luxury-gold-light'
                    : 'border-luxury-gold/15 bg-[#181611] text-luxury-gold/80'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.13em] text-luxury-gold">{year}</span>
                      {isEpigraph && (
                        <span className="rounded-full border border-luxury-gold/35 bg-luxury-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-luxury-gold-light">
                          Строки из Shorts
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl font-semibold leading-snug text-white sm:text-2xl">{name}</h3>
                    <p className="mt-3 max-w-[68ch] text-sm leading-[1.85] text-luxury-gray-light">{note}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-luxury-gold-light underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luxury-gold"
                      >
                        {isArchive ? 'Описание рукописи в РГАЛИ' : 'Читать полный текст'}
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                      {local && (
                        <a
                          href={'#poem-' + local}
                          className="inline-flex min-h-11 items-center text-sm font-medium text-luxury-gray-light underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luxury-gold"
                        >
                          Материал в нашей библиотеке
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <aside aria-label="Научные и архивные источники" className="mt-8 rounded-2xl border border-luxury-gold/15 bg-[#14110d] p-5 text-sm leading-[1.85] text-luxury-gray-light sm:p-6">
          <h3 className="mb-3 font-serif text-xl font-semibold text-white">Источники и атрибуция</h3>
          <p>
            История публикации и составления поэмы:{' '}
            <a href="https://www.colta.ru/articles/literature/21637-rekviem-ahmatovoy-v-tamizdate-56-pisem" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-light underline underline-offset-4 hover:text-white">
              исследование «56 писем»
            </a>.
            {' '}История Фонтанного дома:{' '}
            <a href="https://www.akhmatova.spb.ru/akhmatova/flat/punin" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-light underline underline-offset-4 hover:text-white">
              музей Анны Ахматовой
            </a>.
            {' '}Первое отдельное издание «Реквиема» (Мюнхен, 1963):{' '}
            <a href="https://search.rsl.ru/ru/record/01000358432" target="_blank" rel="noopener noreferrer" className="text-luxury-gold-light underline underline-offset-4 hover:text-white">
              каталог РГБ
            </a>.
          </p>
          <p className="mt-3">
            Внешние тексты и архивные документы размещены на сайтах правообладателей
            и учреждений. Наличие ссылки не означает разрешения перепечатывать
            полный защищённый текст в библиотеке проекта.
          </p>
        </aside>
      </div>
    </section>
  );
}

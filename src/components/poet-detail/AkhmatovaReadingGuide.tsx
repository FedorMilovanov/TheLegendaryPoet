import { useEffect } from 'react';
import { ArrowUpRight, BookOpen } from 'lucide-react';

// Source-linked reader map; historical interpretation remains in the biography,
// the verified poem commentary, and docs/research/AKHMATOVA_READING_GUIDE_2026-11-04.md.
const works = [
  ['«Сжала руки под тёмной вуалью…»', '1911', 'Три строфы, построенные как драматический диалог; жест и финальная реплика важнее авторского объяснения.', 'https://www.culture.ru/poems/10037/szhala-ruki-pod-temnoi-vualyu', 'akhmatova-2'],
  ['«Песня последней встречи»', '1911', 'Надетая не на ту руку перчатка и ошибочное ощущение лестницы передают растерянность героини.', 'https://www.culture.ru/poems/8919/pesnya-poslednei-vstrechi', ''],
  ['«Я научилась просто, мудро жить…»', '1912', 'Молитва, пейзаж и домашние привычки помогают увидеть внутреннее напряжение за заявленным покоем.', 'https://www.culture.ru/poems/10329/ya-nauchilas-prosto-mudro-zhit', ''],
  ['«Мне голос был…»', '1917', 'Спор о судьбе страны передан голосом соблазняющего призыва и сдержанной реакцией. Существуют текстовые варианты.', 'https://www.culture.ru/poems/8910/mne-golos-byl', ''],
  ['«Не с теми я, кто бросил землю…»', '1922', 'Решение остаться не исключает сочувствия к изгнаннику: обе интонации необходимо читать вместе.', 'https://www.culture.ru/poems/10183/ne-s-temi-ya-kto-brosil-zemlyu', ''],
  ['«Реквием»', '1935–1940', 'Поэма материнской скорби и исторической памяти; предисловие (1957) и эпиграф (из стихотворения 1961 года) созданы позднее.', 'https://www.culture.ru/poems/10174/rekviem', 'akhmatova-1'],
  ['«Мужество»', '1942', 'Написанное в Ташкенте военное стихотворение о сохранении русской речи как культурного наследия.', 'https://www.culture.ru/poems/8905/muzhestvo', 'akhmatova-3'],
  ['«Поэма без героя»', '1940–1965', 'Многолетняя работа над исторической памятью и временем. Архивный автограф относится лишь к первому варианту.', 'https://rgali.ru/storage-unit/2396254', ''],
  ['«Родная земля»', '1961', 'Родина осмыслена не как отвлечённый идеал, а как реальная земля, с которой соединены жизнь и смерть.', 'https://www.culture.ru/poems/8914/rodnaya-zemlya', ''],
  ['«Так не зря мы вместе бедовали…»', '1961', 'Самостоятельные три строфы: последние четыре строки позднее стали эпиграфом «Реквиема».', 'https://www.culture.ru/poems/10114/tak-ne-zrya-my-vmeste-bedovali', ''],
] as const;

export default function AkhmatovaReadingGuide() {
  useEffect(() => {
    if (window.location.hash !== '#akhmatova-requiem') return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('akhmatova-requiem')?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section id="akhmatova-requiem" aria-labelledby="akhmatova-guide-title"
      className="luxury-card scroll-mt-28 rounded-[2.5rem] border border-luxury-gold/20 bg-[#0a0a0a]/70 p-6 sm:p-9">
      <div className="mb-6 flex items-start gap-3">
        <BookOpen size={23} aria-hidden="true" className="mt-1 shrink-0 text-luxury-gold" />
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-luxury-gold">Литературный путеводитель</p>
          <h2 id="akhmatova-guide-title" className="font-serif text-3xl font-semibold text-white">
            «Реквием» и десять произведений Анны Ахматовой
          </h2>
        </div>
      </div>
      <p className="mb-4 text-base leading-[1.85] text-luxury-gray-light">
        В ролике «Я была тогда с моим народом…» звучат заключительные строки эпиграфа к
        «Реквиему». Их источник — самостоятельное стихотворение 1961 года
        «Так не зря мы вместе бедовали…», а не главы поэмы 1935–1940 годов.
        Ниже — хронологический маршрут чтения, краткие пояснения и документы.
      </p>
      <p className="mb-7 text-sm leading-[1.8] text-luxury-gray-light">
        В нашей библиотеке уже представлены три произведения, причём «Реквием» —
        только фрагментами (начало «Посвящения» и глава X «Распятие»).
        Остальные ссылки ведут на публикации Культура.РФ или на архивную опись РГАЛИ.
      </p>
      <ol className="space-y-3">
        {works.map(([name, year, note, url, local], index) => (
          <li key={name} className="rounded-2xl border border-luxury-gold/10 bg-[#101010] p-4 sm:p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-luxury-gold">
              {index + 1} · {year}
            </p>
            <h3 className="mb-2 font-serif text-xl font-semibold text-white">{name}</h3>
            <p className="mb-3 text-sm leading-[1.75] text-luxury-gray-light">{note}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 text-sm text-luxury-gold-light underline-offset-4 hover:underline">
                {name === '«Поэма без героя»' ? 'Архивный автограф в РГАЛИ' : 'Читать полный текст'} <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              {local && (
                <a href={'#poem-' + local} className="inline-flex min-h-11 items-center text-sm text-luxury-gray-light underline-offset-4 hover:text-white hover:underline">
                  Материал в нашей библиотеке
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 space-y-2 text-sm leading-[1.75] text-luxury-gray-light">
        <p>История эпиграфа: <a className="text-luxury-gold-light underline underline-offset-4" href="https://www.colta.ru/articles/literature/21637-rekviem-ahmatovoy-v-tamizdate-56-pisem" target="_blank" rel="noopener noreferrer">«Реквием» в тамиздате. 56 писем</a>.</p>
        <p>Свидетельства о Фонтанном доме: <a className="text-luxury-gold-light underline underline-offset-4" href="https://www.akhmatova.spb.ru/akhmatova/flat/punin" target="_blank" rel="noopener noreferrer">Музей Анны Ахматовой</a>. Первое отдельное издание «Реквиема» (1963): <a className="text-luxury-gold-light underline underline-offset-4" href="https://search.rsl.ru/ru/record/01000358432" target="_blank" rel="noopener noreferrer">каталог РГБ</a>.</p>
        <p>Полные тексты, доступные по внешним ссылкам, не являются публикациями нашего сайта. Без подтверждения прав их нельзя автоматически перепечатывать в библиотеку.</p>
      </div>
    </section>
  );
}

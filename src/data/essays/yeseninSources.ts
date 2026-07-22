import type { EssaySource } from '../../types/essay';

interface SourceAnnotation extends Omit<EssaySource, 'url'> {
  url: string;
  /** When the source is absent from the old bibliography, append it explicitly. */
  title?: string;
}

function normalizeUrl(url: string): string {
  return url.replace(/^http:/, 'https:').replace(/\/$/, '');
}

const annotations: SourceAnnotation[] = [
  {
    id: 'yesenin-preface-1924',
    url: 'https://ru.wikisource.org/wiki/Предисловие_(Есенин)',
    kind: 'primary',
    institution: 'Викитека / академическая публикация',
    year: 1924,
    note: 'Прямое авторское самоопределение: отношение к религиозным образам и реализму.',
  },
  {
    id: 'yesenin-pss',
    url: 'https://feb-web.ru/feb/esenin/default.asp',
    kind: 'primary',
    institution: 'ФЭБ / ИМЛИ РАН',
    year: '1995–2002',
    note: 'Академическое полное собрание сочинений, писем и комментариев.',
  },
  {
    id: 'yesenin-inonia',
    url: 'https://ru.wikisource.org/wiki/Инония_(Есенин)',
    kind: 'primary',
    institution: 'Викитека',
    year: 1918,
    note: 'Авторский текст поэмы с прямым отказом от спасения через Крест.',
  },
  {
    id: 'yesenin-o-sebe',
    url: 'http://feb-web.ru/feb/esenin/texts/e77/e77-018-.htm',
    kind: 'primary',
    institution: 'ФЭБ / ИМЛИ РАН',
    year: 1925,
    note: 'Автобиографический текст Есенина о детстве, вере и источнике лирики.',
  },
  {
    id: 'yesenin-blok-diary',
    title: 'А. Блок. Дневник, запись 4 января 1918 года — разъяснение Есениным смысла «Инонии»',
    url: 'http://feb-web.ru/feb/esenin/el-abc/el2/el2-081-.htm',
    kind: 'primary',
    institution: 'ФЭБ / Летопись жизни и творчества',
    year: 1918,
    note: 'Дневниковая запись Блока с разъяснением Есениным смысла «Инонии».',
  },
  {
    id: 'yesenin-interrogation-1923',
    url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-5152.htm?cmd=p',
    kind: 'archive',
    institution: 'ФЭБ / ПСС',
    year: 1923,
    note: 'Протокол допроса с подписью Есенина от 21 ноября 1923 года.',
  },
  {
    id: 'yesenin-detention-1924',
    url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p',
    kind: 'archive',
    institution: 'ФЭБ / ПСС',
    year: 1924,
    note: 'Документы о задержании, допросе и подписке о невыезде.',
  },
  {
    id: 'yesenin-clinic-1925',
    url: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
    kind: 'primary',
    institution: 'ФЭБ / ПСС',
    year: 1925,
    note: 'Академический комментарий с точными датами пребывания в клинике.',
  },
  {
    id: 'yesenin-black-man-text',
    url: 'https://feb-web.ru/feb/esenin/texts/es3/es3-188-.htm?cmd=p',
    kind: 'primary',
    institution: 'ФЭБ / ПСС',
    year: '1923–1925',
    note: 'Академический текст и датировка работы над «Чёрным человеком».',
  },
  {
    id: 'yesenin-marriage-1925',
    url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-0982.htm?cmd=p',
    kind: 'archive',
    institution: 'ФЭБ / ПСС',
    year: 1925,
    note: 'Документальная дата регистрации брака с Софьей Андреевной Толстой.',
  },
  {
    id: 'yesenin-cafe-bills',
    url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-5092.htm?cmd=p',
    kind: 'archive',
    institution: 'ФЭБ / ПСС',
    year: 1923,
    note: 'Пятьдесят два счёта «Стойла Пегаса» с подписью Есенина.',
  },
  {
    id: 'yesenin-imagist-action-1919',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-199-.htm?cmd=p&istext=1',
    kind: 'archive',
    institution: 'ФЭБ / Летопись жизни и творчества',
    year: 1919,
    note: 'Документальная датировка имажинистской росписи Страстного монастыря.',
  },
  {
    id: 'yesenin-last-days-archive',
    url: 'https://esenin-museum.ru/mystery_of_angleterre',
    kind: 'archive',
    institution: 'Государственный музей С. А. Есенина',
    year: 1925,
    note: 'Свод материалов и свидетельств о последних днях в «Англетере».',
  },
  {
    id: 'yesenin-forensic-study',
    url: 'https://cyberleninka.ru/article/n/sudebno-meditsinskie-aspekty-tragicheskoy-gibeli-s-a-esenina',
    kind: 'research',
    institution: 'Судебно-медицинское исследование',
    note: 'Разбор акта Гиляревского, материалов дознания и медицинских обстоятельств смерти.',
  },
  {
    id: 'yesenin-prosecutor-conclusion',
    url: 'https://ru.wikisource.org/wiki/Заключение_об_обоснованности_прекращения_23.01.26_г._дознания_по_факту_самоубийства_С._А._Есенина',
    kind: 'archive',
    institution: 'Генеральная прокуратура РФ / Викитека',
    year: 1993,
    note: 'Официальное заключение повторной проверки материалов дознания.',
  },
  {
    id: 'yesenin-criminalistic-review',
    url: 'https://voplit.ru/article/smert-sergeya-esenina-kriminalisticheskij-vzglyad-na-kulturno-istoricheskoe-sobytie/',
    kind: 'research',
    institution: 'Вопросы литературы',
    note: 'Криминалистический разбор документов и поздней версии убийства.',
  },
];

export function enrichYeseninSources(sources: EssaySource[]): EssaySource[] {
  const annotationMap = new Map(
    annotations.map((annotation) => [normalizeUrl(annotation.url), annotation]),
  );
  const matched = new Set<string>();

  const enriched = sources.map((source) => {
    if (!source.url) return source;
    const key = normalizeUrl(source.url);
    const annotation = annotationMap.get(key);
    if (!annotation) return source;
    matched.add(key);
    const { url: _annotationUrl, title: _annotationTitle, ...metadata } = annotation;
    return { ...source, ...metadata };
  });

  for (const [url, annotation] of annotationMap) {
    if (matched.has(url)) continue;
    if (annotation.title) {
      enriched.push({ ...annotation, title: annotation.title });
      matched.add(url);
      continue;
    }
    throw new Error(`Yesenin source annotation did not match the bibliography: ${annotation.id}`);
  }

  return enriched;
}

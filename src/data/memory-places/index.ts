import media from './lermontov-pyatigorsk-media.json';

export type MemoryPhoto = {
  src: string; width: number; height: number; alt: string; caption: string;
  credit: string; source: string; sourceLabel: string; license: string; licenseUrl: string;
  originalSha256: string; sha256: string; bytes: number; changes: string;
};
export type MemoryPlace = {
  id: string; poetId: string; kind: 'monument' | 'museum' | 'estate' | 'grave' | 'other';
  title: string; location: string; date: string; intro: string;
  facts: readonly { label: string; value: string }[];
  timeline: readonly { date: string; text: string }[];
  photos: readonly MemoryPhoto[];
  detailNote?: { title: string; text: string };
  literaryConnection?: { lines: readonly string[]; attribution: string; url: string };
  sources: readonly { label: string; url: string }[];
};

const captions: Record<string, Pick<MemoryPhoto, 'alt' | 'caption'>> = {
  square: { alt: 'Памятник Лермонтову в сквере на фоне Машука', caption: 'Пятигорск, 12 октября 2023 года. Городской сквер и Машук.' },
  figure: { alt: 'Бронзовая фигура Лермонтова на скале, вид снизу', caption: 'Фигура поэта, 8 января 2015 года. Видны офицерский сюртук, шинель и книга.' },
  lyre: { alt: 'Лира, венок и дата открытия на гранитном пьедестале', caption: 'Деталь пьедестала, 8 июля 2017 года. Лира, венок и надпись «16 августа 1889 года».' },
};

const lermontov: MemoryPlace = {
  id: 'lermontov-pyatigorsk-1889',
  poetId: 'mikhail-lermontov',
  kind: 'monument',
  title: 'Памятник Лермонтову в Пятигорске',
  location: 'Лермонтовский сквер, Пятигорск',
  date: '16 (28) августа 1889 года',
  intro: 'Первый самостоятельный памятник Лермонтову в России возник благодаря всероссийской подписке. Александр Опекушин представил поэта сидящим на скале, с книгой у ног. Этот монумент находится в центре города и не является обелиском на месте дуэли.',
  facts: [
    { label: 'Открытие', value: '1889' },
    { label: 'Сбор пожертвований', value: '18 лет' },
    { label: 'Высота монумента', value: '5,65 м' },
  ],
  timeline: [
    { date: '1870–1875', text: 'Пётр Мартьянов предложил установить памятник. В 1871 году Александр II разрешил публичный сбор средств; первыми жертвователями стали два крестьянина из Таврической губернии. В 1875 году учреждён комитет.' },
    { date: '1881–1883', text: 'Конкурс прошёл в три тура. В октябре 1883 года жюри выбрало модель «Порыв» Александра Опекушина, уже создавшего московский памятник Пушкину.' },
    { date: '1885–1889', text: 'Для скульптурного портрета использованы автопортрет Лермонтова 1837 года и профильный портрет 1840 года. Статую высотой 2,35 м отлили на петербургской фабрике Морана; светлый гранит для пьедестала привезли из Крыма.' },
    { date: '16 (28) августа 1889', text: 'На открытии собрались участники строительства, горожане и гости курорта. На пьедестале сохранилась дата торжества под бронзовой лирой с венком.' },
  ],
  photos: media.map((photo) => ({ ...photo, ...captions[photo.slug] })),
  detailNote: {
    title: 'Лира и гранит',
    text: 'В бронзе и камне соединены два образа: военный мундир напоминает о службе Лермонтова, а книга и лира — о литературе. Дата на пьедестале относится к открытию монумента, а не к жизни поэта.',
  },
  literaryConnection: {
    lines: ['Давным-давно, у чистых вод,', 'Где по кремням Подкумок мчится,', 'Где за Машуком день встает,', 'А за крутым Бешту садится,'],
    attribution: 'М. Ю. Лермонтов, «Измаил-Бей», часть I, строфа 6',
    url: 'https://rvb.ru/19vek/lermontov/ss4/vol2/poems/465.html',
  },
  sources: [
    { label: 'Культура.РФ — памятник М. Ю. Лермонтову', url: 'https://www.culture.ru/institutes/6151/pamyatnik-m-yu-lermontovu-v-pyatigorske' },
    { label: 'СКУНБ им. Лермонтова — день открытия памятника', url: 'https://old.skunb.ru/node/4205' },
    { label: 'Пятигорский государственный университет — «Первый в России»', url: 'https://omir.pgu.ru/pervyj-v-rossii/' },
    { label: 'РВБ — академический текст «Измаил-Бей»', url: 'https://rvb.ru/19vek/lermontov/ss4/vol2/poems/465.html' },
  ],
};

export const memoryPlaces: readonly MemoryPlace[] = [lermontov];
export function getMemoryPlaces(poetId: string): readonly MemoryPlace[] {
  return memoryPlaces.filter((place) => place.poetId === poetId);
}

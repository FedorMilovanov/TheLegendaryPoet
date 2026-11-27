/** Literary source map: first occurrence in the authored compilation, not a timecoded transcript. */
export interface CollectionSource {
  id: string;
  title: string;
  date: string;
  fragment: string;
  url: string;
  note: string;
  institution: string;
  prose?: boolean;
  /** Existing canonical poem card, only after independent textual collation. */
  poemId?: string;
}

export const fetNewYearSources: readonly CollectionSource[] = [
  { id: 'letter', title: 'Письмо, предположительно к А. А. Григорьеву', date: '1847 (?)', fragment: 'давайте нам жизни и наслаждения', url: 'https://ru.wikisource.org/wiki/Письма_(Фет)', institution: 'Фет. Сочинения в двух томах, 1982, т. 2 (Викитека)', note: 'Фраза из письма Зарницына в рассказе «Другой из многих»; исследователи связывают его с Фетом. Автограф письма не известен.', prose: true },
  { id: 'dithyramb', title: 'Дифирамб на Новый год', date: '1840 (?)', fragment: 'Переплетись, новый год!', url: 'https://imwerden.de/pdf/fet_sobranie_sochinenij_v_20tt_tom01_2002__ocr.pdf#page=324', poemId: 'fet-11', institution: 'Сочинения и письма, т. 1, 2002, с. 322 (скан)', note: 'Рефрен из стихотворения, сохранившегося в письме к Введенскому от 28 ноября 1840 года. Первая печать 1924, с. 65–66; предположительные восстановления сохранены в библиотечной карточке.' },
  { id: 'snow', title: 'Скрип шагов вдоль улиц белых…', date: 'ок. 1858', fragment: 'Скрип шагов вдоль улиц белых', url: 'https://rvb.ru/19vek/fet/bp/text/129.html', poemId: 'fet-5', institution: 'РВБ · Полное собрание стихотворений, 1959, № 129', note: 'Начало стихотворения переносит действие на морозную улицу; датировка предположительна.' },
  { id: 'stars', title: 'Сегодня все звезды так пышно…', date: '1888', fragment: 'Огнем голубым разгорались', url: 'https://ru.wikisource.org/wiki/Страница:Полное_собрание_стихотворений_А._А._Фета._Т._1_(1901).djvu/553', poemId: 'fet-8', institution: 'Полное собрание стихотворений, 1901, т. 1, с. 433 (факсимиле)', note: 'Поздняя ночная лирика; печатный свидетель 1901 года подтверждает «мощно». В изданиях 1901 и 1959 указано 27 октября 1888.' },
  { id: 'gold', title: 'Благовонная ночь, благодатная ночь…', date: '1887', fragment: 'И огни золотые горят', url: 'https://ru.wikisource.org/wiki/Страница:Полное_собрание_стихотворений_А._А._Фета._Т._1_(1901).djvu/534', poemId: 'fet-6', institution: 'Полное собрание стихотворений, 1901, т. 1, с. 414 (факсимиле)', note: 'В оригинале — сад, звёзды и ночная музыка природы; в композиции образ становится праздничным рефреном.' },
  { id: 'moon', title: 'Если зимнее небо звезда́ми горит…', date: '1843', fragment: 'И мечтательно светит луна', url: 'https://rvb.ru/19vek/fet/bp/text/147.html', poemId: 'fet-9', institution: 'РВБ · Полное собрание стихотворений, 1959, № 147 (поздняя редакция)', note: 'Лунный образ; в четвёртой строке использована поздняя редакция 1856 года. Ударение «звезда́ми» отмечено в РВБ и соответствует анапесту.' },
  { id: 'hearth', title: 'На двойном стекле узоры…', date: '1847 (?)', fragment: 'Пред горящими дровами', url: 'https://rvb.ru/19vek/fet/bp/text/128.html', poemId: 'fet-7', institution: 'РВБ · Полное собрание стихотворений, 1959, № 128 (поздняя редакция)', note: 'Тепло очага противопоставлено морозу; цикл «Снега». Первая печать 1850, поздняя редакция 1856; дата создания предположительна.' },
  { id: 'dance', title: 'В руке с тамбурином, в глазах с упоеньем…', date: '1842', fragment: 'Ты гнешься и вьешься, плывешь и летишь', url: 'https://imwerden.de/pdf/fet_sobranie_sochinenij_v_20tt_tom01_2002__ocr.pdf#page=69', poemId: 'fet-10', institution: 'Сочинения и письма, т. 1, 2002, с. 67 (скан)', note: 'Первопечатное восьмистишие в «Москвитянине», № 8, с. 237; песня использует первые две строки, не документальное описание бала.' },
  { id: 'song', title: 'Певице', date: '1857 (опубл.)', fragment: 'Уноси мое сердце в звенящую даль', url: 'https://rvb.ru/19vek/fet/bp/text/168.html', poemId: 'fet-4', institution: 'РВБ · Полное собрание стихотворений, 1959, с. 182', note: 'Вероятно, написано в конце 1856 года; впервые опубликовано в 1857-м. В 1873 году к этому тексту обратился Чайковский.' },
];

export const fetNewYearEssaySlug = 'fet-perepletis-novyi-god';
export const fetNewYearCover = '/images/essays/fet/fet-new-year-ball.webp';
export const fetNewYearCoverAlt = 'Золотые люстры, новогодняя ёлка и синяя лента в воображаемом дворцовом зале';
export const fetNewYearCoverCredit = 'THE LEGENDARY POET · кадр авторского клипа (05:50), художественная реконструкция';

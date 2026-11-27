/** Literary source map: first occurrence in the authored compilation, not a timecoded transcript. */
export interface CollectionSource {
  id: string;
  title: string;
  date: string;
  fragment: string;
  url: string;
  note: string;
  prose?: boolean;
  /** Existing canonical poem card, only after independent textual collation. */
  poemId?: string;
}

export const fetNewYearSources: readonly CollectionSource[] = [
  { id: 'letter', title: 'Письмо, предположительно к А. А. Григорьеву', date: '1847 (?)', fragment: 'давайте нам жизни и наслаждения', url: 'https://ru.wikisource.org/wiki/Письма_(Фет)', note: 'Фраза из письма Зарницына в рассказе «Другой из многих»; исследователи связывают его с Фетом. Автограф письма не известен.', prose: true },
  { id: 'dithyramb', title: 'Дифирамб на Новый год', date: '1840', fragment: 'Переплетись, новый год!', url: 'https://rvb.ru/19vek/fet/bp/text/537.html', note: 'Строка из средней части дифирамба и образ рук, кос, лент и лёгких тканей — смысловой центр новой композиции.' },
  { id: 'snow', title: 'Скрип шагов вдоль улиц белых…', date: 'ок. 1858', fragment: 'Скрип шагов вдоль улиц белых', url: 'https://rvb.ru/19vek/fet/bp/text/129.html', poemId: 'fet-5', note: 'Начало стихотворения переносит действие на морозную улицу; датировка предположительна.' },
  { id: 'stars', title: 'Сегодня все звезды так пышно…', date: '1888', fragment: 'Огнем голубым разгорались', url: 'https://rvb.ru/19vek/fet/bp/text/229.html', note: 'Поздняя ночная лирика: появление возлюбленной, мерцание и внутреннее волнение. Разные издания расходятся в точном дне датировки.' },
  { id: 'gold', title: 'Благовонная ночь, благодатная ночь…', date: '1887', fragment: 'И огни золотые горят', url: 'https://ru.wikisource.org/wiki/Страница:Полное_собрание_стихотворений_А._А._Фета._Т._1_(1901).djvu/534', poemId: 'fet-6', note: 'В оригинале — сад, звёзды и ночная музыка природы; в композиции образ становится праздничным рефреном.' },
  { id: 'moon', title: 'Если зимнее небо звезда́ми горит…', date: '1843', fragment: 'И мечтательно светит луна', url: 'https://rvb.ru/19vek/fet/bp/text/147.html', note: 'Зимняя ночь и образ возлюбленной. В оглавлении академического издания 1959 года отмечено ударение «звезда́ми»; его поддерживает анапестический ритм начальной строки.' },
  { id: 'hearth', title: 'На двойном стекле узоры…', date: '1847', fragment: 'Пред горящими дровами', url: 'https://rvb.ru/19vek/fet/bp/text/128.html', note: 'Тепло очага противопоставлено морозу; зимний цикл «Снега».' },
  { id: 'dance', title: 'В руке с тамбурином, в глазах с упоеньем…', date: '1842', fragment: 'Ты гнешься и вьешься, плывешь и летишь', url: 'https://rvb.ru/19vek/fet/bp/text/553.html', note: 'Из первой строфы ранней лирики; танец и движение, а не документальное описание новогоднего бала.' },
  { id: 'song', title: 'Певице', date: '1857 (опубл.)', fragment: 'Уноси мое сердце в звенящую даль', url: 'https://rvb.ru/19vek/fet/bp/text/168.html', poemId: 'fet-4', note: 'Вероятно, написано в конце 1856 года; впервые опубликовано в 1857-м. В 1873 году к этому тексту обратился Чайковский.' },
];

export const fetNewYearEssaySlug = 'fet-perepletis-novyi-god';
export const fetNewYearCover = '/images/essays/fet/fet-new-year-ball.webp';
export const fetNewYearCoverAlt = 'Золотые люстры, новогодняя ёлка и синяя лента в воображаемом дворцовом зале';
export const fetNewYearCoverCredit = 'THE LEGENDARY POET · кадр авторского клипа (05:50), художественная реконструкция';

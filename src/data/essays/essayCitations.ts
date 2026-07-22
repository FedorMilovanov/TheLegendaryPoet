import type { EssayBlock } from '../../types/essay';

interface CitationRule {
  startsWith: string;
  sourceIds: string[];
}

export function attachEssayCitations(
  blocks: EssayBlock[],
  rules: CitationRule[],
): EssayBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'paragraph' && block.type !== 'lead' && block.type !== 'note') return block;
    const rule = rules.find(({ startsWith }) => block.text.startsWith(startsWith));
    return rule ? { ...block, sourceIds: rule.sourceIds } : block;
  });
}

export const mayakovskyPartOneCitationRules: CitationRule[] = [
  {
    startsWith: 'Владимир Маяковский родился',
    sourceIds: ['self-autobiography', 'family-1905'],
  },
  {
    startsWith: 'В пятнадцать лет он вступил',
    sourceIds: ['self-autobiography', 'reg-card-1908'],
  },
  {
    startsWith: 'В 1911 году в училище',
    sourceIds: ['self-autobiography', 'student-1910', 'early-chronicle-1912'],
  },
  {
    startsWith: 'В декабре 1912 года',
    sourceIds: ['early-chronicle-1912', 'futurists-1912', 'early-latest-russian-poetry'],
  },
  {
    startsWith: 'Высокий рост, жёлтая кофта',
    sourceIds: ['early-chronicle-1913', 'nate'],
  },
  {
    startsWith: 'Раннего Маяковского легко свести',
    sourceIds: ['listen'],
  },
  {
    startsWith: 'Главная дореволюционная поэма',
    sourceIds: ['cloud', 'cloud-preface'],
  },
  {
    startsWith: 'В конце июля 1915 года Эльза Каган',
    sourceIds: ['self-autobiography', 'mayakovsky-lilya-1915', 'early-chronicle-1915'],
  },
  {
    startsWith: 'В 1916 году Маяковский написал',
    sourceIds: ['lilichka'],
  },
  {
    startsWith: 'В 1918 году Маяковский писал сценарии',
    sourceIds: ['lady-hooligan', 'mystery-bouffe-first'],
  },
];

export const mayakovskyPartTwoCitationRules: CitationRule[] = [
  {
    startsWith: 'Вторая часть начинается там',
    sourceIds: ['self-late', 'full-voice'],
  },
  {
    startsWith: 'В 1919–1922 годах Маяковский работал',
    sourceIds: ['articles-1918-1930', 'how-to-make-poems'],
  },
  {
    startsWith: 'В 1922 году возник ЛЕФ',
    sourceIds: ['lef-ref', 'circle-1924', 'circle-1925'],
  },
  {
    startsWith: 'В 1925 году Маяковский через Мексику',
    sourceIds: ['mexico-1925', 'jangfeldt-biography'],
  },
  {
    startsWith: 'Связь с Лилей Брик сохранялась',
    sourceIds: ['yakovleva-letter', 'kostrov-letter', 'crimea-1926'],
  },
  {
    startsWith: 'На открытии выставки «20 лет работы»',
    sourceIds: ['opening-exhibition', 'museum-invited-list'],
  },
  {
    startsWith: 'Октябрьскую революцию Маяковский принял',
    sourceIds: ['self-late', 'mystery-bouffe-libretto', 'lenin-poem'],
  },
  {
    startsWith: 'Последние месяцы не укладываются',
    sourceIds: ['bathhouse', 'letter-lilya-march-1930', 'opening-exhibition', 'red-presnya-speech'],
  },
  {
    startsWith: '14 апреля 1930 года',
    sourceIds: ['letter-everyone', 'chronicle-1930'],
  },
  {
    startsWith: 'Похороны 17 апреля 1930 года',
    sourceIds: ['chronicle-1930', 'kle-mayakovsky'],
  },
];

export const brikCitationRules: CitationRule[] = [
  {
    startsWith: 'В конце июля 1915 года Маяковский познакомился',
    sourceIds: ['brik-self', 'brik-photo-mayakovsky-lilya-1915', 'brik-correspondence'],
  },
  {
    startsWith: 'Квартира Бриков на улице Жуковского',
    sourceIds: ['brik-self', 'brik-photo-circle-1924', 'brik-photo-circle-1925'],
  },
  {
    startsWith: 'Эта сцена не была мгновенным пленением',
    sourceIds: ['brik-self', 'brik-variants'],
  },
  {
    startsWith: 'Слово «треугольник» создаёт',
    sourceIds: ['brik-correspondence', 'rgali-lilya-katanyan', 'rgali-osip'],
  },
  {
    startsWith: 'Эта свобода не уничтожила ревность',
    sourceIds: ['brik-correspondence', 'puppy-note'],
  },
  {
    startsWith: 'Одним из самых точных символов',
    sourceIds: ['ring-lyub', 'brik-love'],
  },
  {
    startsWith: 'В конце 1922 года отношения переживали кризис',
    sourceIds: ['brik-letter-dec-1922', 'brik-letter-jan-1923', 'brik-pro-eto'],
  },
  {
    startsWith: 'Формула «добровольное заключение»',
    sourceIds: ['brik-correspondence', 'paperny-pro-eto'],
  },
  {
    startsWith: 'История публикации письма-дневника',
    sourceIds: ['parnis-diary', 'rgali-lilya-katanyan'],
  },
];

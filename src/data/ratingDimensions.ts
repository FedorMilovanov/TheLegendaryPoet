import type { RatingDimension } from '../types/community';
import { ratingDimensionKeysByTarget } from './ratingDimensionContract';

export const poetRatingDimensions: RatingDimension[] = [
  { key: ratingDimensionKeysByTarget.poet[0], label: 'Язык', hint: 'точность, музыкальность, сила строки' },
  { key: ratingDimensionKeysByTarget.poet[1], label: 'Глубина', hint: 'мысль, внутренний масштаб, трагизм' },
  { key: ratingDimensionKeysByTarget.poet[2], label: 'Наследие', hint: 'влияние на литературу и культуру' },
  { key: ratingDimensionKeysByTarget.poet[3], label: 'Правда', hint: 'честность опыта без позы и фальши' },
];

export const poemRatingDimensions: RatingDimension[] = [
  { key: ratingDimensionKeysByTarget.poem[0], label: 'Красота', hint: 'образность и эстетическая сила' },
  { key: ratingDimensionKeysByTarget.poem[1], label: 'Форма', hint: 'ритм, композиция, техника' },
  { key: ratingDimensionKeysByTarget.poem[2], label: 'Удар', hint: 'эмоциональное и смысловое воздействие' },
];

export const trackRatingDimensions: RatingDimension[] = [
  { key: ratingDimensionKeysByTarget.track[0], label: 'Голос', hint: 'подача и выразительность' },
  { key: ratingDimensionKeysByTarget.track[1], label: 'Музыка', hint: 'аранжировка и атмосфера' },
  { key: ratingDimensionKeysByTarget.track[2], label: 'Верность тексту', hint: 'уважение к стихотворению' },
];

export const articleRatingDimensions: RatingDimension[] = [
  { key: ratingDimensionKeysByTarget.article[0], label: 'Ясность', hint: 'структура, внятность и логика текста' },
  { key: ratingDimensionKeysByTarget.article[1], label: 'Глубина', hint: 'содержательность и аналитический уровень' },
  { key: ratingDimensionKeysByTarget.article[2], label: 'Справедливость', hint: 'насколько взвешенно подан материал' },
];

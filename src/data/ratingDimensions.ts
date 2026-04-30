import { RatingDimension } from '../types/community';

export const poetRatingDimensions: RatingDimension[] = [
  { key: 'language', label: 'Язык', hint: 'точность, музыкальность, сила строки' },
  { key: 'depth', label: 'Глубина', hint: 'мысль, внутренний масштаб, трагизм' },
  { key: 'legacy', label: 'Наследие', hint: 'влияние на литературу и культуру' },
  { key: 'truth', label: 'Правда', hint: 'честность опыта без позы и фальши' },
];

export const poemRatingDimensions: RatingDimension[] = [
  { key: 'beauty', label: 'Красота', hint: 'образность и эстетическая сила' },
  { key: 'form', label: 'Форма', hint: 'ритм, композиция, техника' },
  { key: 'impact', label: 'Удар', hint: 'эмоциональное и смысловое воздействие' },
];

export const trackRatingDimensions: RatingDimension[] = [
  { key: 'voice', label: 'Голос', hint: 'подача и выразительность' },
  { key: 'music', label: 'Музыка', hint: 'аранжировка и атмосфера' },
  { key: 'text', label: 'Верность тексту', hint: 'уважение к стихотворению' },
];

export const articleRatingDimensions: RatingDimension[] = [
  { key: 'clarity', label: 'Ясность', hint: 'структура, внятность и логика текста' },
  { key: 'depth', label: 'Глубина', hint: 'содержательность и аналитический уровень' },
  { key: 'fairness', label: 'Справедливость', hint: 'насколько взвешенно подан материал' },
];
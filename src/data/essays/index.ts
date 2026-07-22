import type { Essay } from '../../types/essay';
import { yeseninPartOne } from './yeseninPartOne';
import { yeseninPartTwo } from './yeseninPartTwoVisual';
import { mayakovskyPartOne } from './mayakovskyPartOne';
import { mayakovskyPartTwo } from './mayakovskyPartTwoVisual';
import { brikCaseVisual } from './brikCaseVisual';

const yeseninPartOneWithCover: Essay = {
  ...yeseninPartOne,
  cover: '/images/essays/yesenin-kutezhi-card.jpg',
  cardCover: '/images/essays/yesenin-kutezhi-card.jpg',
  coverAlt: 'Молодой Сергей Есенин — художественная реконструкция на основе архивных портретов',
  coverKind: 'reconstruction',
  coverCredit: 'THE LEGENDARY POET',
};

const yeseninPartTwoWithCover: Essay = {
  ...yeseninPartTwo,
  cover: '/images/essays/yesenin-kutezhi.jpg',
  cardCover: '/images/essays/yesenin-kutezhi-card.jpg',
  coverAlt: 'Сергей Есенин в дыму кабака — художественная реконструкция',
  coverKind: 'reconstruction',
  coverCredit: 'THE LEGENDARY POET',
};

const mayakovskyPartOneWithLocalCover: Essay = {
  ...mayakovskyPartOne,
  cover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  cardCover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  coverAlt: 'Молодой Владимир Маяковский — художественная реконструкция на основе архивных портретов',
  coverKind: 'reconstruction',
  coverCredit: 'THE LEGENDARY POET',
};

const mayakovskyPartTwoWithLocalCover: Essay = {
  ...mayakovskyPartTwo,
  cover: '/images/essays/mayakovsky/mayakovsky-part-2-hero.webp',
  cardCover: '/images/essays/mayakovsky/mayakovsky-part-2-hero.webp',
  coverAlt: 'Поздний Владимир Маяковский — цифровая реставрация архивного портрета 1928 года',
  coverKind: 'restoration',
  coverCredit: 'Осип Брик · реставрация проекта',
  coverSourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_1928_by_Osip_Brik.jpg',
};

export const essays: Essay[] = [
  yeseninPartOneWithCover,
  yeseninPartTwoWithCover,
  mayakovskyPartOneWithLocalCover,
  mayakovskyPartTwoWithLocalCover,
  brikCaseVisual,
];

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((essay) => essay.slug === slug);
}

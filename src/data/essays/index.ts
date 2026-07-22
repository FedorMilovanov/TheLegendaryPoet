import type { Essay, EssaySource } from '../../types/essay';
import { yeseninKutezhi } from './yeseninKutezhi';
import { mayakovskyPartOne } from './mayakovskyPartOne';
import { mayakovskyPartTwo } from './mayakovskyPartTwoVisual';
import { brikCaseVisual } from './brikCaseVisual';
import {
  brikDocumentSources,
  mayakovskyEarlySources,
  mayakovskyLateSources,
} from './mayakovskySources';
import {
  brikSupplementalSources,
  mayakovskyEarlySupplementalSources,
} from './mayakovskySupplementalSources';

function uniqueSources(sources: EssaySource[] = []): EssaySource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.url
      ? source.url.replace(/^http:/, 'https:').replace(/\/$/, '')
      : `${source.id ?? ''}:${source.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const yeseninWithUniqueSources: Essay = {
  ...yeseninKutezhi,
  sources: uniqueSources(yeseninKutezhi.sources),
};

const mayakovskyPartOneWithLocalCover: Essay = {
  ...mayakovskyPartOne,
  cover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  cardCover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  coverAlt: 'Молодой Владимир Маяковский — художественная реконструкция на основе архивных портретов',
  coverKind: 'reconstruction',
  coverCredit: 'THE LEGENDARY POET',
  sources: [...mayakovskyEarlySources, ...mayakovskyEarlySupplementalSources],
};

const mayakovskyPartTwoWithLocalCover: Essay = {
  ...mayakovskyPartTwo,
  cover: '/images/essays/mayakovsky/mayakovsky-part-2-hero.webp',
  cardCover: '/images/essays/mayakovsky/mayakovsky-part-2-hero.webp',
  coverAlt: 'Поздний Владимир Маяковский — цифровая реставрация архивного портрета 1928 года',
  coverKind: 'restoration',
  coverCredit: 'Осип Брик · реставрация проекта',
  coverSourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_1928_by_Osip_Brik.jpg',
  sources: mayakovskyLateSources,
};

const brikCaseWithSourceLibrary: Essay = {
  ...brikCaseVisual,
  sources: [...brikDocumentSources, ...brikSupplementalSources],
};

export const essays: Essay[] = [
  yeseninWithUniqueSources,
  mayakovskyPartOneWithLocalCover,
  mayakovskyPartTwoWithLocalCover,
  brikCaseWithSourceLibrary,
];

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((essay) => essay.slug === slug);
}

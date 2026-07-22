import type { Essay, EssaySource } from '../../types/essay';
import { yeseninKutezhiVisual } from './yeseninVisual';
import { yeseninArchiveSources } from './yeseninArchiveSources';
import { enrichYeseninSources } from './yeseninSources';
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
import {
  attachEssayCitations,
  brikCitationRules,
  mayakovskyPartOneCitationRules,
  mayakovskyPartTwoCitationRules,
  yeseninCitationRules,
} from './essayCitations';
import {
  brikEssayPlacements,
  mayakovskyPartOnePlacements,
  mayakovskyPartTwoPlacements,
  placeEssayImages,
} from './essayVisualLayout';

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

const yeseninWithArchiveLayer: Essay = {
  ...yeseninKutezhiVisual,
  blocks: attachEssayCitations(yeseninKutezhiVisual.blocks, yeseninCitationRules),
  sources: enrichYeseninSources(
    uniqueSources([
      ...(yeseninKutezhiVisual.sources ?? []),
      ...yeseninArchiveSources,
    ]),
  ),
};

const mayakovskyPartOneWithLocalCover: Essay = {
  ...mayakovskyPartOne,
  cover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  cardCover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  coverAlt: 'Молодой Владимир Маяковский — художественная реконструкция на основе архивных портретов',
  coverKind: 'reconstruction',
  coverCredit: 'THE LEGENDARY POET',
  blocks: placeEssayImages(
    attachEssayCitations(mayakovskyPartOne.blocks, mayakovskyPartOneCitationRules),
    mayakovskyPartOnePlacements,
  ),
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
  blocks: placeEssayImages(
    attachEssayCitations(mayakovskyPartTwo.blocks, mayakovskyPartTwoCitationRules),
    mayakovskyPartTwoPlacements,
  ),
  sources: mayakovskyLateSources,
};

const brikCaseWithSourceLibrary: Essay = {
  ...brikCaseVisual,
  blocks: placeEssayImages(
    attachEssayCitations(brikCaseVisual.blocks, brikCitationRules),
    brikEssayPlacements,
  ),
  sources: [...brikDocumentSources, ...brikSupplementalSources],
};

export const essays: Essay[] = [
  yeseninWithArchiveLayer,
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

import type { Essay, EssaySource } from '../../types/essay';
import { yeseninKutezhiVisual } from './yeseninVisual';
import { yeseninArchiveSources } from './yeseninArchiveSources';
import { yeseninDuncanFirstMeetingPublished } from './yeseninDuncanFirstMeetingPublished';
import { yeseninPartOnePublic } from './yeseninPartOnePublic';
import { mayakovskyPartOne } from './mayakovskyPartOne';
import { mayakovskyPartTwo } from './mayakovskyPartTwoVisual';
import { brikCaseVisual } from './brikCaseVisual';
import { lermontovRoadEssay } from './lermontovRoadEssay';
import {
  brikDocumentSources,
  mayakovskyEarlySources,
  mayakovskyLateSources,
} from './mayakovskySources';
import {
  brikSupplementalSources,
  mayakovskyEarlySupplementalSources,
  mayakovskyLateSupplementalSources,
} from './mayakovskySupplementalSources';
import {
  attachEssayCitations,
  brikCitationRules,
  mayakovskyPartOneCitationRules,
  mayakovskyPartTwoCitationRules,
} from './essayCitations';
import {
  brikEssayPlacements,
  mayakovskyPartOnePlacements,
  mayakovskyPartTwoPlacements,
  placeEssayImages,
} from './essayVisualLayout';
import {
  applyEssayMythChecks,
  mayakovskyPartOneMythRules,
  mayakovskyPartTwoMythRules,
  yeseninPartOneMythRules,
} from './essayMythChecks';
import {
  applyBrikEditorialWave,
  applyMayakovskyPartTwoEditorialWave,
  mayakovskyEditorialWaveSources,
} from './mayakovskyEditorialWave';

function uniqueSources(sources: EssaySource[] = []): EssaySource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const secureUrl = source.url?.startsWith('http:')
      ? `https:${source.url.slice(5)}`
      : source.url;
    const key = secureUrl?.endsWith('/')
      ? secureUrl.slice(0, -1)
      : secureUrl ?? `${source.id ?? ''}:${source.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const lermontovRoadWithCover: Essay = {
  ...lermontovRoadEssay,
  coverKind: 'restoration',
  coverCredit: 'П. Е. Заболотский · цифровая реставрация проекта',
  coverSourceUrl: 'https://commons.wikimedia.org/wiki/File:Mikhail_Lermontov_1837.jpg',
};

const yeseninWithArchiveLayer: Essay = {
  ...yeseninKutezhiVisual,
  coverKind: 'reconstruction',
  coverCredit: 'THE LEGENDARY POET · редакционная реконструкция',
  sources: uniqueSources([
    ...(yeseninKutezhiVisual.sources ?? []),
    ...yeseninArchiveSources,
  ]),
};

const yeseninPartOneWithMythChecks: Essay = {
  ...yeseninPartOnePublic,
  dateModified: '2026-08-02',
  readTime: 43,
  blocks: applyEssayMythChecks(yeseninPartOnePublic.blocks, yeseninPartOneMythRules),
};

const mayakovskyPartOneWithLocalCover: Essay = {
  ...mayakovskyPartOne,
  dateModified: '2026-08-02',
  readTime: 24,
  cover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  cardCover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  coverAlt: 'Молодой Владимир Маяковский — художественная реконструкция на основе архивных портретов',
  coverKind: 'reconstruction',
  coverCredit: 'THE LEGENDARY POET',
  blocks: placeEssayImages(
    applyEssayMythChecks(
      attachEssayCitations(mayakovskyPartOne.blocks, mayakovskyPartOneCitationRules),
      mayakovskyPartOneMythRules,
    ),
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
  blocks: applyMayakovskyPartTwoEditorialWave(
    placeEssayImages(
      attachEssayCitations(
        applyEssayMythChecks(mayakovskyPartTwo.blocks, mayakovskyPartTwoMythRules),
        mayakovskyPartTwoCitationRules,
      ),
      mayakovskyPartTwoPlacements,
    ),
  ),
  sources: uniqueSources([
    ...mayakovskyLateSources,
    ...mayakovskyLateSupplementalSources,
    ...mayakovskyEditorialWaveSources,
  ]),
};

const brikCaseWithSourceLibrary: Essay = {
  ...brikCaseVisual,
  blocks: applyBrikEditorialWave(
    placeEssayImages(
      attachEssayCitations(brikCaseVisual.blocks, brikCitationRules),
      brikEssayPlacements,
    ),
  ),
  sources: uniqueSources([
    ...brikDocumentSources,
    ...brikSupplementalSources,
    ...mayakovskyEditorialWaveSources,
  ]),
};

export const essays: Essay[] = [
  lermontovRoadWithCover,
  yeseninWithArchiveLayer,
  yeseninPartOneWithMythChecks,
  yeseninDuncanFirstMeetingPublished,
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

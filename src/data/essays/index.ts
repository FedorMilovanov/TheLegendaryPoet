import type { Essay, EssaySource } from '../../types/essay';
import { yeseninKutezhiVisual } from './yeseninVisual';
import { yeseninArchiveSources } from './yeseninArchiveSources';
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
} from './essayCitations';
import {
  brikEssayPlacements,
  mayakovskyPartOnePlacements,
  mayakovskyPartTwoPlacements,
  placeEssayImages,
} from './essayVisualLayout';

const museumNarrativeNote =
  'Институциональный мемориальный пересказ: используется для навигации и музейного контекста, но не заменяет исходный документ, академическую публикацию или независимую проверку.';

function normalizeSourceKind(source: EssaySource): EssaySource {
  const url = source.url ?? '';
  const isMayakovskyMuseum = /(?:www\.)?muzeimayakovskogo\.ru/i.test(url);
  const isConcreteCollectionObject = /\/collection\//i.test(url);

  // A museum domain can host both an archival object and a curatorial story.
  // Only concrete collection cards retain archive status automatically. General
  // biographies, virtual exhibitions, histories and interpretive pages are
  // separated from primary/archival evidence even when the institution is
  // authoritative or owns the underlying material.
  if (isMayakovskyMuseum && !isConcreteCollectionObject) {
    return {
      ...source,
      kind: 'institutional',
      note: source.note
        ? `${source.note} ${museumNarrativeNote}`
        : museumNarrativeNote,
    };
  }

  return source;
}

function uniqueSources(sources: EssaySource[] = []): EssaySource[] {
  const seen = new Set<string>();
  return sources.map(normalizeSourceKind).filter((source) => {
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
  sources: uniqueSources([
    ...(yeseninKutezhiVisual.sources ?? []),
    ...yeseninArchiveSources,
  ]),
};

const mayakovskyPartOneWithLocalCover: Essay = {
  ...mayakovskyPartOne,
  cover: '/images/essays/archive/mayakovsky-1914.webp',
  cardCover: '/images/essays/archive/mayakovsky-1914.webp',
  coverAlt: 'Молодой Владимир Маяковский. Архивный портрет, 1914 год',
  coverKind: 'archive',
  coverCredit: 'Wikimedia Commons · 1914',
  coverSourceUrl: 'https://commons.wikimedia.org/wiki/File:Vladimir_Mayakovsky_1914.jpg',
  blocks: placeEssayImages(
    attachEssayCitations(mayakovskyPartOne.blocks, mayakovskyPartOneCitationRules),
    mayakovskyPartOnePlacements,
  ),
  sources: uniqueSources([...mayakovskyEarlySources, ...mayakovskyEarlySupplementalSources]),
};

const mayakovskyPartTwoWithLocalCover: Essay = {
  ...mayakovskyPartTwo,
  cover: '/images/essays/archive/mayakovsky-1928-osip.webp',
  cardCover: '/images/essays/archive/mayakovsky-1928-osip.webp',
  coverAlt: 'Владимир Маяковский. Фотография Осипа Брика, 1928 год',
  coverKind: 'archive',
  coverCredit: 'Осип Брик · 1928',
  coverSourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_1928_by_Osip_Brik.jpg',
  blocks: placeEssayImages(
    attachEssayCitations(mayakovskyPartTwo.blocks, mayakovskyPartTwoCitationRules),
    mayakovskyPartTwoPlacements,
  ),
  sources: uniqueSources(mayakovskyLateSources),
};

const brikCaseWithSourceLibrary: Essay = {
  ...brikCaseVisual,
  blocks: placeEssayImages(
    attachEssayCitations(brikCaseVisual.blocks, brikCitationRules),
    brikEssayPlacements,
  ),
  // Canonical registries come first so their stable ids, evidence kinds, and
  // limitations win over older essay-local cards that happen to reuse a URL.
  // Unique sources authored by the expansion layer are then retained as well.
  sources: uniqueSources([
    ...brikDocumentSources,
    ...brikSupplementalSources,
    ...(brikCaseVisual.sources ?? []),
  ]),
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

import type { Essay, EssaySource } from '../../types/essay';
import { yeseninKutezhiVisual } from './yeseninVisual';
import { yeseninArchiveSources } from './yeseninArchiveSources';
import { yeseninDocumentSources } from './yeseninDocumentSources';
import { mayakovskyPartOne } from './mayakovskyPartOne';
import { mayakovskyPartTwo } from './mayakovskyPartTwoVisual';
import { mayakovskyProEto } from './mayakovskyProEto';
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
  brikCoverageSources,
  mayakovskyEarlyCoverageSources,
  mayakovskyLateCoverageSources,
  mayakovskyProEtoCoverageSources,
} from './mayakovskyCoverageSources';
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

const MAYAKOVSKY_CLUSTER = {
  id: 'mayakovsky-life-texts-archive',
  label: 'Маяковский: жизнь, тексты, архив',
} as const;

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

function normalizedSourceKey(source: EssaySource): string {
  return source.url
    ? source.url.replace(/^http:/, 'https:').replace(/\/$/, '')
    : `${source.id ?? ''}:${source.title}`;
}

function mergeSourceAliases(canonical: EssaySource, duplicate: EssaySource): EssaySource {
  const ids = [
    canonical.id,
    ...(canonical.aliases ?? []),
    duplicate.id,
    ...(duplicate.aliases ?? []),
  ].filter((id): id is string => Boolean(id));
  const canonicalId = canonical.id ?? duplicate.id;
  const aliases = [...new Set(ids)].filter((id) => id !== canonicalId);

  return {
    ...canonical,
    id: canonicalId,
    aliases: aliases.length > 0 ? aliases : undefined,
    // The first registry remains the evidentiary source of truth, while older
    // unclassified cards can still fill genuinely missing display metadata.
    title: canonical.title || duplicate.title,
    url: canonical.url ?? duplicate.url,
    kind: canonical.kind ?? duplicate.kind,
    institution: canonical.institution ?? duplicate.institution,
    year: canonical.year ?? duplicate.year,
    note: canonical.note ?? duplicate.note,
  };
}

/**
 * Deduplicate bibliography rows by normalized URL without orphaning historical
 * inline-citation ids. Every duplicate id becomes an alias of the first,
 * canonical source card, so one URL renders once while all existing citations
 * continue to resolve to the same numbered row.
 */
function uniqueSources(sources: EssaySource[] = []): EssaySource[] {
  const result: EssaySource[] = [];
  const sourceIndex = new Map<string, number>();

  for (const rawSource of sources) {
    const source = normalizeSourceKind(rawSource);
    const key = normalizedSourceKey(source);
    const existingIndex = sourceIndex.get(key);

    if (existingIndex == null) {
      sourceIndex.set(key, result.length);
      result.push(source);
      continue;
    }

    result[existingIndex] = mergeSourceAliases(result[existingIndex], source);
  }

  return result;
}

const yeseninWithArchiveLayer: Essay = {
  ...yeseninKutezhiVisual,
  // The classified documentary registry comes first. When an older essay-local
  // source repeats the same URL, the stricter evidence kind and limitation note
  // therefore win instead of the unclassified legacy card.
  sources: uniqueSources([
    ...yeseninDocumentSources,
    ...(yeseninKutezhiVisual.sources ?? []),
    ...yeseninArchiveSources,
  ]),
};

const mayakovskyPartOneWithLocalCover: Essay = {
  ...mayakovskyPartOne,
  seoTitle: 'Владимир Маяковский до революции: детство, аресты, футуризм и «Облако в штанах»',
  seoDescription: 'Документальная биография Маяковского до 1918 года: Багдади, смерть отца, Бутырка, Бурлюк, футуризм, ранняя поэзия и знакомство с Бриками.',
  seoKeywords: [
    'биография Маяковского',
    'Маяковский до революции',
    'Маяковский футуризм',
    'Маяковский Бутырская тюрьма',
    'Облако в штанах история',
  ],
  cluster: { ...MAYAKOVSKY_CLUSTER, role: 'biography', order: 10 },
  relatedEssayIds: [
    'essay-mayakovsky-gromovoy',
    'essay-brik-case',
    'essay-mayakovsky-pro-eto-separation',
  ],
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
  sources: uniqueSources([
    ...mayakovskyEarlySources,
    ...mayakovskyEarlySupplementalSources,
    ...mayakovskyEarlyCoverageSources,
  ]),
};

const mayakovskyPartTwoWithLocalCover: Essay = {
  ...mayakovskyPartTwo,
  seoTitle: 'Владимир Маяковский после революции: РОСТА, ЛЕФ, «Баня» и последний кризис',
  seoDescription: 'Вторая часть биографии Маяковского: РОСТА, ЛЕФ, поездки, поздняя лирика, выставка 1930 года, «Баня», РАПП и документальная картина финала.',
  seoKeywords: [
    'Маяковский биография 1918 1930',
    'Маяковский РОСТА ЛЕФ',
    'Маяковский Баня',
    'выставка 20 лет работы Маяковского',
    'последние месяцы Маяковского',
  ],
  cluster: { ...MAYAKOVSKY_CLUSTER, role: 'biography', order: 20 },
  relatedEssayIds: [
    'essay-mayakovsky-before-revolution',
    'essay-mayakovsky-pro-eto-separation',
    'essay-brik-case',
  ],
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
  sources: uniqueSources([
    ...mayakovskyLateSources,
    ...(mayakovskyPartTwo.sources ?? []),
    ...mayakovskyLateCoverageSources,
  ]),
};

const mayakovskyProEtoWithSources: Essay = {
  ...mayakovskyProEto,
  sources: uniqueSources([
    ...(mayakovskyProEto.sources ?? []),
    ...mayakovskyProEtoCoverageSources,
  ]),
};

const brikCaseWithSourceLibrary: Essay = {
  ...brikCaseVisual,
  seoTitle: 'Маяковский и Брики: любовь, общий быт, деньги и зависимость по документам',
  seoDescription: 'Маяковский, Лиля и Осип Брики по письмам и архивам: любовь, общий дом, деньги, автомобиль, творческое сотрудничество и поздние спорные версии.',
  seoKeywords: [
    'Маяковский и Брики',
    'Маяковский и Лиля Брик отношения',
    'Осип Брик и Маяковский',
    'Маяковский содержал Бриков',
    'письма Маяковского Лиле Брик',
  ],
  cluster: { ...MAYAKOVSKY_CLUSTER, role: 'investigation', order: 40 },
  relatedEssayIds: [
    'essay-mayakovsky-pro-eto-separation',
    'essay-mayakovsky-gromovoy',
    'essay-mayakovsky-before-revolution',
  ],
  blocks: placeEssayImages(
    attachEssayCitations(brikCaseVisual.blocks, brikCitationRules),
    brikEssayPlacements,
  ),
  sources: uniqueSources([
    ...brikDocumentSources,
    ...(brikCaseVisual.sources ?? []),
    ...brikSupplementalSources,
    ...brikCoverageSources,
  ]),
};

export const essays: Essay[] = [
  yeseninWithArchiveLayer,
  mayakovskyPartOneWithLocalCover,
  mayakovskyPartTwoWithLocalCover,
  mayakovskyProEtoWithSources,
  brikCaseWithSourceLibrary,
];

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((essay) => essay.slug === slug);
}

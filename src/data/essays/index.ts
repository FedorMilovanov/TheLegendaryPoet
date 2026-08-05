import type { Essay, EssaySource } from '../../types/essay';
import { yeseninKutezhiVisual } from './yeseninVisual';
import { yeseninArchiveSources } from './yeseninArchiveSources';
import { yeseninDuncanFirstMeetingPublished } from './yeseninDuncanFirstMeetingPublished';
import { yeseninPartOnePublic } from './yeseninPartOnePublic';
import { yeseninPartTwoPublic } from './yeseninPartTwoPublic';
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
import { publishEssay, publishEssayCatalog } from './publishEssay';

function uniqueSources(sources: readonly EssaySource[] = []): EssaySource[] {
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

const lermontovRoadPublished = publishEssay(lermontovRoadEssay, {
  dateModified: '2026-08-04',
  cover: '/images/essays/lermontov/lermontov-road-hero.webp',
  cardCover: '/images/essays/lermontov/lermontov-road-hero.webp',
  coverAlt:
    'Михаил Лермонтов на одинокой ночной дороге — редакционная кинематографическая реконструкция образного мира стихотворения',
  coverKind: 'reconstruction',
  coverCredit:
    'THE LEGENDARY POET · редакционная реконструкция на основе портретного референса',
});

const yeseninKutezhiPublished = publishEssay(yeseninKutezhiVisual, {
  coverKind: 'reconstruction',
  coverCredit: 'THE LEGENDARY POET · редакционная реконструкция',
  sources: uniqueSources([
    ...(yeseninKutezhiVisual.sources ?? []),
    ...yeseninArchiveSources,
  ]),
});

const yeseninPartOnePublished = publishEssay(yeseninPartOnePublic, {
  dateModified: '2026-08-05',
});

const yeseninDuncanPublished = publishEssay(yeseninDuncanFirstMeetingPublished, {
  dateModified: '2026-08-05',
});

const yeseninPartTwoLedgerUrl =
  'https://github.com/FedorMilovanov/TheLegendaryPoet/blob/main/docs/research/YESENIN_PART_II_PUBLICATION_SOURCE_LEDGER_2026-08.md';

const yeseninPartTwoOfficialUrls: Record<string, string> = {
  'yes2-letopis-t3-k1':
    'https://biblio.imli.ru/index.php/ruslit/527-esenin-s-a/823-letopis-zhizni-i-tvorchestva-s-a-esenina-tom-3',
  'yes2-letopis-t3-k2':
    'https://biblio.imli.ru/index.php/ruslit/527-esenin-s-a/824-letopis-zhizni-i-tvorchestva-s-a-esenina-tom-3-kniga-2',
  'yes2-letopis-t5-k1':
    'https://biblio.imli.ru/index.php/component/abook/book/826-letopis-zhizni-i-tvorchestva-s-a-esenina-tom-5?Itemid=0&catid=527%3Aesenin-s-a',
  'yes2-duncan-russian-days-1929-tu':
    'https://dl.tufts.edu/concern/pdfs/h415pp46s',
};

const yeseninPartTwoPublished = publishEssay(yeseninPartTwoPublic, {
  sources: [
    ...(yeseninPartTwoPublic.sources ?? []).map((source) => {
      const officialUrl = source.id ? yeseninPartTwoOfficialUrls[source.id] : undefined;
      const url = officialUrl ?? source.url;
      return url ? { ...source, url } : { ...source, url: undefined };
    }),
    {
      id: 'yes2-publication-ledger',
      title: 'Как проверялись источники этой части: публичный реестр публикации',
      url: yeseninPartTwoLedgerUrl,
      kind: 'context',
      institution: 'THE LEGENDARY POET',
      note: 'Редакционный реестр: какое печатное издание и какая страница стоят за каждым документом, включая архивные дела без публичного адреса.',
    },
  ],
  blocks: yeseninPartTwoPublic.blocks.map((block) => {
    if (block.type !== 'image' || block.credit?.includes('общественное достояние')) return block;
    return {
      ...block,
      credit: `${block.credit ?? 'Wikimedia Commons'} · общественное достояние`,
    };
  }),
});

const mayakovskyPartOnePublished = publishEssay(mayakovskyPartOne, {
  dateModified: '2026-08-04',
  cover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  cardCover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
  coverAlt:
    'Молодой Владимир Маяковский читает стихи со сцены в жёлто-чёрной футуристической кофте — редакционная реконструкция',
  coverKind: 'reconstruction',
  coverCredit:
    'THE LEGENDARY POET · редакционная реконструкция на основе архивных портретных референсов',
  blocks: placeEssayImages(
    attachEssayCitations(mayakovskyPartOne.blocks, mayakovskyPartOneCitationRules),
    mayakovskyPartOnePlacements,
  ),
  sources: [...mayakovskyEarlySources, ...mayakovskyEarlySupplementalSources],
});

const mayakovskyPartTwoPublished = publishEssay(mayakovskyPartTwo, {
  dateModified: '2026-08-04',
  cover: '/images/essays/mayakovsky/mayakovsky-part-2-hero.webp',
  cardCover: '/images/essays/mayakovsky/mayakovsky-part-2-hero.webp',
  coverAlt:
    'Зрелый Владимир Маяковский в тёмном костюме на фоне города и конструктивистской графики — редакционная реконструкция позднего периода',
  coverKind: 'reconstruction',
  coverCredit:
    'THE LEGENDARY POET · редакционная реконструкция на основе архивных портретных референсов',
  blocks: placeEssayImages(
    attachEssayCitations(mayakovskyPartTwo.blocks, mayakovskyPartTwoCitationRules),
    mayakovskyPartTwoPlacements,
  ),
  sources: mayakovskyLateSources,
});

const brikCasePublished = publishEssay(brikCaseVisual, {
  dateModified: '2026-08-04',
  blocks: placeEssayImages(
    attachEssayCitations(brikCaseVisual.blocks, brikCitationRules),
    brikEssayPlacements,
  ),
  sources: [...brikDocumentSources, ...brikSupplementalSources],
});

export const essays: readonly Essay[] = publishEssayCatalog([
  lermontovRoadPublished,
  yeseninKutezhiPublished,
  yeseninPartOnePublished,
  yeseninPartTwoPublished,
  yeseninDuncanPublished,
  mayakovskyPartOnePublished,
  mayakovskyPartTwoPublished,
  brikCasePublished,
]);

export function getAllEssays(): readonly Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((essay) => essay.slug === slug);
}

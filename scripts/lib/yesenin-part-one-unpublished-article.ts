import type { Essay, EssayBlock, EssaySource } from '../../src/types/essay';
import { yeseninPartOneSources } from '../../src/data/essays/yeseninPartOneSources';
import { yeseninPartOneSourcesPassTwo } from '../../src/data/essays/yeseninPartOneSourcesPassTwo';
import { yeseninPartOneSourcesPassThree } from '../../src/data/essays/yeseninPartOneSourcesPassThree';
import { loadYeseninPartOneCompleteCitationTopology } from './yesenin-part-one-complete-citation-topology';

export const YESENIN_PART_ONE_UNPUBLISHED_ID = 'essay-yesenin-biography-part-one-unpublished' as const;
export const YESENIN_PART_ONE_UNPUBLISHED_SLUG = 'sergei-yesenin-1895-1921-unpublished' as const;

export interface YeseninPartOneInternalEvidence {
  blockId: string;
  sourceOrder: number;
  sectionNumber: number;
  sectionHeading: string;
  subsectionHeading?: string;
  origin: 'authoring-markdown' | 'editorial-override';
  claimIds: readonly string[];
  editorialClaims: readonly string[];
  renderSourceIds: readonly string[];
  supplementalSourceIds: readonly string[];
  researchCheckSourceIds: readonly string[];
  witnessSourceIds: readonly string[];
  acquisitionSourceIds: readonly string[];
  legacySourceTokens: readonly string[];
  sourceCorrections: readonly string[];
  publicationAuthorized: false;
}

export interface YeseninPartOneUnpublishedArticlePackage {
  status: 'unpublished-typed-article';
  publicationAuthorized: false;
  registrationAuthorized: false;
  mediaPublicationAuthorized: false;
  bibliographyPolicy: 'canonical-only-rendering';
  internalEvidencePolicy: 'supplemental-research-witness-acquisition-held-outside-public-bibliography';
  essay: Essay;
  evidenceByBlockId: Readonly<Record<string, YeseninPartOneInternalEvidence>>;
}

const canonicalSourceRecords = [
  ...yeseninPartOneSources,
  ...yeseninPartOneSourcesPassTwo,
  ...yeseninPartOneSourcesPassThree,
];

const allCanonicalSources: EssaySource[] = canonicalSourceRecords.map(
  (source): EssaySource => ({
    id: source.id,
    aliases: 'aliases' in source ? [...source.aliases] : undefined,
    title: source.title,
    url: source.url,
    kind: source.kind,
    institution: source.institution,
    year: source.year,
    note: source.note,
  }),
);

const sectionAnchor = (sectionNumber: number) =>
  `yesenin-part-one-section-${String(sectionNumber).padStart(2, '0')}`;

const withRenderSources = (block: EssayBlock, sourceIds: readonly string[]): EssayBlock =>
  sourceIds.length > 0 ? ({ ...block, sourceIds: [...sourceIds] } as EssayBlock) : block;

export function buildYeseninPartOneUnpublishedArticle(
  root = process.cwd(),
): YeseninPartOneUnpublishedArticlePackage {
  const topology = loadYeseninPartOneCompleteCitationTopology(root);
  const referencedCanonicalSourceIds = new Set(
    topology.nodes.flatMap((node) => node.canonicalSourceIds),
  );
  const canonicalSources = allCanonicalSources.filter(
    (source) => source.id && referencedCanonicalSourceIds.has(source.id),
  );

  const blocks: EssayBlock[] = [];
  const evidenceEntries: Array<[string, YeseninPartOneInternalEvidence]> = [];
  let renderedSection: number | null = null;
  let leadRendered = false;

  for (const node of topology.nodes) {
    if (node.sectionNumber > 0 && node.sectionNumber !== renderedSection) {
      renderedSection = node.sectionNumber;
      blocks.push({
        id: `yesenin-p1-section-${String(node.sectionNumber).padStart(2, '0')}`,
        type: 'section',
        heading: node.sectionHeading,
        anchor: sectionAnchor(node.sectionNumber),
      });
    }

    let authoredBlock: EssayBlock;
    if (node.origin === 'editorial-override') {
      authoredBlock = {
        id: node.blockId,
        type: 'note',
        text: node.text,
      };
    } else if (node.sectionNumber === 0 && !leadRendered) {
      leadRendered = true;
      authoredBlock = {
        id: node.blockId,
        type: 'lead',
        text: node.text,
      };
    } else {
      authoredBlock = {
        id: node.blockId,
        type: 'paragraph',
        text: node.text,
      };
    }

    blocks.push(withRenderSources(authoredBlock, node.canonicalSourceIds));
    evidenceEntries.push([
      node.blockId,
      {
        blockId: node.blockId,
        sourceOrder: node.sourceOrder,
        sectionNumber: node.sectionNumber,
        sectionHeading: node.sectionHeading,
        subsectionHeading: node.subsectionHeading,
        origin: node.origin,
        claimIds: [...node.claimIds],
        editorialClaims: [...node.editorialClaims],
        renderSourceIds: [...node.canonicalSourceIds],
        supplementalSourceIds: [...node.supplementalSourceIds],
        researchCheckSourceIds: [...node.researchCheckSourceIds],
        witnessSourceIds: [...node.witnessSourceIds],
        acquisitionSourceIds: [...node.acquisitionSourceIds],
        legacySourceTokens: [...node.legacySourceTokens],
        sourceCorrections: [...node.sourceCorrections],
        publicationAuthorized: false,
      },
    ]);
  }

  const wordCount = topology.nodes.reduce(
    (total, node) => total + node.text.split(/\s+/u).filter(Boolean).length,
    0,
  );

  const essay: Essay = {
    id: YESENIN_PART_ONE_UNPUBLISHED_ID,
    slug: YESENIN_PART_ONE_UNPUBLISHED_SLUG,
    kicker: 'Большая биография · часть I · редакционный черновик',
    title: 'Сергей Есенин. Часть I: 1895–1921',
    subtitle:
      'От Константинова и Спас-Клепиков до имажинизма, «Исповеди хулигана» и встречи с Айседорой Дункан.',
    excerpt:
      'Непубличный документальный черновик первой части биографии Сергея Есенина с типизированными блоками, читательскими ссылками и отдельным внутренним evidence-слоем.',
    seoTitle: 'Сергей Есенин: биография 1895–1921 — непубличный редакционный черновик',
    seoDescription:
      'Внутренний typed-черновик биографии Есенина: детство, Спас-Клепики, Москва, Блок, Клюев, Радуница, поезд № 143, Зинаида Райх, религиозно-революционные поэмы, имажинизм и Дункан.',
    seoKeywords: [
      'Сергей Есенин биография',
      'Есенин 1895 1921',
      'Есенин и Блок',
      'Есенин и Клюев',
      'Есенин и Зинаида Райх',
      'Есенин и Айседора Дункан',
    ],
    author: 'Редакция THE LEGENDARY POET',
    date: '2026-07-24',
    readTime: Math.max(18, Math.ceil(wordCount / 180)),
    cover: '/images/essays/archive/yesenin-1914.webp',
    cardCover: '/images/essays/archive/yesenin-1914.webp',
    coverAlt: 'Сергей Есенин. Архивный портрет 1914 года; медиа остаётся на редакционном HOLD',
    coverKind: 'archive',
    coverCredit: 'Редакционный placeholder · публикация изображения не разрешена',
    accent: '#d7b26d',
    tags: ['Сергей Есенин', 'Биография', 'Серебряный век', 'Часть I', 'Непубличный черновик'],
    poetId: 'sergei-yesenin',
    series: { id: 'sergei-yesenin-biography', label: 'Сергей Есенин', part: 1, total: 2 },
    blocks,
    sources: canonicalSources,
  };

  return {
    status: 'unpublished-typed-article',
    publicationAuthorized: false,
    registrationAuthorized: false,
    mediaPublicationAuthorized: false,
    bibliographyPolicy: 'canonical-only-rendering',
    internalEvidencePolicy:
      'supplemental-research-witness-acquisition-held-outside-public-bibliography',
    essay,
    evidenceByBlockId: Object.fromEntries(evidenceEntries),
  };
}

export const yeseninPartOneUnpublishedArticle = buildYeseninPartOneUnpublishedArticle();

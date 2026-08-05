import type { Essay, EssayBlock, EssayImageKind } from '../../types/essay';

type VerifiedMediaRecord = {
  id: string;
  matchSourceUrl: string;
  matchKind: EssayImageKind;
  alt: string;
  caption: string;
  credit: string;
  sourceUrl: string;
};

/**
 * Reader-facing metadata that has passed an independent provenance decision.
 *
 * The original Commons URL remains preserved in the research ledger together
 * with hashes and public-domain rationale. The published source link points to
 * the independent institutional witness that establishes the caption.
 */
export const verifiedEssayMediaRecords: readonly VerifiedMediaRecord[] = [
  {
    id: 'mayakovsky-1914',
    matchSourceUrl: 'https://commons.wikimedia.org/wiki/File:Vladimir_Mayakovsky_1914.jpg',
    matchKind: 'archive',
    alt: 'Футурист Владимир Маяковский в цилиндре, Казань, 1914 год',
    caption: 'Футурист Владимир Маяковский. Казань, 1914.',
    credit: 'Неизвестный фотограф · Государственный музей В. В. Маяковского',
    sourceUrl: 'https://russiainphoto.ru/photos/248776/',
  },
  {
    id: 'mayakovsky-1928-osip',
    matchSourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_1928_by_Osip_Brik.jpg',
    matchKind: 'archive',
    alt: 'Портрет Владимира Маяковского, фотограф Осип Брик, 1928 год',
    caption: 'Владимир Маяковский. Фотография Осипа Брика, 1928.',
    credit: 'Осип Брик · Российская государственная библиотека',
    sourceUrl: 'https://dlib.rsl.ru/viewer/01005408111#?page=5',
  },
] as const;

function matchesOriginal(block: Extract<EssayBlock, { type: 'image' }>, record: VerifiedMediaRecord) {
  return block.kind === record.matchKind && block.sourceUrl === record.matchSourceUrl;
}

function matchesPublished(block: Extract<EssayBlock, { type: 'image' }>, record: VerifiedMediaRecord) {
  return block.kind === record.matchKind
    && block.sourceUrl === record.sourceUrl
    && block.alt === record.alt
    && block.caption === record.caption
    && block.credit === record.credit;
}

export function applyVerifiedEssayMedia(blocks: readonly EssayBlock[]): EssayBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'image') return block;
    const record = verifiedEssayMediaRecords.find((candidate) => matchesOriginal(block, candidate));
    if (!record) return block;
    return {
      ...block,
      alt: record.alt,
      caption: record.caption,
      credit: record.credit,
      sourceUrl: record.sourceUrl,
    };
  });
}

/**
 * A registry entry is not allowed to become decorative dead data. Every
 * verified decision must resolve exactly one published archive block, and the
 * weaker pre-verification source/caption combination must no longer survive.
 */
export function assertVerifiedEssayMediaCoverage(essays: readonly Essay[]) {
  const imageBlocks = essays.flatMap((essay) => essay.blocks)
    .filter((block): block is Extract<EssayBlock, { type: 'image' }> => block.type === 'image');
  const ids = new Set<string>();
  const matchSignatures = new Set<string>();

  for (const record of verifiedEssayMediaRecords) {
    if (ids.has(record.id)) throw new Error(`duplicate verified media id: ${record.id}`);
    ids.add(record.id);

    const signature = `${record.matchKind}:${record.matchSourceUrl}`;
    if (matchSignatures.has(signature)) throw new Error(`duplicate verified media match: ${signature}`);
    matchSignatures.add(signature);

    if (!record.sourceUrl.startsWith('https://')) {
      throw new Error(`verified media source must use https: ${record.id}`);
    }

    const publishedMatches = imageBlocks.filter((block) => matchesPublished(block, record));
    if (publishedMatches.length !== 1) {
      throw new Error(`verified media ${record.id} must resolve exactly one published image; found ${publishedMatches.length}`);
    }

    const staleMatches = imageBlocks.filter((block) => matchesOriginal(block, record));
    if (staleMatches.length !== 0) {
      throw new Error(`verified media ${record.id} still exposes its weaker pre-verification metadata`);
    }
  }
}

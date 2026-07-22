import type { EssayBlock, EssayImagePlacement } from '../../types/essay';

export interface PlacementRule {
  /** Stable key from the generated media manifest. Never match presentation rules by a remote URL. */
  mediaKey: string;
  placement: EssayImagePlacement;
}

export function placeEssayImages(
  blocks: EssayBlock[],
  rules: PlacementRule[],
): EssayBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'image' || !block.mediaKey) return block;
    const rule = rules.find(({ mediaKey }) => block.mediaKey === mediaKey);
    return rule ? { ...block, placement: rule.placement } : block;
  });
}

/** One portrait per movement enters the prose column; group scenes stay full-width. */
export const mayakovskyPartOnePlacements: PlacementRule[] = [
  { mediaKey: 'mayakovsky-family-1905', placement: 'right' },
  { mediaKey: 'mayakovsky-registration-1908', placement: 'left' },
  { mediaKey: 'mayakovsky-1910', placement: 'right' },
  { mediaKey: 'mayakovsky-1914', placement: 'left' },
];

export const mayakovskyPartTwoPlacements: PlacementRule[] = [
  { mediaKey: 'mayakovsky-lilya-crimea-1926', placement: 'right' },
  { mediaKey: 'mayakovsky-shaving-1927', placement: 'left' },
];

export const brikEssayPlacements: PlacementRule[] = [
  { mediaKey: 'briks-honeymoon-1912', placement: 'left' },
  { mediaKey: 'osip-brik-1928', placement: 'right' },
  { mediaKey: 'lilya-editing-1928', placement: 'left' },
  { mediaKey: 'mayakovsky-lilya-crimea-1926', placement: 'right' },
];

import type { EssayBlock, EssayImagePlacement } from '../../types/essay';

interface PlacementRule {
  imageId: string;
  placement: EssayImagePlacement;
}

export function placeEssayImages(
  blocks: EssayBlock[],
  rules: PlacementRule[],
): EssayBlock[] {
  const blockIds = new Set(blocks.flatMap((block) => (block.id ? [block.id] : [])));
  for (const rule of rules) {
    if (!blockIds.has(rule.imageId)) {
      throw new Error(`Image placement points to missing essay block: ${rule.imageId}`);
    }
  }

  return blocks.map((block) => {
    if (block.type !== 'image') return block;
    const rule = rules.find(({ imageId }) => block.id === imageId);
    return rule ? { ...block, placement: rule.placement } : block;
  });
}

export const mayakovskyPartOnePlacements: PlacementRule[] = [
  { imageId: 'image-family-1905', placement: 'right' },
  { imageId: 'image-reg-card-1908', placement: 'left' },
  { imageId: 'image-student-1910', placement: 'right' },
  { imageId: 'image-mayakovsky-1914', placement: 'left' },
];

export const mayakovskyPartTwoPlacements: PlacementRule[] = [
  { imageId: 'image-crimea-1926', placement: 'right' },
  { imageId: 'image-shaving-1927', placement: 'left' },
];

export const brikEssayPlacements: PlacementRule[] = [
  { imageId: 'image-briks-honeymoon-1912', placement: 'left' },
  { imageId: 'image-osip-1928', placement: 'right' },
  { imageId: 'image-lilya-editing-1928', placement: 'left' },
  { imageId: 'image-brik-crimea-1926', placement: 'right' },
];

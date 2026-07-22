import type { EssayBlock, EssayImagePlacement } from '../../types/essay';

interface PlacementRule {
  srcIncludes: string;
  placement: EssayImagePlacement;
}

export function placeEssayImages(
  blocks: EssayBlock[],
  rules: PlacementRule[],
): EssayBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'image') return block;
    const rule = rules.find(({ srcIncludes }) => block.src.includes(srcIncludes));
    return rule ? { ...block, placement: rule.placement } : block;
  });
}

/** One portrait per movement enters the prose column; group scenes stay full-width. */
export const mayakovskyPartOnePlacements: PlacementRule[] = [
  { srcIncludes: 'Mayakovsky-SN-001.jpg', placement: 'right' },
  { srcIncludes: 'Mayakovsky_Reg_card.jpg', placement: 'left' },
  { srcIncludes: 'Mayakovsky_1910.jpg', placement: 'right' },
  { srcIncludes: 'Vladimir_Mayakovsky_1914.jpg', placement: 'left' },
];

export const mayakovskyPartTwoPlacements: PlacementRule[] = [
  { srcIncludes: 'Mayakovsky_Brik_Crimea_1926.jpg', placement: 'right' },
  { srcIncludes: '1927._Владимир_Маяковский_бреется.jpg', placement: 'left' },
];

export const brikEssayPlacements: PlacementRule[] = [
  { srcIncludes: 'Osip_LUB.jpg', placement: 'left' },
  { srcIncludes: 'Osip_Brik.jpg', placement: 'right' },
  { srcIncludes: '1928_LYuB_editing_film.jpg', placement: 'left' },
  { srcIncludes: 'Mayakovsky_Brik_Crimea_1926.jpg', placement: 'right' },
];

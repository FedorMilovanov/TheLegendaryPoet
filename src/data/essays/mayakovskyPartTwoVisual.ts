import type { Essay } from '../../types/essay';
import { mayakovskyPartTwo as mayakovskyPartTwoContent } from './mayakovskyPartTwoVisualContent';

/**
 * Provenance-safe wrapper around the authored Part II documentary layout.
 * Archival metadata corrections are attached by stable media key.
 */
export const mayakovskyPartTwo: Essay = {
  ...mayakovskyPartTwoContent,
  blocks: mayakovskyPartTwoContent.blocks.map((block) => {
    if (block.type !== 'image' || block.mediaKey !== 'mayakovsky-1928-osip') return block;

    return {
      ...block,
      alt: 'Портрет Владимира Маяковского, фотограф Осип Брик, 1928 год',
      caption: 'Владимир Маяковский. Фотография Осипа Брика, 1928.',
      credit: 'Осип Брик · Российская государственная библиотека',
      sourceUrl: 'https://dlib.rsl.ru/viewer/01005408111#?page=5',
    };
  }),
};

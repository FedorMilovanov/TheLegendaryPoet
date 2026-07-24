import type { Essay } from '../../types/essay';
import { mayakovskyPartOne as mayakovskyPartOneContent } from './mayakovskyPartOneContent';

/**
 * Provenance-safe wrapper around the authored Part I blocks.
 *
 * The longform prose remains isolated in `mayakovskyPartOneContent.ts`. Verified
 * archival metadata is applied here by stable media key, so a caption/source
 * correction never requires duplicating or matching prose text.
 */
export const mayakovskyPartOne: Essay = {
  ...mayakovskyPartOneContent,
  blocks: mayakovskyPartOneContent.blocks.map((block) => {
    if (block.type !== 'image' || block.mediaKey !== 'mayakovsky-1914') return block;

    return {
      ...block,
      alt: 'Футурист Владимир Маяковский в цилиндре, Казань, 1914 год',
      caption: 'Футурист Владимир Маяковский. Казань, 1914.',
      credit: 'Неизвестный фотограф · Государственный музей В. В. Маяковского',
      sourceUrl: 'https://russiainphoto.ru/photos/248776/',
    };
  }),
};

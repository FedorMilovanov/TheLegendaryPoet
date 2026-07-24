import type { Essay } from '../../types/essay';
import { essays as essayContent } from './indexContent';

/**
 * Canonical essay registry with evidence-backed metadata overlays.
 *
 * `indexContent.ts` retains the source/citation/series assembly. This wrapper
 * applies archival corrections by stable essay identity, keeping provenance
 * changes separate from the large registry implementation.
 */
export const essays: Essay[] = essayContent.map((essay) => {
  if (essay.id === 'essay-mayakovsky-before-revolution') {
    return {
      ...essay,
      coverAlt: 'Футурист Владимир Маяковский в цилиндре. Казань, 1914 год',
      coverCredit: 'Неизвестный фотограф · Государственный музей В. В. Маяковского',
      coverSourceUrl: 'https://russiainphoto.ru/photos/248776/',
    };
  }

  if (essay.id === 'essay-mayakovsky-gromovoy') {
    return {
      ...essay,
      coverAlt: 'Портрет Владимира Маяковского. Фотография Осипа Брика, 1928 год',
      coverCredit: 'Осип Брик · Российская государственная библиотека',
      coverSourceUrl: 'https://dlib.rsl.ru/viewer/01005408111#?page=5',
    };
  }

  return essay;
});

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((essay) => essay.slug === slug);
}

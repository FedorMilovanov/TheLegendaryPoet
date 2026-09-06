import type { EssayBlock } from '../../types/essay';
import { benislavskayaDraft } from './benislavskayaDraft';
import { publishEssay } from './publishEssay';

const publicationBoundaryText =
  'Состав переписки в разных источниках остаётся неодинаковым, и это различие нельзя сводить арифметически. Прямой снимок с. 411 книги П. Ф. Юшина 1969 года подтверждает старый архивно-библиографический ряд и позиции под датами 18 января, 8 февраля, 30 ноября, 29 декабря 1924 года и 12 апреля 1925 года. Поздние академические и издательские слои дают иной 13/14-позиционный горизонт и фиксируют случаи пересмотра датировок. Поэтому эти старые даты здесь не используются как доказательство пяти самостоятельных писем в современном каноническом составе: нерешённая идентичность отдельных объектов сохраняется как открытая текстологическая проблема и не усиливает читательские утверждения статьи.';

let replacedBoundaryCount = 0;
const publicationBlocks = benislavskayaDraft.blocks.map((block): EssayBlock => {
  if (
    block.type === 'note'
    && block.variant !== 'myth'
    && block.text.startsWith('Публикационный gate остаётся честно открытым.')
  ) {
    replacedBoundaryCount += 1;
    return {
      ...block,
      text: publicationBoundaryText,
      sourceIds: [
        'ben-yushin-bibliography',
        'ben-pss-index',
        'ben-1995-book',
        'ben-letopis-t5-k1',
      ],
    };
  }

  return block;
});

if (replacedBoundaryCount !== 1) {
  throw new Error(`Benislavskaya publication boundary replacement drifted: ${replacedBoundaryCount}`);
}

export const benislavskayaPublished = publishEssay(benislavskayaDraft, {
  kicker: 'Документальное исследование',
  date: '2026-09-06',
  blocks: publicationBlocks,
});

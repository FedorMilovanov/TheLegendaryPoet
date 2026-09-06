import type { EssayBlock, EssaySource } from '../../types/essay';
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

const publicationSources = (benislavskayaDraft.sources ?? []).map((source): EssaySource => {
  if (source.id === 'ben-yushin-bibliography') {
    return {
      ...source,
      title: 'П. Ф. Юшин. «Сергей Есенин: Идейно-творческая эволюция» (1969): архивно-библиографический ряд',
      note:
        'Прямой бесплатный holder readback РОУНБ от 06.09.2026 подтверждает на печатной с. 411 позиции #121–#134 под заголовком архивных документов, включая старые даты 18.01, 08.02, 30.11, 29.12.1924 и 12.04.1925. Эти записи используются как свидетельство раннего библиографического слоя, а не как автоматически канонические современные датировки.',
    };
  }

  if (source.id === 'ben-1995-book') {
    return {
      ...source,
      note:
        'Поздний издательский контроль: прямой holder readback Пермской библиотеки фиксирует 13-письменный горизонт, начало письма 4 марта на с. 234–235, 6 апреля на с. 236, 26 апреля на с. 238 и финальный майский материал до с. 281. Отсутствие старых заголовков 18 января / 8 февраля в этом слое трактуется как редакционно-датировочное различие, а не как доказательство несуществования ранних записей. Полный платный скан для v1 не требуется и не заказывается.',
    };
  }

  return source;
});

export const benislavskayaPublished = publishEssay(benislavskayaDraft, {
  kicker: 'Документальное исследование',
  date: '2026-09-06',
  blocks: publicationBlocks,
  sources: publicationSources,
});

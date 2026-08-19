import type { EssayBlock } from '../../types/essay';
import { publishEssay } from './publishEssay';
import { simonovSonArtilleristaDraft } from './simonovSonArtilleristaDraft';

const PUBLIC_VISUAL_SOURCE_IDS = new Set(['mustatunturi-commons', 'simonov-1943-commons']);

function polishForPublication(block: EssayBlock): EssayBlock {
  if (
    block.type === 'paragraph'
    && block.text.startsWith('Лоскутов отправился не один. С ним шли два разведчика и радиостанция;')
  ) {
    return {
      ...block,
      text: block.text.replace(
        'Лоскутов отправился не один. С ним шли два разведчика и радиостанция;',
        'Лоскутов отправился не один. Он шёл с двумя разведчиками и радиостанцией;',
      ),
    };
  }

  if (
    block.type === 'note'
    && block.variant === 'editorial'
    && block.text.includes('рекламной формулой')
  ) {
    return {
      ...block,
      text: block.text.replace('рекламной формулой', 'публицистической формулой'),
    };
  }

  if (
    block.type === 'note'
    && block.variant === 'editorial'
    && block.text.startsWith('Визуальный слой публикации также разделён по происхождению.')
  ) {
    return {
      type: 'note',
      variant: 'editorial',
      text:
        'Обложка этой публикации — редакционная художественная реконструкция. Она не является документальной фотографией Ивана Лоскутова, конкретной высоты или боя 1941 года.',
    };
  }

  return block;
}

export const simonovSonArtilleristaPublished = publishEssay(simonovSonArtilleristaDraft, {
  dateModified: '2026-08-19',
  excerpt:
    'За Лёнькой стоял реальный артиллерийский разведчик Иван Лоскутов. Он корректировал огонь из опасного передового пункта и, когда высоту окружили, потребовал открыть огонь прямо по занимаемой высоте. Свидетельство самого Лоскутова позволяет увидеть, где заканчивается документ и начинается художественное решение Симонова.',
  blocks: simonovSonArtilleristaDraft.blocks.map(polishForPublication),
  sources: (simonovSonArtilleristaDraft.sources ?? []).filter(
    (source) => !source.id || !PUBLIC_VISUAL_SOURCE_IDS.has(source.id),
  ),
});

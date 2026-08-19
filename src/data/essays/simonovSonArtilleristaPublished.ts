import type { EssayBlock, EssaySource } from '../../types/essay';
import { publishEssay } from './publishEssay';
import { simonovSonArtilleristaDraft } from './simonovSonArtilleristaDraft';

const PUBLIC_VISUAL_SOURCE_IDS = new Set(['mustatunturi-commons', 'simonov-1943-commons']);

function polishForPublication(block: EssayBlock): EssayBlock {
  if (
    block.type === 'paragraph'
    && block.text.startsWith('Реальным участником был Иван Алексеевич Лоскутов.')
  ) {
    return {
      ...block,
      text: block.text.replace(
        'Отдельно восстановлен точный locator наградного объекта `10800112`,',
        'Отдельно установлен точный архивный указатель наградного объекта `10800112`,',
      ),
    };
  }

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
    block.type === 'paragraph'
    && block.text.startsWith('РГБ фиксирует отдельное воениздатовское издание уже 1941 годом')
  ) {
    return {
      ...block,
      text: block.text.replace(
        'Exact PDF этого выпуска редакция получила и визуально сверила:',
        'Полный файл этого выпуска редакция получила и визуально сверила:',
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
    && block.text.startsWith('Саму полосу «Патриота Родины» от 3 декабря редакция ещё не просмотрела')
  ) {
    return {
      ...block,
      text:
        'Саму полосу «Патриота Родины» от 3 декабря редакция ещё не просмотрела, поэтому не превращает эту дату в безоговорочно доказанную «самую первую» публикацию. Для «Красной звезды» ситуация иная: точный выпуск № 288 и его печатная страница 3 уже визуально проверены — видны шесть колонок, конец текста и отсутствие продолжения на странице 4. Открытыми остаются лишь вопросы происхождения отдельных цифровых копий и прав на повторное использование газетного факсимиле.',
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

function polishSourceForPublication(source: EssaySource): EssaySource {
  switch (source.id) {
    case 'simonov-diary-neb':
      return {
        ...source,
        note: 'Авторская ретроспектива 1941 года; библиографическая опора для дневниковой книги.',
      };
    case 'loskutov-award-locator':
      return {
        ...source,
        note: 'Архивный указатель: ЦАМО, ф. 33, оп. 682524, д. 34, л. 246–247. Сам лист редакцией ещё не просмотрен; точные числа из вторичных транскрипций не рассматриваются как непосредственно подтверждённые архивным документом.',
      };
    case 'red-star-direct-288':
      return {
        ...source,
        title: '«Красная звезда» №288 (5043), 7 декабря 1941 года — факсимиле полного выпуска',
        note: 'Полный выпуск получен в PDF и визуально проверен: на печатной странице 3 «Сын артиллериста» занимает шесть колонок, имеет подзаголовок «(Фронтовая поэма)» и заканчивается подписью «К. СИМОНОВ. / СЕВЕРНЫЙ ФРОНТ.». На странице 4 продолжения нет. Размер проверенного файла — 6 506 121 байт; SHA-256: 9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229. Происхождение отдельных цифровых копий и права на повторное использование факсимиле проверяются отдельно.',
      };
    case 'red-star-page3-kolobov':
      return {
        ...source,
        note: 'Примечание 39 независимо локализует публикацию: «Красная звезда». 1941. 7 декабря. С. 3. Последующая прямая проверка полного выпуска №288 подтвердила страницу, шесть колонок и границы публикации.',
      };
    case 'arhlib-date-conflict':
      return {
        ...source,
        note: 'Указывает 3 ноября 1941 года; сохраняется как свидетельство расхождения, но дата несовместима с авторской хронологией создания поэмы в конце ноября.',
      };
    default:
      return source;
  }
}

export const simonovSonArtilleristaPublished = publishEssay(simonovSonArtilleristaDraft, {
  dateModified: '2026-08-19',
  excerpt:
    'За Лёнькой стоял реальный артиллерийский разведчик Иван Лоскутов. Он корректировал огонь из опасного передового пункта и, когда высоту окружили, потребовал открыть огонь прямо по занимаемой высоте. Свидетельство самого Лоскутова позволяет увидеть, где заканчивается документ и начинается художественное решение Симонова.',
  tags: [...simonovSonArtilleristaDraft.tags, 'документальное исследование'],
  blocks: simonovSonArtilleristaDraft.blocks.map(polishForPublication),
  sources: (simonovSonArtilleristaDraft.sources ?? [])
    .filter((source) => !source.id || !PUBLIC_VISUAL_SOURCE_IDS.has(source.id))
    .map(polishSourceForPublication),
});

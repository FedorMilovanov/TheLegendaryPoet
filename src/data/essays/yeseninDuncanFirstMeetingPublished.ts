import type { Essay, EssayBlock } from '../../types/essay';
import { yeseninDuncanFirstMeeting as editorialDraft } from './yeseninDuncanFirstMeeting';

const mistakenPredestinationClause = 'а его трагический финал — предрешён';
const correctedOpenHorizonClause = 'а его трагический финал ещё не был предрешён';

const correctedBlocks: EssayBlock[] = editorialDraft.blocks.map((block) => {
  if (!('text' in block) || !block.text.includes(mistakenPredestinationClause)) return block;
  return {
    ...block,
    text: block.text.replace(mistakenPredestinationClause, correctedOpenHorizonClause),
  } as EssayBlock;
});

const blocks = correctedBlocks.flatMap<EssayBlock>((block) => {
  if (
    block.type === 'note' &&
    block.text.includes('точная дата первой встречи неизвестна')
  ) {
    return [
      block,
      {
        type: 'note',
        variant: 'myth',
        claim: 'Есенин и Дункан познакомились точно 3 октября 1921 года — это бесспорная документальная дата',
        verdict: 'unproven',
        origin: 'краткие хронологии и популярные биографии, которые убирают осторожное слово «видимо» из полного академического комментария',
        text: 'Именной указатель ПСС действительно называет **3 октября 1921 года**. Но развёрнутый академический комментарий формулирует осторожнее: «познакомились, видимо, 3 октября». Другие мемуарные линии помещают встречу ближе к началу ноября. Поэтому 3 октября остаётся принятой и вероятной датой, но не синхронно засвидетельствованным бесспорным днём.',
        sourceIds: [
          'yd1-pss-duncan-chronology',
          'yd1-mcvay-isadora-yesenin',
          'ye1-schneider-memoir-commentary',
        ],
      },
    ];
  }

  if (
    block.type === 'paragraph' &&
    block.text.includes('Самая известная последовательность слов')
  ) {
    return [
      block,
      {
        type: 'note',
        variant: 'myth',
        claim: 'Слова «золотая голова — ангел — чёрт» являются точной стенограммой первой встречи',
        verdict: 'unproven',
        origin: 'мемуарная сцена Анатолия Мариенгофа, позднее многократно пересказанная без указания автора и жанра свидетельства',
        text: 'Эта последовательность может сохранять реальный эпизод, но известна прежде всего из позднего литературно выстроенного воспоминания Мариенгофа. Синхронной записи разговора нет, а соединять мемуарную реплику, жесты и точное время в готовый протокол нельзя. Честная формула называет свидетеля: **по воспоминанию Мариенгофа**, Дункан произнесла эти русские слова.',
        sourceIds: ['ye1-mariengof-memoir', 'yd1-mcvay-isadora-yesenin'],
      },
    ];
  }

  return [block];
});

export const yeseninDuncanFirstMeetingPublished: Essay = {
  ...editorialDraft,
  dateModified: '2026-08-02',
  readTime: 21,
  blocks,
};

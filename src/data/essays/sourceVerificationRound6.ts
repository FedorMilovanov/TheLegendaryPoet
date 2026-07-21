import type { Essay, EssayBlock, EssaySource } from '../../types/essay';

function replaceParagraph(block: EssayBlock, needle: string, text: string): EssayBlock {
  if (block.type === 'paragraph' && block.text.includes(needle)) {
    return { ...block, text };
  }
  return block;
}

function appendSources(essay: Essay, additions: EssaySource[]): EssaySource[] {
  const existing = essay.sources ?? [];
  const seen = new Set(existing.map((source) => source.url ?? source.title));
  return [
    ...existing,
    ...additions.filter((source) => {
      const key = source.url ?? source.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ];
}

function patchYesenin(essay: Essay): Essay {
  const blocks = essay.blocks.map((initialBlock) => {
    let block = initialBlock;

    block = replaceParagraph(
      block,
      'Важно понять, что эта слава не свалилась на Есенина извне',
      'Дурная слава не свалилась на Есенина только извне. В 1919 году он вошёл в группу имажинистов, которая сознательно делала публичный скандал частью литературной борьбы. В собственной автобиографии Есенин вспоминал, что они переименовывали улицы в свои имена и расписывали Страстной монастырь стихами; документальная летопись датирует роспись стен ночью с 27 на 28 мая 1919 года. Позднее у группы появилось кафе «Стойло Пегаса». Академическое собрание публикует 52 счёта за сентябрь—ноябрь 1923 года с подписью Есенина и прямо объясняет его скидки и получение денег статусом совладельца. Это не доказывает, что каждый скандал был рассчитанной рекламой, но показывает: эпатаж, кафе и литературный образ хулигана были не только чужой молвой, а частью выбранной им публичной среды.',
    );

    block = replaceParagraph(
      block,
      'Ответ нельзя свести ни к одному «сам захотел»',
      'Ответ нельзя свести ни к одному «сам захотел» и ни к одной болезни. Ранний скандализм был сознательной литературной стратегией: стены Страстного монастыря, самовольное переименование улиц, афиши, публичные выступления и собственное кафе создавали узнаваемый образ группы. Есенин понимал рекламную цену дурной славы, но со временем выбранная роль перестала быть только ролью. Алкогольная зависимость, окружение, слава и внутренний кризис сделали артистическую маску реальным образом жизни. В этом и заключался самообман: человек ещё считал, что пользуется скандалом, когда скандал уже пользовался им.',
    );

    return block;
  });

  return {
    ...essay,
    blocks,
    sources: appendSources(essay, [
      {
        title: 'Подписи С. А. Есенина на 52 счетах кафе «Стойло Пегаса», сентябрь—ноябрь 1923 года — ПСС / ФЭБ',
        url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-5092.htm?cmd=p',
      },
      {
        title: 'Комментарии к деловым бумагам «Стойла Пегаса» и статусу Есенина как совладельца — ПСС / ФЭБ',
        url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p',
      },
      {
        title: '1919 год: роспись Страстного монастыря и имажинистские акции — Летопись жизни и творчества / ФЭБ',
        url: 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-199-.htm?cmd=p&istext=1',
      },
    ]),
  };
}

function patchMayakovsky(essay: Essay): Essay {
  return {
    ...essay,
    sources: appendSources(essay, [
      {
        title: 'В. В. Маяковский. Предисловие ко второму изданию «Облака в штанах»: четыре крика — ПСС / ФЭБ',
        url: 'https://feb-web.ru/feb/mayakovsky/texts/ms0/ms1/ms1-417-.htm?cmd=p',
      },
      {
        title: 'В. В. Маяковский. «Облако в штанах» — академический текст / ФЭБ',
        url: 'https://feb-web.ru/feb/mayakovsky/texts/ms0/ms1/ms1-173-.htm?cmd=p',
      },
    ]),
  };
}

export function applySourceVerificationRound6(essay: Essay): Essay {
  if (essay.slug === 'yesenin-kutezhi') return patchYesenin(essay);
  if (essay.slug === 'mayakovsky-gromovoy') return patchMayakovsky(essay);
  return essay;
}

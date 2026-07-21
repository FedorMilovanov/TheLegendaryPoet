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

function patchMayakovsky(essay: Essay): Essay {
  const blocks = essay.blocks.map((initialBlock) => {
    let block = initialBlock;

    block = replaceParagraph(
      block,
      'Однако служение революционному проекту требовало подавления части собственной индивидуальности',
      'Внутри добровольно принятого революционного служения возникало реальное противоречие. В поэме о Ленине звучит формула «единица — вздор, единица — ноль», тогда как собственная поэзия Маяковского держится на гипертрофированном и ранимом «я». Это не доказывает, что вся агитационная работа была насилием над ним: он верил в её необходимость и много лет исполнял её с огромной энергией. Но собственная строка о «горле песни» показывает цену выбранной роли точнее любого посмертного психологического диагноза.',
    );

    block = replaceParagraph(
      block,
      'Похороны собрали тысячи людей',
      'Похороны 17 апреля 1930 года стали огромным городским событием: хроника фиксирует заполненную людьми Поварскую улицу, зрителей на оградах и крышах. Но массовое прощание ещё не означало устойчивого государственного канона. Перелом произошёл в 1935 году, когда в печати появилась сталинская формула о «лучшем, талантливейшем поэте нашей советской эпохи» и о преступном безразличии к его наследию. После этого сложного и неудобного автора начали всё настойчивее превращать в официального поэта Революции.',
    );

    if (
      block.type === 'voice' &&
      block.quote.includes('Это не способ (другим не советую)')
    ) {
      block = {
        ...block,
        source: 'В. В. Маяковский. ПСС в 13 т., т. 13: письмо «Всем», 12 апреля 1930 года',
        sourceUrl: 'https://feb-web.ru/feb/mayakovsky/texts/ms0/msd/msd-138-.htm?cmd=p',
      };
    }

    return block;
  });

  return {
    ...essay,
    blocks,
    sources: appendSources(essay, [
      {
        title: 'В. В. Маяковский. Поэма «Владимир Ильич Ленин» — ПСС / ФЭБ',
        url: 'https://feb-web.ru/feb/mayakovsky/texts/ms0/ms6/ms6-231-.htm?cmd=p',
      },
      {
        title: 'В. В. Маяковский. Письмо «Всем», 12 апреля 1930 года — ПСС / ФЭБ',
        url: 'https://feb-web.ru/feb/mayakovsky/texts/ms0/msd/msd-138-.htm?cmd=p',
      },
      {
        title: 'Похороны В. В. Маяковского, 17 апреля 1930 года — документальная хроника / ФЭБ',
        url: 'https://feb-web.ru/feb/mayakovsky/kmh-abc/kmh-478-.htm?cmd=p&istext=1',
      },
      {
        title: 'Посмертная государственная канонизация Маяковского и сталинская формула 1935 года — КЛЭ / ФЭБ',
        url: 'https://feb-web.ru/feb/kle/kle-abc/ke4/ke4-7102.htm?cmd=p&istext=1',
      },
    ]),
  };
}

export function applySourceVerificationRound4(essay: Essay): Essay {
  if (essay.slug === 'mayakovsky-gromovoy') return patchMayakovsky(essay);
  return essay;
}

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
      'Вернулся он в 1923 году другим человеком',
      'После возвращения заграничный скандализм быстро получил документальное продолжение в Москве. 21 ноября 1923 года Есенин подписал протокол допроса в 47-м отделении милиции; 20 января 1924-го его снова задержали возле кафе «Домино», допросили и отпустили под подписку о невыезде, передав материалы помощнику губернского прокурора. Это надёжнее поздних рассказов об особом негласном приказе «задерживать и отпускать»: сохранившиеся бумаги показывают, что кабацкая слава уже стала не только литературной ролью и предметом молвы, но реальным полицейским делом.',
    );

    block = replaceParagraph(
      block,
      'В конце ноября 1925 года Софья устроила его',
      'С 26 ноября по 21 декабря 1925 года Есенин находился в клинике 1-го Московского университета. Академические комментарии к его стихам точно фиксируют эти даты; документы и воспоминания показывают, что он временами выходил по издательским делам и продолжал работать над подготовкой собрания стихотворений. Это была последняя серьёзная попытка стабилизировать состояние и отдалиться от прежнего образа жизни. Подробности режима клиники и мотивы каждого выхода источники передают неравномерно, поэтому здесь важнее не драматическая реконструкция, а установленный факт: лечение было начато и прервано за неделю до смерти.',
    );

    return block;
  });

  return {
    ...essay,
    blocks,
    sources: appendSources(essay, [
      {
        title: 'Подпись С. Есенина под протоколом допроса, 21 ноября 1923 года — ПСС / ФЭБ',
        url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-5152.htm?cmd=p',
      },
      {
        title: 'Документы о задержании и подписке о невыезде, январь 1924 года — ПСС / ФЭБ',
        url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p',
      },
      {
        title: 'Комментарии ПСС: пребывание С. Есенина в клинике 26 ноября — 21 декабря 1925 года',
        url: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
      },
    ]),
  };
}

function patchMayakovsky(essay: Essay): Essay {
  const blocks = essay.blocks.map((initialBlock) => {
    let block = initialBlock;

    block = replaceParagraph(
      block,
      'Последние месяцы нельзя объяснять одной любовной ссорой',
      'Последние месяцы нельзя объяснять одной любовной ссорой или одним политическим разочарованием. «Баню» действительно встретила резкая критика, местами переходившая в травлю, но её приём не был единодушным провалом: зрители раскололись, о чём сам Маяковский писал Лиле. И выставка «20 лет работы» не пустовала. Она открылась 1 февраля 1930 года в Клубе Федерации писателей, зал был переполнен молодёжью, а затем выставку перенесли в рабочий район — Дом комсомола Красной Пресни. Одновременно возникли болезненные размолвки с частью литературного окружения, а официальная критика всё настойчивее объявляла новаторскую работу неудачей. Точнее говорить не о полном бойкоте, а о мучительном контрасте: живая молодая аудитория оставалась, тогда как профессиональная среда становилась всё более враждебной и расколотой.',
    );

    return block;
  });

  return {
    ...essay,
    blocks,
    sources: appendSources(essay, [
      {
        title: '1930 год: открытие и работа выставки «20 лет работы» — хроника / ФЭБ',
        url: 'https://feb-web.ru/feb/mayakovsky/kmh-abc/kmh-478-.htm?cmd=2',
      },
      {
        title: 'В. Маяковский. Выступление в Доме комсомола Красной Пресни, 25 марта 1930 года',
        url: 'https://feb-web.ru/feb/mayakovsky/texts/mp0/mpa/mpa-368-.htm?cmd=p',
      },
    ]),
  };
}

function patchBrik(essay: Essay): Essay {
  const blocks = essay.blocks.map((initialBlock) => {
    let block = initialBlock;

    block = replaceParagraph(
      block,
      'Документирован и другой факт: с июня 1920 года',
      'Документирована и служба Осипа Брика в органах госбезопасности. Архивное удостоверение фиксирует период с 8 июня 1920 года по 1 января 1924-го; исследователи, работавшие с личным делом, указывают, что он был следователем спекулятивного отдела МЧК, затем уполномоченным 7-го отделения секретного отдела и был уволен с жёсткой формулировкой «как дезертир» после повторных освобождений от работы. Это заметно серьёзнее удобной версии о краткой службе простым юрисконсультом. Но должность Брика сама по себе ещё не доказывает каждую позднюю версию о квартире как специально созданном пункте тотального надзора: для конкретного обвинения всё равно нужен конкретный документ.',
    );

    return block;
  });

  return {
    ...essay,
    blocks,
    sources: appendSources(essay, [
      {
        title: 'А. Г. Тепляков, Д. М. Шиловский. «Маяковский, Брики и чекисты» — архивное исследование',
        url: 'https://zaimka.ru/teplyakov-shilovskiy-mayakovsky/',
      },
    ]),
  };
}

export function applySourceVerificationRound2(essay: Essay): Essay {
  switch (essay.slug) {
    case 'yesenin-kutezhi':
      return patchYesenin(essay);
    case 'mayakovsky-gromovoy':
      return patchMayakovsky(essay);
    case 'brik-case':
      return patchBrik(essay);
    default:
      return essay;
  }
}

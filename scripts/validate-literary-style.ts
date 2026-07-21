import { poets } from '../src/data/library/index';
import { essays } from '../src/data/essays/index';
import type { Poet } from '../src/types/poet';
import type { Essay, EssayBlock } from '../src/types/essay';

type Problem = { level: 'ERROR' | 'WARN'; where: string; message: string };

const problems: Problem[] = [];

const error = (where: string, message: string) =>
  problems.push({ level: 'ERROR', where, message });
const warning = (where: string, message: string) =>
  problems.push({ level: 'WARN', where, message });

const allowedLatinWords = new Set([
  'Alter',
  'Corpus',
  'Exegi',
  'Silentium',
  'monumentum',
]);

const requiredPoetMarkers: Record<string, string[]> = {
  'sergei-yesenin': [
    '21 ноября 1923 года',
    '20 января 1924 года',
    '26 ноября по 21 декабря 1925 года',
  ],
  'vladimir-mayakovsky': [
    'зал переполнила молодёжь',
    'поэтом-агитатором и поэтом-пропагандистом',
    'не оставил ясных свидетельств покаяния',
  ],
  'nikolay-gumilev': [
    'не христианское мученичество',
    'нарушение брачного обета',
    'сфабрикованному политическому делу',
  ],
  'anna-akhmatova': [
    'Пунин оставался мужем Анны Аренс',
    'это было прелюбодеяние',
    'не позволяет безоговорочно описывать всю её жизнь',
  ],
  'boris-pasternak': [
    'зарегистрировали брак в ЗАГСе',
    'в августе 1960 года',
    'сильном притяжении к личности Христа',
  ],
  'alexander-blok': [
    'не заменяет медицинской истории',
    'связала красногвардейский патруль с образом Христа',
    'не оставил ясного свидетельства примирения с Богом',
  ],
  'fyodor-tyutchev': [
    'сам факт супружеской неверности сомнений не вызывает',
    'Это была не краткая слабость, а длительная двойная жизнь',
    'не сводит к одной гордости',
  ],
  'alexander-pushkin': [
    'не является протоколом тридцати семи доказанных любовных связей',
    'Называть это сребролюбием неточно',
    'предсмертную исповедь с причастием',
  ],
  'mikhail-lermontov': [
    'даёт серьёзные основания считать, что Лермонтов не хотел стрелять',
    'не отменяет ответственности за доведённое до поединка унижение',
    'не погиб потому, что одна колкость мистически «вернулась пулей»',
  ],
  'afanasy-fet': [
    'сводить многолетний брак к одной финансовой сделке оснований недостаточно',
    'Называть этот поступок сребролюбием слишком просто',
    'подробности известны из одного близкого свидетельства',
  ],
};

const forbiddenPoetMarkers: Record<string, string[]> = {
  'sergei-yesenin': [
    'негласный приказ',
    'возил с собой Библию и распятие',
    'пьяный ангел',
    'гениальность, оторванная от духовной опоры, не спасает, а нередко ускоряет разрушение',
  ],
  'vladimir-mayakovsky': [
    'демонстративно проигнорировали и собратья по перу, и власть',
    'Христос и есть та «звезда»',
    'ясна духовная подоплёка его крушения',
    'построивший жизнь на чужой жене и на идоле революции, кончил пустотой и выстрелом',
  ],
  'nikolay-gumilev': [
    'моральная ledger',
    'как мученик за верность',
    'грехи реальны — прелюбодеяние и разрушенный брак, юношеское отчаяние, дуэльный задор; но они перевешены',
  ],
  'anna-akhmatova': [
    'Царственная жрица Серебряного века',
    'Гумилёву, в частности, она изменяла',
    'глубоко и подлинно верующим человеком',
    'затем за искусствоведом Николаем Пуниным',
  ],
  'boris-pasternak': [
    'в 1934-м обвенчались',
    'и снова в 1959-м',
    'дважды арестованная властями фактически «за него»',
    'Его вера была не церковно-догматической, а евангельской по духу',
    'Ивинская же заплатила за эту связь лагерем',
  ],
  'alexander-blok': [
    'революция пожрала',
    'революция его сожрала',
    'Главный распад Блока — идолопоклонство',
    'умер сорока лет, задохнувшись, замолчав, в чёрном отчаянии',
  ],
  'fyodor-tyutchev': [
    'был законченным прелюбодеем',
    'не совладал с бездной похоти',
    'К этому добавлялся и гражданский цинизм',
    'этот роман и надломил первую жену',
  ],
  'alexander-pushkin': [
    'собственноручный перечень из тридцати семи женщин, с которыми его связывали увлечения и связи',
    'женитьба на Натали — «сто тринадцатая любовь»',
    'сребролюбие и жизнь в долг',
    'написанное в 1826 году под впечатлением от казни декабристов',
  ],
  'mikhail-lermontov': [
    'эта жестокость его же и убила',
    'сам же в нём сгорел',
    'Лермонтов стоял у порога — но переступить его так и не смог',
    'спровоцировал её-то именно он',
  ],
  'afanasy-fet': [
    'ему, разорённому и бесправному, нужна была богатая партия',
    'это был брак ради устройства и опоры',
    'за ним стоит сребролюбие и маловерие',
    'человек отвернулся от любимой ради денег и положения',
  ],
};

const requiredEssayMarkers: Record<string, string[]> = {
  'yesenin-kutezhi': ['Печаль, которая не стала покаянием'],
  'mayakovsky-gromovoy': ['Когда гром стих'],
  'brik-case': ['Свобода без верности'],
};

const forbiddenEssayMarkers: Record<string, string[]> = {
  'yesenin-kutezhi': [
    'Мирская печаль, которая произвела смерть',
    'человек ещё считал, что пользуется скандалом, когда скандал уже пользовался им',
    'Кабак разрушал Есенина-человека и одновременно давал',
    'Поэт действительно «горел ярче»',
    'Различались идолы; хозяин сердца не менялся',
  ],
  'mayakovsky-gromovoy': [
    'Идол, который потребовал голос',
    'трагедию добровольно принятого призвания',
    'По плодам текста перед нами',
  ],
  'brik-case': [
    'Свобода, которая сменила только цепи',
    'Правильная маркировка такова',
    'Правильная прямота не требует',
  ],
};

function proseOfPoet(poet: Poet): string {
  return [
    poet.shortBio,
    poet.fullBio,
    poet.historicalNote ?? '',
    poet.spiritualSearch ?? '',
    poet.moralPortrait ?? '',
    poet.authorCommentary ?? '',
    ...poet.poems.flatMap((poem) => [poem.analysis ?? '', poem.biblicalPerspective ?? '']),
  ].join('\n');
}

function blockText(block: EssayBlock): string {
  switch (block.type) {
    case 'epigraph':
    case 'lead':
    case 'paragraph':
    case 'pullquote':
    case 'note':
      return block.text;
    case 'reflection':
      return `${block.heading}\n${block.text}`;
    case 'section':
      return block.heading;
    case 'poem':
      return `${block.title ?? ''}\n${block.lines}\n${block.note ?? ''}`;
    case 'voice':
      return `${block.quote}\n${block.author}\n${block.role}\n${block.source}`;
    case 'divider':
      return '';
  }
}

function proseOfEssay(essay: Essay): string {
  return [essay.title, essay.subtitle ?? '', essay.excerpt, ...essay.blocks.map(blockText)].join('\n');
}

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function validateRhythm(where: string, text: string, mirroredLimit: number): void {
  const latinWords = [
    ...new Set(
      (text.match(/\b[A-Za-z]{4,}\b/g) ?? []).filter(
        (word) => !allowedLatinWords.has(word) && !/^[IVXLCDM]+$/.test(word),
      ),
    ),
  ];
  if (latinWords.length > 0) {
    warning(where, `Unexplained Latin or English words in Russian prose: ${latinWords.join(', ')}`);
  }

  const mirroredConstructions =
    count(text, /не только/gi) +
    count(text, /не столько/gi) +
    count(text, /нельзя свести/gi) +
    count(text, /но нельзя и/gi) +
    count(text, /это не [^.]{1,90}, а /gi);
  if (mirroredConstructions > mirroredLimit) {
    warning(
      where,
      `${mirroredConstructions} mirrored contrast constructions; review for repetitive AI-like rhythm`,
    );
  }

  const editorialScaffolding =
    count(text, /важно понимать/gi) +
    count(text, /честность требует/gi) +
    count(text, /следует сказать/gi) +
    count(text, /нужно сказать/gi) +
    count(text, /правильная маркировка/gi);
  if (editorialScaffolding > 4) {
    warning(
      where,
      `${editorialScaffolding} editorial signposts; replace some with facts or direct verbs`,
    );
  }

  const repeatedTheology =
    count(text, /ложн(?:ый|ого|ым) спасител/gi) +
    count(text, /падш(?:ее|его|им) сердц/gi) +
    count(text, /по явленным плодам/gi);
  if (repeatedTheology > 3) {
    warning(
      where,
      `${repeatedTheology} repeated theological formulas; keep them rare and context-specific`,
    );
  }
}

for (const poet of poets) {
  const text = proseOfPoet(poet);

  for (const marker of requiredPoetMarkers[poet.id] ?? []) {
    if (!text.includes(marker)) {
      error(poet.id, `required verified or editorial marker is missing: “${marker}”`);
    }
  }

  for (const marker of forbiddenPoetMarkers[poet.id] ?? []) {
    if (text.includes(marker)) {
      error(poet.id, `superseded or machine-like formulation returned: “${marker}”`);
    }
  }

  validateRhythm(poet.id, text, 8);
}

for (const essay of essays) {
  const text = proseOfEssay(essay);

  for (const marker of requiredEssayMarkers[essay.slug] ?? []) {
    if (!text.includes(marker)) {
      error(essay.slug, `required literary-polish marker is missing: “${marker}”`);
    }
  }

  for (const marker of forbiddenEssayMarkers[essay.slug] ?? []) {
    if (text.includes(marker)) {
      error(essay.slug, `superseded essay formulation returned: “${marker}”`);
    }
  }

  validateRhythm(essay.slug, text, 14);
}

for (const problem of problems) {
  const tag = problem.level === 'ERROR' ? 'ERROR' : 'WARN ';
  console.log(`${tag} ${problem.where}: ${problem.message}`);
}

const errors = problems.filter((problem) => problem.level === 'ERROR');
const warnings = problems.filter((problem) => problem.level === 'WARN');
console.log(
  `Literary style validation: ${poets.length} poets, ${essays.length} essays, ${errors.length} errors, ${warnings.length} warnings`,
);

if (errors.length > 0) process.exit(1);

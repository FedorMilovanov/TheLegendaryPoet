import { poets } from '../src/data/library/index';
import { essays } from '../src/data/essays/index';
import type { Poet } from '../src/types/poet';
import type { Essay, EssayBlock } from '../src/types/essay';

type Problem = { level: 'ERROR' | 'WARN'; where: string; message: string };
type SemanticInvariant = { label: string; anyOf: string[] };

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
  // Institutional abbreviations are acceptable after their Russian expansion.
  'NYPL',
]);

/**
 * These contracts protect historical and theological boundaries, not one
 * frozen editorial sentence. Each invariant accepts a small set of equivalent
 * witnesses so prose can be improved without weakening the underlying claim.
 */
const requiredPoetInvariants: Record<string, SemanticInvariant[]> = {
  'fyodor-tyutchev': [
    {
      label: 'the relationship with Denisyeva remains a long double life',
      anyOf: ['многолетнюю связь с Еленой Денисьевой', 'длительная двойная жизнь'],
    },
    {
      label: 'the unequal public cost to Denisyeva remains explicit',
      anyOf: ['Денисьева оказалась изгоем', 'основную тяжесть общественного осуждения'],
    },
    {
      label: 'poetic insight does not erase responsibility',
      anyOf: ['поступок, породивший эту боль', 'трагедия его поступков'],
    },
  ],
  'vladimir-mayakovsky': [
    {
      label: 'the Brik relationship remains identified as marital unfaithfulness',
      anyOf: ['Лилей Брик', 'супружеской неверности'],
    },
    {
      label: 'conscious revolutionary service remains explicit',
      anyOf: ['моя революция', 'своей революцией', 'агитатором и пропагандистом'],
    },
    {
      label: 'programmatic blasphemy remains explicit',
      anyOf: ['унижал Бога', 'богохульство'],
    },
    {
      label: 'the absence of a documented Christian return remains explicit',
      anyOf: ['известных свидетельств обращения ко Христу', 'не оставил ясных свидетельств покаяния'],
    },
  ],
  'alexander-pushkin': [
    {
      label: 'the Don Juan list is not treated as an exact affair count',
      anyOf: ['Донжуанский список не даёт точного счёта', 'донжуанский список'],
    },
    {
      label: 'gambling and debt remain part of the moral account',
      anyOf: ['карточная игра', 'Долги преследовали'],
    },
    {
      label: 'duel responsibility remains explicit',
      anyOf: ['к многочисленным вызовам и дуэлям', 'Рим. 12:19'],
    },
    {
      label: 'the final confession and communion remain explicit',
      anyOf: ['исповедался и причастился', 'предсмертная исповедь'],
    },
  ],
  'mikhail-lermontov': [
    {
      label: 'the repeated mockery of Martynov remains explicit',
      anyOf: ['высмеивал Николая Мартынова', 'насмешками'],
    },
    {
      label: 'the upward-shot evidence remains qualified rather than certain',
      anyOf: ['Если на дуэли поэт действительно направил пистолет вверх', 'серьёзные основания считать, что Лермонтов не хотел стрелять'],
    },
    {
      label: 'Lermontov remains responsible for his part in the duel chain',
      anyOf: ['ответственность за собственное участие', 'не отменяет ответственности'],
    },
    {
      label: 'the prayer poems retain their contrasting moral possibility',
      anyOf: ['молитвенная лирика', 'путь к миру был ему знаком'],
    },
  ],
  'boris-pasternak': [
    {
      label: 'the breakup of two families remains explicit',
      anyOf: ['распались две семьи', 'Пастернак оставил Евгению Лурье'],
    },
    {
      label: 'the Ivinskaya relationship remains identified as marital unfaithfulness',
      anyOf: ['Ольгой Ивинской', 'супружеской неверности'],
    },
    {
      label: 'the two arrests remain historically distinguished',
      anyOf: ['первый арест использовался', 'второй, уже после его смерти'],
    },
    {
      label: 'the late Gospel movement remains explicit',
      anyOf: ['обращение Пастернака к Евангелию', 'сильном притяжении к личности Христа'],
    },
  ],
  'afanasy-fet': [
    {
      label: 'the refusal to marry Lazich remains tied to fear of poverty and status loss',
      anyOf: ['отказ от брака с Марией Лазич', 'страх бедности'],
    },
    {
      label: 'direct causation for Lazich death remains unclaimed',
      anyOf: ['Обстоятельства гибели Лазич остаются спорными', 'прямой линии от разрыва к её смерти'],
    },
    {
      label: 'the Botkina marriage is not reduced to a financial transaction',
      anyOf: ['свести многолетний союз к одному приданому', 'многолетний брак к одной финансовой сделке'],
    },
    {
      label: 'the final self-harm account remains source-qualified',
      anyOf: ['По свидетельству секретаря', 'подробности известны из одного близкого свидетельства'],
    },
  ],
  'nikolay-gumilev': [
    {
      label: 'documented military courage remains explicit',
      anyOf: ['два Георгиевских креста', 'добровольно пошёл на фронт'],
    },
    {
      label: 'marital unfaithfulness remains explicit',
      anyOf: ['супружеская неверность', 'разрыв брачного обета'],
    },
    {
      label: 'the execution remains identified as a political reprisal',
      anyOf: ['политической расправой', 'сфабрикованному политическому делу'],
    },
    {
      label: 'courage before execution remains explicit',
      anyOf: ['встретил её мужественно', 'держался спокойно и мужественно'],
    },
  ],
  'sergei-yesenin': [
    {
      label: 'alcohol dependence remains a destructive real-world force',
      anyOf: ['Алкогольная зависимость', 'пьяные скандалы'],
    },
    {
      label: 'the late psychiatric treatment remains explicit',
      anyOf: ['26 ноября по 21 декабря 1925 года', 'психиатрической клинике'],
    },
    {
      label: 'the absence of a documented Christian return remains explicit',
      anyOf: ['ясного свидетельства возвращения ко Христу', 'Есенин умер неверующим'],
    },
    {
      label: 'the death is neither romanticized nor reduced to one punishment formula',
      anyOf: ['не был красивой кабацкой легендой', 'самоубийство в «Англетере»'],
    },
  ],
  'anna-akhmatova': [
    {
      label: 'courage in the prison queues and preservation of memory remains explicit',
      anyOf: ['тюремных очередях', 'сохранении стихов'],
    },
    {
      label: 'Punin existing marriage remains explicit',
      anyOf: ['Пунин оставался мужем Анны Аренс', 'он оставался мужем Анны Аренс'],
    },
    {
      label: 'the relationship moral harm remains explicit',
      anyOf: ['связи с женатым человеком', 'разрушительном союзе', 'прелюбодеяние'],
    },
  ],
  'alexander-blok': [
    {
      label: 'the idealization of his wife and lost marital closeness remain explicit',
      anyOf: ['воплощение Прекрасной Дамы', 'супружеской близости'],
    },
    {
      label: 'alcohol misuse and affairs remain explicit',
      anyOf: ['злоупотребление вином', 'увлечения за пределами брака'],
    },
    {
      label: 'the revolutionary patrol and Christ image remain connected',
      anyOf: ['красногвардейский патруль оказался связан с образом Христа', 'с образом Христа'],
    },
    {
      label: 'medical death is not treated as punishment and no clear reconciliation is invented',
      anyOf: ['не была наглядным наказанием', 'ясного свидетельства примирения с Богом'],
    },
  ],
};

const forbiddenPortraitScaffolding = [
  'честный портрет',
  'редактору достаточно',
  'не даёт редактору права',
  'не нуждается в приукрашивании',
  'не приукрашиваем',
  'не умаляем',
];

const forbiddenPoetMarkers: Record<string, string[]> = {
  'sergei-yesenin': [
    'негласный приказ',
    'возил с собой Библию и распятие',
    'пьяный ангел',
    'гениальность, оторванная от духовной опоры, не спасает, а нередко ускоряет разрушение',
    'вошли в его позднюю лирику и привели к трагическому финалу',
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
    'не является мученичеством за Христа',
    'не как мученик за исповедание Христа',
    'Это не христианское мученичество в строгом смысле',
    'грехи реальны — прелюбодеяние и разрушенный брак, юношеское отчаяние, дуэльный задор; но они перевешены',
  ],
  'anna-akhmatova': [
    'Царственная жрица Серебряного века',
    'Гумилёву, в частности, она изменяла',
    'глубоко и подлинно верующим человеком',
    'затем за искусствоведом Николаем Пуниным',
    'превратившая личный опыт репрессий в голос матерей и заключённых',
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
    'Его конец был человечески тяжёлым и духовно тревожным',
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
    'успев в последние годы обратиться к темам милости, совести и молитвы',
  ],
  'mikhail-lermontov': [
    'эта жестокость его же и убила',
    'сам же в нём сгорел',
    'Лермонтов стоял у порога — но переступить его так и не смог',
    'спровоцировал её-то именно он',
    'после конфликта, который сам долго разжигал насмешками',
  ],
  'afanasy-fet': [
    'ему, разорённому и бесправному, нужна была богатая партия',
    'это был брак ради устройства и опоры',
    'за ним стоит сребролюбие и маловерие',
    'человек отвернулся от любимой ради денег и положения',
  ],
};

const requiredEssayMarkers: Record<string, string[]> = {
  'yesenin-kutezhi': [
    'Печаль, которая не стала покаянием',
    'Я вовсе не религиозный человек и не мистик',
    'По доступным историческим свидетельствам Есенин умер неверующим',
    'сюжет само-суда',
    'Разбойник на кресте не откладывал заранее покаяние',
  ],
  'mayakovsky-gromovoy': [
    'Когда гром стих',
    'Моя революция',
    'По доступным историческим свидетельствам Маяковский умер неверующим',
    'сознательное откладывание покаяния не сохраняет сердце нейтральным',
  ],
  'brik-case': [
    'Свобода без верности',
    'Полный сохранившийся текст был впервые реконструирован',
    'согласие участников не могло отменить Божье определение брака',
  ],
};

const forbiddenEssayMarkers: Record<string, string[]> = {
  'yesenin-kutezhi': [
    'Мирская печаль, которая произвела смерть',
    'человек ещё считал, что пользуется скандалом, когда скандал уже пользовался им',
    'Кабак разрушал Есенина-человека и одновременно давал',
    'Поэт действительно «горел ярче»',
    'Различались идолы; хозяин сердца не менялся',
    'дорога к гибели',
    'почему совесть и великий дар не смогли освободить Есенина',
    'вероятнее всего погибельный конец неверующего человека',
    'чем громче был скандал, тем нежнее было то, что он прикрывал',
    'один духовный фактор единственной медицинской причиной',
    'Неизвестный людям последний миг остаётся в Божьем ведении, но возможность такого мига не является исторической версией и не даёт права смягчать документированный финал',
  ],
  'mayakovsky-gromovoy': [
    'Идол, который потребовал голос',
    'трагедию добровольно принятого призвания',
    'По плодам текста перед нами',
    'Духовное направление жизни всё же видно достаточно ясно',
    'вероятным концом неверующего человека',
    'Медицинская причинность самоубийства и духовная оценка жизни — разные вопросы',
    'Неизвестный последний миг принадлежит Божьему суду, но редактор не вправе превращать',
  ],
  'brik-case': [
    'Свобода, которая сменила только цепи',
    'Правильная маркировка такова',
    'Правильная прямота не требует',
    'прелюбодейная конструкция',
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

function portraitOfPoet(poet: Poet): string {
  return [poet.moralPortrait ?? '', poet.authorCommentary ?? ''].join('\n').toLocaleLowerCase('ru');
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
    case 'image':
      return block.caption;
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

function normalizeSemanticText(text: string): string {
  return text.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

const semanticStopWords = new Set([
  'а',
  'без',
  'бы',
  'в',
  'во',
  'для',
  'до',
  'его',
  'ее',
  'её',
  'и',
  'из',
  'к',
  'как',
  'ко',
  'на',
  'не',
  'но',
  'о',
  'об',
  'от',
  'по',
  'с',
  'со',
  'что',
  'это',
]);

function semanticStem(token: string): string {
  const normalized = token.replace(/[^a-zа-я0-9]/gi, '');
  if (normalized.length <= 5) return normalized;
  return normalized.slice(0, Math.max(5, normalized.length - 3));
}

function semanticWitnessMatches(text: string, witness: string): boolean {
  const normalizedText = normalizeSemanticText(text);
  const normalizedWitness = normalizeSemanticText(witness);
  if (normalizedText.includes(normalizedWitness)) return true;

  const textTokens = normalizedText.match(/[a-zа-я0-9]+/gi) ?? [];
  const witnessTokens = (normalizedWitness.match(/[a-zа-я0-9]+/gi) ?? []).filter(
    (token) => token.length >= 4 && !semanticStopWords.has(token),
  );
  if (witnessTokens.length < 2) return false;

  return witnessTokens.every((token) => {
    const stem = semanticStem(token);
    return textTokens.some((candidate) => candidate.startsWith(stem));
  });
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
  const portraitText = portraitOfPoet(poet);

  for (const invariant of requiredPoetInvariants[poet.id] ?? []) {
    if (!invariant.anyOf.some((marker) => semanticWitnessMatches(text, marker))) {
      error(
        poet.id,
        `required semantic boundary is missing: ${invariant.label}; accepted witnesses: ${invariant.anyOf.map((marker) => `“${marker}”`).join(' / ')}`,
      );
    }
  }

  for (const marker of forbiddenPortraitScaffolding) {
    if (portraitText.includes(marker.toLocaleLowerCase('ru'))) {
      error(poet.id, `service/editorial scaffolding returned to the portrait: “${marker}”`);
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
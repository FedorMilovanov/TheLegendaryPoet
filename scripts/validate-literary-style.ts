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
  ],
  'mayakovsky-gromovoy': ['Идол, который потребовал голос'],
  'brik-case': ['Свобода, которая сменила только цепи'],
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
    case 'reflection':
      return block.text;
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
  const latinWords = [...new Set(text.match(/\b[A-Za-z]{4,}\b/g) ?? [])];
  if (latinWords.length > 0) {
    warning(where, `Latin words in Russian editorial prose: ${latinWords.join(', ')}`);
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

import { poets } from '../src/data/library/index';
import type { Poet } from '../src/types/poet';

type Problem = { level: 'ERROR' | 'WARN'; where: string; message: string };

const problems: Problem[] = [];

const error = (where: string, message: string) =>
  problems.push({ level: 'ERROR', where, message });
const warning = (where: string, message: string) =>
  problems.push({ level: 'WARN', where, message });

const requiredMarkers: Record<string, string[]> = {
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

const forbiddenMarkers: Record<string, string[]> = {
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

function proseOf(poet: Poet): string {
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

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

for (const poet of poets) {
  const text = proseOf(poet);

  for (const marker of requiredMarkers[poet.id] ?? []) {
    if (!text.includes(marker)) {
      error(poet.id, `required verified or editorial marker is missing: “${marker}”`);
    }
  }

  for (const marker of forbiddenMarkers[poet.id] ?? []) {
    if (text.includes(marker)) {
      error(poet.id, `superseded or machine-like formulation returned: “${marker}”`);
    }
  }

  const latinWords = [...new Set(text.match(/\b[A-Za-z]{4,}\b/g) ?? [])];
  if (latinWords.length > 0) {
    warning(poet.id, `Latin words in Russian editorial prose: ${latinWords.join(', ')}`);
  }

  const mirroredConstructions =
    count(text, /не только/gi) +
    count(text, /не столько/gi) +
    count(text, /нельзя свести/gi) +
    count(text, /но нельзя и/gi);
  if (mirroredConstructions > 7) {
    warning(
      poet.id,
      `${mirroredConstructions} mirrored contrast constructions; review for repetitive AI-like rhythm`,
    );
  }

  const editorialScaffolding =
    count(text, /важно понимать/gi) +
    count(text, /честность требует/gi) +
    count(text, /следует сказать/gi) +
    count(text, /нужно сказать/gi);
  if (editorialScaffolding > 4) {
    warning(
      poet.id,
      `${editorialScaffolding} editorial signposts; replace some with facts or direct verbs`,
    );
  }

  const repeatedTheology =
    count(text, /ложн(?:ый|ого|ым) спасител/gi) +
    count(text, /падш(?:ее|его|им) сердц/gi) +
    count(text, /по явленным плодам/gi);
  if (repeatedTheology > 3) {
    warning(
      poet.id,
      `${repeatedTheology} repeated theological formulas; keep them rare and context-specific`,
    );
  }
}

for (const problem of problems) {
  const tag = problem.level === 'ERROR' ? 'ERROR' : 'WARN ';
  console.log(`${tag} ${problem.where}: ${problem.message}`);
}

const errors = problems.filter((problem) => problem.level === 'ERROR');
const warnings = problems.filter((problem) => problem.level === 'WARN');
console.log(
  `Literary style validation: ${poets.length} poets, ${errors.length} errors, ${warnings.length} warnings`,
);

if (errors.length > 0) process.exit(1);

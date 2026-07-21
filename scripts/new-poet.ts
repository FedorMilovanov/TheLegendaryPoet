/**
 * Scaffold a new poet module from the canonical template.
 *
 * Usage:
 *   npx tsx scripts/new-poet.ts "Имя Отчество Фамилия" [--id kebab-id]
 *
 * Creates src/data/library/<camel>.ts, prints the two lines to add to
 * src/data/library/index.ts, and reminds you of the checklist in
 * POET_AUTHORING_GUIDE.md. Refuses to overwrite an existing file.
 *
 * This does NOT touch package.json (Arena package rule) and does NOT auto-edit
 * index.ts — you add the import + array entry by hand, deliberately.
 */
import fs from 'fs';
import path from 'path';

function toKebab(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Map a kebab slug to a camelCase file/variable stem by transliterating the
// surname. Keep it simple: agent will refine the filename if needed.
function camelFromKebab(kebab: string): string {
  return kebab
    .split('-')
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');
}

const args = process.argv.slice(2);
if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: npx tsx scripts/new-poet.ts "<Full Name>" [--id <kebab-id>]');
  process.exit(0);
}

const fullName = args.find((a) => !a.startsWith('--'))!;
const idIdx = args.indexOf('--id');
const id = idIdx >= 0 ? args[idIdx + 1] : toKebab(fullName.split(' ').slice(-1)[0]);
const camel = camelFromKebab(id);
const filePath = path.resolve('src/data/library', `${camel}.ts`);

if (fs.existsSync(filePath)) {
  console.error(`✗ Refusing to overwrite existing file: ${filePath}`);
  process.exit(1);
}

const translitPhoto = id;

const template = `import { Poet } from '../../types/poet';

export const ${camel}: Poet = {
  id: '${id}',
  name: '${fullName.split(' ')[0]} ${fullName.split(' ').slice(-1)[0]}',
  fullName: '${fullName}',
  birthYear: 0, // TODO: YYYY (verify)
  deathYear: 0, // TODO: YYYY (undefined if living)
  nationality: 'Русский',
  photo: '/images/${translitPhoto}.jpg', // TODO: add image to public/images/
  shortBio: ` + '`TODO: 1–2 предложения, ~280–360 знаков. Эпиграмматичный, не умильный портрет.`' + `,
  fullBio: ` + '`TODO: 5–9 абзацев (\\n\\n между ними). Жизнь по этапам, с датами.`' + `,
  rating: 9.5, // 0–10
  tags: ['TODO-эпоха', 'TODO-течение'],
  poems: [
    {
      id: '${id}-1',
      title: 'TODO Название',
      year: 0, // TODO
      text: ` + '`TODO: канонический текст, сверен по >=2 источникам (>=1 A+): ФЭБ/РВБ/Викитека`' + `,
      analysis: 'TODO: краткий литературный разбор',
      // biblicalPerspective — только если есть реальный библейский образ; цитируй те же слова, что в text
      rating: 9.5,
    },
    // минимум 2–4 стихотворения
  ],
  articles: [],
  historicalNote: 'TODO: 2–4 предложения об эпохе',
  spiritualSearch: 'TODO: духовный путь и мировоззрение — аналитически, без баптизирования',
  moralPortrait: ` + '`TODO (опционально): честная моральная оценка грехов; цензура POET_AUTHORING_GUIDE §6. Можно опустить.`' + `,
  authorCommentary: 'TODO (опционально): короткая итоговая ремарка',
  testimonies: [
    // цель 5–9: микс contemporary + historian; у каждой источник (книга+год), желательно sourceUrl
  ],
  famousWorks: ['TODO 1', 'TODO 2', 'TODO 3', 'TODO 4', 'TODO 5'],
};
`;

fs.writeFileSync(filePath, template, 'utf8');
console.log(`✓ Created ${path.relative(process.cwd(), filePath)}`);
console.log(`\nNext — add to src/data/library/index.ts:`);
console.log(`  import { ${camel} } from './${camel}';`);
console.log(`  ...and  ${camel},  in the poets[] array (in epoch/importance order).`);
console.log(`\nThen follow the checklist in POET_AUTHORING_GUIDE.md §9,`);
console.log(`and run:  npx tsx scripts/validate-library.ts`);

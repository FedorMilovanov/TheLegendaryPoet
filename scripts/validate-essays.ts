import fs from 'node:fs';
import path from 'node:path';
import { essays } from '../src/data/essays/index';
import { sectionAnchor } from '../src/components/essay/anchor';
import type { Essay, EssayBlock, EssaySourceKind } from '../src/types/essay';

const errors: string[] = [];
const warnings: string[] = [];
const institutionalSourcePattern = /музей|мемориаль|выставк|фильм|кино/i;
const scriptureReferencePattern = /\((?:[1-3]\s*)?[А-ЯЁ][А-Яа-яё. ]+\s+\d+:\d+(?:[–-]\d+)?\)/g;
const allowedSourceKinds = new Set<EssaySourceKind>([
  'primary',
  'archive',
  'research',
  'institutional',
  'context',
]);

const sourceMinimums: Record<string, { total: number; primary: number }> = {
  'mayakovsky-before-revolution': { total: 30, primary: 18 },
  'mayakovsky-gromovoy': { total: 30, primary: 18 },
  'brik-case': { total: 30, primary: 12 },
};

const requiredContentMarkers: Record<string, string[]> = {
  'yesenin-kutezhi': [
    'маска «Москвы кабацкой»',
    '21 ноября 1923 года',
    '26 ноября по 21 декабря 1925 года',
    'под иконами умирать',
    'периодом от 1923 года до 14 ноября 1925-го',
  ],
  'mayakovsky-gromovoy': [
    'Зрители до смешного поделились',
    'зал был переполнен молодёжью',
    'поэта-агитатора и поэта-пропагандиста',
    'заполненную людьми Поварскую улицу',
  ],
  'brik-case': [
    'Так тяжело мне не было никогда',
    'добровольное заключение',
    'как дезертир',
    'творческая полезность и нравственная правота — разные вопросы',
  ],
};

const forbiddenContentMarkers: Record<string, string[]> = {
  'yesenin-kutezhi': [
    'пьяный ангел',
    'был отдан особый приказ: Есенина задерживать',
    'Это не про лошадь',
    'тосковал по спасению, тянулся к тишине и чистоте',
  ],
  'mayakovsky-gromovoy': [
    'литературные организации и большинство известных писателей проигнорировали её открытие',
    'служение революционному проекту требовало подавления части собственной индивидуальности',
    'Похороны собрали тысячи людей, тогда как юбилейную выставку',
  ],
  'brik-case': [
    'Государственный музей Маяковского употребляет другие, более точные слова',
    'работал по шестнадцать-двадцать часов в сутки',
    'Обмен был неравным и болезненным, но не односторонним',
  ],
};

function error(essay: Essay, message: string) {
  errors.push(`${essay.slug}: ${message}`);
}

function warning(essay: Essay, message: string) {
  warnings.push(`${essay.slug}: ${message}`);
}

function validateImagePath(essay: Essay, label: string, value?: string) {
  if (!value || /^https?:\/\//.test(value)) return;

  const relativePath = value.replace(/^\//, '');
  const absolutePath = path.resolve('public', relativePath);
  if (!fs.existsSync(absolutePath)) {
    warning(essay, `${label} is not present yet: ${value}`);
  }
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
    case 'image':
      return `${block.alt}\n${block.caption}\n${block.credit ?? ''}`;
    case 'poem':
      return `${block.title ?? ''}\n${block.lines}\n${block.note ?? ''}`;
    case 'voice':
      return `${block.quote}\n${block.author}\n${block.role}\n${block.source}`;
    case 'divider':
      return '';
  }
}

function validateBlocks(essay: Essay, blocks: EssayBlock[]) {
  const anchors = new Set<string>();
  let reflectionCount = 0;
  let historicalBodyScriptureReferences = 0;

  blocks.forEach((block, index) => {
    if (block.type === 'section') {
      const heading = block.heading.trim();
      if (!heading) error(essay, `section ${index + 1} has an empty heading`);

      const previous = blocks[index - 1];
      const isAdjacentDuplicate =
        previous?.type === 'section' &&
        previous.heading.trim().toLocaleLowerCase('ru-RU') ===
          heading.toLocaleLowerCase('ru-RU');

      if (isAdjacentDuplicate) {
        error(essay, `adjacent duplicate section heading: “${heading}”`);
        return;
      }

      const anchor = sectionAnchor(heading, block.anchor);
      if (anchors.has(anchor)) error(essay, `duplicate section anchor: ${anchor}`);
      anchors.add(anchor);
    }

    if (block.type === 'voice') {
      if (!block.quote.trim()) error(essay, `voice block ${index + 1} has no quote`);
      if (!block.author.trim()) error(essay, `voice block ${index + 1} has no author`);
      if (!block.source.trim()) error(essay, `voice block ${index + 1} has no source`);
      if (block.sourceUrl && !/^https?:\/\//.test(block.sourceUrl)) {
        error(essay, `voice block ${index + 1} has an invalid sourceUrl`);
      }

      if (
        block.kind === 'historian' &&
        institutionalSourcePattern.test(`${block.author} ${block.source}`)
      ) {
        error(
          essay,
          `voice block ${index + 1} presents an institutional or museum source as a neutral historian`,
        );
      }
    }

    if (block.type === 'image') {
      if (!block.src.trim()) error(essay, `image block ${index + 1} has no src`);
      if (!block.alt.trim()) error(essay, `image block ${index + 1} has no alt`);
      if (!block.caption.trim()) error(essay, `image block ${index + 1} has no caption`);
      if (block.sourceUrl && !/^https?:\/\//.test(block.sourceUrl)) {
        error(essay, `image block ${index + 1} has an invalid sourceUrl`);
      }
      validateImagePath(essay, `image block ${index + 1}`, block.src);
    }

    if (block.type === 'poem' && !block.lines.trim()) {
      error(essay, `poem block ${index + 1} has no lines`);
    }

    if (block.type === 'reflection') {
      reflectionCount += 1;
    } else if (block.type === 'paragraph' || block.type === 'note' || block.type === 'poem') {
      const text = blockText(block);
      historicalBodyScriptureReferences += text.match(scriptureReferencePattern)?.length ?? 0;
    }
  });

  if (reflectionCount > 1) {
    warning(essay, `has ${reflectionCount} reflection blocks; keep the evangelical conclusion concentrated`);
  }

  if (historicalBodyScriptureReferences > 6) {
    warning(
      essay,
      `has ${historicalBodyScriptureReferences} Scripture references outside the final reflection; review for mechanical insertion`,
    );
  }
}

function validateSources(essay: Essay) {
  const sources = essay.sources ?? [];
  if (sources.length === 0) {
    warning(essay, 'has no source list');
    return;
  }

  const independentSources = sources.filter((source) => source.kind !== 'institutional');
  if (independentSources.length === 0) {
    error(
      essay,
      'relies only on institutional or memorial narratives; add primary documents, archives, or independent research',
    );
  }

  // Primary status is explicit. A FEB, museum, library, or archive domain does
  // not make every hosted page a primary source: an authorial text can be
  // primary, while a chronology or scholarly article on the same domain is not.
  const primarySources = sources.filter((source) => source.kind === 'primary');

  if (primarySources.length < 2) {
    warning(essay, `has only ${primarySources.length} explicitly classified primary sources`);
  }

  const minimum = sourceMinimums[essay.slug];
  if (minimum && sources.length < minimum.total) {
    error(essay, `requires at least ${minimum.total} sources; found ${sources.length}`);
  }
  if (minimum && primarySources.length < minimum.primary) {
    error(essay, `requires at least ${minimum.primary} explicitly classified primary sources; found ${primarySources.length}`);
  }

  const sourceIds = new Set<string>();
  const sourceUrls = new Set<string>();

  for (const [index, source] of sources.entries()) {
    const label = `source ${index + 1}`;
    if (!source.title.trim()) error(essay, `${label} has an empty title`);
    if (source.url && !/^https?:\/\//.test(source.url)) {
      error(essay, `${label} has an invalid URL: ${source.title}`);
    }
    if (source.kind && !allowedSourceKinds.has(source.kind)) {
      error(essay, `${label} has an invalid kind: ${source.kind}`);
    }
    if (source.id) {
      if (!/^[a-z0-9-]+$/.test(source.id)) error(essay, `${label} has an invalid id: ${source.id}`);
      if (sourceIds.has(source.id)) error(essay, `duplicate source id: ${source.id}`);
      sourceIds.add(source.id);
    } else if (minimum) {
      warning(essay, `${label} has no stable id`);
    }
    if (source.url) {
      const normalizedUrl = source.url.replace(/^http:/, 'https:').replace(/\/$/, '');
      if (sourceUrls.has(normalizedUrl)) error(essay, `duplicate source URL: ${source.url}`);
      sourceUrls.add(normalizedUrl);
    }
    if ((source.kind === 'primary' || source.kind === 'archive') && !source.institution) {
      warning(essay, `${label} should name its institution or collection`);
    }
    if ((source.kind === 'primary' || source.kind === 'archive' || source.kind === 'institutional') && !source.note) {
      warning(essay, `${label} should explain its evidentiary role and limitations`);
    }
    if (source.kind === 'institutional' && source.note && !/не замен|навигац|пересказ|огранич/i.test(source.note)) {
      warning(essay, `${label} institutional narrative should state that it does not replace the underlying document`);
    }
  }
}

function validateEditorialRegressions(essay: Essay) {
  const searchableText = [essay.title, essay.subtitle ?? '', essay.excerpt]
    .concat(essay.blocks.map(blockText))
    .join('\n');

  for (const marker of requiredContentMarkers[essay.slug] ?? []) {
    if (!searchableText.includes(marker)) {
      error(essay, `required verified content marker is missing: “${marker}”`);
    }
  }

  for (const marker of forbiddenContentMarkers[essay.slug] ?? []) {
    if (searchableText.includes(marker)) {
      error(essay, `superseded or misleading formulation returned: “${marker}”`);
    }
  }
}

const ids = new Set<string>();
const slugs = new Set<string>();

for (const essay of essays) {
  if (ids.has(essay.id)) error(essay, `duplicate essay id: ${essay.id}`);
  ids.add(essay.id);

  if (slugs.has(essay.slug)) error(essay, `duplicate essay slug: ${essay.slug}`);
  slugs.add(essay.slug);

  if (!/^[a-z0-9-]+$/.test(essay.slug)) error(essay, `invalid slug: ${essay.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(essay.date)) error(essay, `invalid date: ${essay.date}`);
  if (!Number.isInteger(essay.readTime) || essay.readTime <= 0) {
    error(essay, 'readTime must be a positive integer');
  }
  if (!essay.title.trim()) error(essay, 'title is empty');
  if (!essay.excerpt.trim()) error(essay, 'excerpt is empty');
  if (essay.blocks.length === 0) error(essay, 'has no content blocks');

  validateImagePath(essay, 'cover', essay.cover);
  validateImagePath(essay, 'cardCover', essay.cardCover);
  validateBlocks(essay, essay.blocks);
  validateSources(essay);
  validateEditorialRegressions(essay);
}

for (const message of warnings) console.warn(`WARN  ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);

console.log(
  `Essay validation: ${essays.length} essays, ${errors.length} errors, ${warnings.length} warnings`,
);

if (errors.length > 0) process.exit(1);

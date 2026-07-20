import fs from 'node:fs';
import path from 'node:path';
import { essays } from '../src/data/essays/index';
import { sectionAnchor } from '../src/components/essay/anchor';
import type { Essay, EssayBlock } from '../src/types/essay';

const errors: string[] = [];
const warnings: string[] = [];
const institutionalSourcePattern = /музей|мемориаль|выставк|фильм|кино/i;
const primarySourceUrlPattern = /feb-web\.ru|rvb\.ru|wikisource\.org/i;
const scriptureReferencePattern = /\((?:[1-3]\s*)?[А-ЯЁ][А-Яа-яё. ]+\s+\d+:\d+(?:[–-]\d+)?\)/g;

const requiredContentMarkers: Record<string, string[]> = {
  'yesenin-kutezhi': [
    '21 ноября 1923 года',
    '26 ноября по 21 декабря 1925 года',
    'под иконами умирать',
  ],
  'mayakovsky-gromovoy': [
    'Зрители до смешного поделились',
    'зал был переполнен молодёжью',
    'поэта-агитатора и поэта-пропагандиста',
  ],
  'brik-case': [
    'Так тяжело мне не было никогда',
    'добровольное заключение',
    'как дезертир',
  ],
};

const forbiddenContentMarkers: Record<string, string[]> = {
  'yesenin-kutezhi': [
    'был отдан особый приказ: Есенина задерживать',
  ],
  'mayakovsky-gromovoy': [
    'литературные организации и большинство известных писателей проигнорировали её открытие',
  ],
  'brik-case': [
    'Государственный музей Маяковского употребляет другие, более точные слова',
  ],
};

function error(essay: Essay, message: string) {
  errors.push(`${essay.slug}: ${message}`);
}

function warning(essay: Essay, message: string) {
  warnings.push(`${essay.slug}: ${message}`);
}

function validateImage(essay: Essay, field: 'cover' | 'cardCover', value?: string) {
  if (!value || /^https?:\/\//.test(value)) return;

  const relativePath = value.replace(/^\//, '');
  const absolutePath = path.resolve('public', relativePath);
  if (!fs.existsSync(absolutePath)) {
    warning(essay, `${field} is not present yet: ${value}`);
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

  const independentSources = sources.filter(
    (source) => !institutionalSourcePattern.test(source.title),
  );

  if (independentSources.length === 0) {
    error(
      essay,
      'relies only on museum, memorial, exhibition, or film sources; add primary or independent research',
    );
  }

  const primarySources = sources.filter((source) =>
    source.url ? primarySourceUrlPattern.test(source.url) : false,
  );

  if (primarySources.length < 2) {
    warning(essay, `has only ${primarySources.length} linked FEB/RVB/Wikisource primary sources`);
  }

  for (const source of sources) {
    if (source.url && !/^https?:\/\//.test(source.url)) {
      error(essay, `source has an invalid URL: ${source.title}`);
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

  validateImage(essay, 'cover', essay.cover);
  validateImage(essay, 'cardCover', essay.cardCover);
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

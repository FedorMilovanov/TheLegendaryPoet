import fs from 'node:fs';
import path from 'node:path';
import { essays } from '../src/data/essays/index';
import { sectionAnchor } from '../src/components/essay/anchor';
import type { Essay, EssayBlock } from '../src/types/essay';

const errors: string[] = [];
const warnings: string[] = [];

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

function validateBlocks(essay: Essay, blocks: EssayBlock[]) {
  const anchors = new Set<string>();

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
        // The renderer suppresses this defensively, so keep CI green while
        // still surfacing the source-data cleanup to editors.
        warning(essay, `adjacent duplicate section heading: “${heading}”`);
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
    }

    if (block.type === 'poem' && !block.lines.trim()) {
      error(essay, `poem block ${index + 1} has no lines`);
    }
  });
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
    error(essay, `readTime must be a positive integer`);
  }
  if (!essay.title.trim()) error(essay, 'title is empty');
  if (!essay.excerpt.trim()) error(essay, 'excerpt is empty');
  if (essay.blocks.length === 0) error(essay, 'has no content blocks');

  validateImage(essay, 'cover', essay.cover);
  validateImage(essay, 'cardCover', essay.cardCover);
  validateBlocks(essay, essay.blocks);
}

for (const message of warnings) console.warn(`WARN  ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);

console.log(
  `Essay validation: ${essays.length} essays, ${errors.length} errors, ${warnings.length} warnings`,
);

if (errors.length > 0) process.exit(1);

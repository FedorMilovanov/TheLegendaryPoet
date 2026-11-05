import type { Essay } from '../src/types/essay';
import { sectionAnchor } from '../src/components/essay/anchor';
import { getAllEssays } from '../src/data/essays/index';
import { prorokDraft } from '../src/data/essays/prorokDraft';
import { estimateReadTime } from '../src/utils/readTime';

/**
 * Validate staged long-form material without treating it as published content.
 *
 * Published essays already have their own source, image, route and release
 * contracts. This is the missing authoring boundary: a staged essay must not
 * silently acquire a date, cover, public route or dangling footnote before its
 * independent editorial and media-rights review. Add future staged drafts here.
 */
const drafts: readonly Omit<Essay, 'date' | 'cover'>[] = [prorokDraft];
const published = getAllEssays();
const errors: string[] = [];

const fail = (slug: string, message: string) => errors.push(`${slug}: ${message}`);

function validateDraft(draft: Omit<Essay, 'date' | 'cover'>): void {
  const slug = draft.slug;
  if (!/^[a-z0-9-]+$/.test(slug)) fail(slug, 'invalid slug');
  if (!draft.id.trim() || !draft.title.trim() || !draft.excerpt.trim()) {
    fail(slug, 'id, title and excerpt must not be empty');
  }
  if (!draft.blocks.length) fail(slug, 'missing content blocks');
  if (!draft.sources?.length) fail(slug, 'missing sources');
  if ('date' in draft || 'cover' in draft || 'cardCover' in draft) {
    fail(slug, 'raw editorial draft must not contain release date or cover metadata');
  }
  if (draft.readTime !== estimateReadTime(draft.blocks)) {
    fail(slug, 'readTime differs from canonical block content');
  }

  const matchingPublication = published.filter(
    (essay) => essay.id === draft.id || essay.slug === draft.slug,
  );
  if (matchingPublication.length > 1 ||
    (matchingPublication.length === 1 &&
      (matchingPublication[0].id !== draft.id || matchingPublication[0].slug !== draft.slug))) {
    fail(slug, 'conflicting published essay identity');
  }

  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const source of draft.sources ?? []) {
    if (!source.id || !/^[a-z0-9-]+$/.test(source.id) || ids.has(source.id)) {
      fail(slug, `missing, malformed or repeated source ID: ${source.id ?? '(none)'}`);
    }
    if (source.id) ids.add(source.id);
    if (!source.title.trim() || !source.note?.trim()) {
      fail(slug, `source ${source.id ?? '(none)'} needs a title and evidentiary note`);
    }
    if (!source.url) {
      fail(slug, `source ${source.id ?? '(none)'} needs a verifiable source URL`);
      continue;
    }
    try {
      const parsed = new URL(source.url);
      if (parsed.protocol !== 'https:') fail(slug, `source must use HTTPS: ${source.id}`);
      const normalized = `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}${parsed.search}`;
      if (urls.has(normalized)) fail(slug, `duplicate source URL: ${source.id}`);
      urls.add(normalized);
    } catch {
      fail(slug, `invalid source URL: ${source.id}`);
    }
  }

  const cited = new Set<string>();
  const anchors = new Set<string>();
  for (const [index, block] of draft.blocks.entries()) {
    if (block.type === 'section') {
      if (!block.heading.trim()) fail(slug, `empty section at block ${index + 1}`);
      const anchor = sectionAnchor(block.heading, block.anchor);
      if (!anchor.trim() || anchors.has(anchor)) {
        fail(slug, `empty or duplicate section anchor: ${anchor}`);
      }
      anchors.add(anchor);
    }
    if ('text' in block && typeof block.text === 'string' && !block.text.trim()) {
      fail(slug, `empty text at block ${index + 1}`);
    }
    if ('sourceIds' in block && block.sourceIds) {
      for (const id of block.sourceIds) {
        if (!ids.has(id)) fail(slug, `block ${index + 1} cites missing source: ${id}`);
        cited.add(id);
      }
    }
  }

  for (const id of ids) {
    if (!cited.has(id)) fail(slug, `unused source in bibliography: ${id}`);
  }

  // Once explicitly published, the canonical catalog and its publication
  // validators own date, cover provenance, SEO and browser-route authority.
  const status = matchingPublication.length ? 'published through canonical catalog' : 'staged only';
  console.log(
    `Editorial draft ${slug}: ${draft.blocks.length} blocks, ${anchors.size} sections, ${ids.size} cited sources, ${status}.`,
  );
}

for (const draft of drafts) validateDraft(draft);
for (const message of errors) console.error(`ERROR ${message}`);
if (errors.length) process.exit(1);
console.log(`Editorial draft contract: ${drafts.length} validated; 0 errors.`);

import type { EssayBlock } from '../types/essay';

/**
 * Reading time derived from the actual text of an essay.
 *
 * A hand-typed `readTime` drifts as soon as an article is edited: the published
 * site claimed 55 minutes for Part II, whose body is ~2 400 words (~14 min), and
 * was wrong by up to 3.9x on five of eight essays. Deriving it means the promise
 * on the card is always the promise the page keeps.
 *
 * 180 words/min is the usual figure for Russian non-fiction read attentively.
 * Verse is read far more slowly, so poem lines are weighted at a third of that.
 */
const PROSE_WORDS_PER_MINUTE = 180;
const VERSE_WORDS_PER_MINUTE = 60;

function countWords(value: string): number {
  return (value.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

/** Collect every reader-visible string from a block, split by reading speed. */
function blockText(block: EssayBlock): { prose: string[]; verse: string[] } {
  const prose: string[] = [];
  const verse: string[] = [];
  const b = block as Record<string, unknown>;

  const push = (target: string[], value: unknown) => {
    if (typeof value === 'string') target.push(value);
    else if (Array.isArray(value)) for (const item of value) push(target, item);
  };

  if (block.type === 'poem') {
    push(verse, b.lines);
    push(prose, b.note);
    push(prose, b.title);
  } else {
    for (const key of ['text', 'heading', 'caption', 'credit', 'note', 'quote', 'cite', 'subtitle']) {
      push(prose, b[key]);
    }
  }

  return { prose, verse };
}

/** Whole minutes of reading for a set of essay blocks; never below 1. */
export function estimateReadTime(blocks: EssayBlock[]): number {
  let proseWords = 0;
  let verseWords = 0;
  for (const block of blocks) {
    const { prose, verse } = blockText(block);
    for (const value of prose) proseWords += countWords(value);
    for (const value of verse) verseWords += countWords(value);
  }
  const minutes = proseWords / PROSE_WORDS_PER_MINUTE + verseWords / VERSE_WORDS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}

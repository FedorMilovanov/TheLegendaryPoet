/**
 * Site heading rule: English-style Title Case, adapted for Russian.
 *
 * Every significant word in a heading is capitalized; short function words
 * (prepositions, conjunctions, particles) stay lowercase — except the very
 * first (and, for hyphenated titles, the word right after a colon/dash),
 * which is always capitalized regardless of what it is.
 *
 * Text inside Russian guillemets is preserved exactly. This matters for names
 * of poems, books, plays and quoted phrases: «Про это» must never become
 * «Про Это» merely because the surrounding page heading uses Title Case.
 */

const SMALL_WORDS = new Set([
  'и', 'а', 'но', 'или', 'да', 'ни', 'же', 'ли', 'бы', 'то',
  'в', 'во', 'на', 'к', 'ко', 'с', 'со', 'у', 'о', 'об', 'обо',
  'из', 'изо', 'от', 'ото', 'до', 'по', 'за', 'над', 'надо', 'под', 'подо',
  'при', 'про', 'для', 'без', 'безо', 'через', 'между', 'меж', 'перед', 'передо',
  'около', 'вокруг', 'среди', 'внутри', 'вместо', 'кроме', 'после', 'ради',
  'что', 'чтобы', 'как', 'если', 'когда', 'пока', 'хотя', 'чем',
]);

function capitalizeWord(word: string): string {
  if (!word) return word;
  const match = word.match(/^([("'\-—]*)(.*)$/);
  if (!match) return word;
  const [, lead, rest] = match;
  if (!rest) return word;
  return lead + rest.charAt(0).toUpperCase() + rest.slice(1);
}

function lowercaseWord(word: string): string {
  const match = word.match(/^([("'\-—]*)(.*)$/);
  if (!match) return word;
  const [, lead, rest] = match;
  if (!rest) return word;
  return lead + rest.charAt(0).toLowerCase() + rest.slice(1);
}

interface TitleCaseOptions {
  /**
   * Set false when this string is a mid-heading fragment rather than a heading
   * in its own right. Otherwise a small first word may be force-capitalized.
   */
  isHeadingStart?: boolean;
}

function titleCaseUnquoted(text: string, isHeadingStart: boolean): string {
  return text
    .split(/(\s+)/)
    .map((token, i, tokens) => {
      if (/^\s+$/.test(token)) return token;

      const bare = token.replace(/[()"'.,!?:;]/g, '').toLowerCase();
      const isFirst = isHeadingStart && tokens.slice(0, i).every((part) => /^\s+$/.test(part));
      const prevToken = tokens[i - 2];
      const startsNewClause = prevToken != null && /[:—-]$/.test(prevToken.trim());

      if (SMALL_WORDS.has(bare) && !isFirst && !startsNewClause) {
        return lowercaseWord(token);
      }
      return capitalizeWord(token);
    })
    .join('');
}

/** Applies the site's heading rule while preserving quoted work titles. */
export function titleCase(text: string, options: TitleCaseOptions = {}): string {
  if (!text) return text;
  const { isHeadingStart = true } = options;

  const segments = text.split(/(«[^»]*»)/g);
  let visibleContentSeen = !isHeadingStart;

  return segments
    .map((segment) => {
      if (!segment) return segment;
      if (segment.startsWith('«') && segment.endsWith('»')) {
        visibleContentSeen = true;
        return segment;
      }

      const transformed = titleCaseUnquoted(segment, !visibleContentSeen);
      if (/\S/.test(segment)) visibleContentSeen = true;
      return transformed;
    })
    .join('');
}

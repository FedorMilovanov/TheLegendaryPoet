/**
 * Site heading rule: English-style Title Case, adapted for Russian.
 *
 * Every significant word in a heading is capitalized; short function words
 * (prepositions, conjunctions, particles) stay lowercase — except the very
 * first (and, for hyphenated titles, the word right after a colon/dash),
 * which is always capitalized regardless of what it is.
 *
 * Use on structural headings (page titles, section headings, kickers) —
 * not on proper nouns whose casing is already fixed (poet names), nor on
 * quoted verse/prose, which must keep the author's exact capitalization.
 */

// Russian prepositions, conjunctions and particles short enough to stay lowercase.
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
  // Preserve leading punctuation like « or ( when capitalizing the letter after it.
  const match = word.match(/^([«(\-—"']*)(.*)$/);
  if (!match) return word;
  const [, lead, rest] = match;
  if (!rest) return word;
  return lead + rest.charAt(0).toUpperCase() + rest.slice(1);
}

function lowercaseWord(word: string): string {
  const match = word.match(/^([«(\-—"']*)(.*)$/);
  if (!match) return word;
  const [, lead, rest] = match;
  if (!rest) return word;
  return lead + rest.charAt(0).toLowerCase() + rest.slice(1);
}

interface TitleCaseOptions {
  /**
   * Set false when this string is a mid-heading fragment (e.g. the tail half
   * of a heading split across two JSX nodes for styling) rather than a
   * heading in its own right — otherwise its first word gets force-capitalized
   * as if it opened the sentence, even when it's a small word like "и"/"с".
   */
  isHeadingStart?: boolean;
}

/** Applies the site's Title Case heading rule to a single line of text. */
export function titleCase(text: string, options: TitleCaseOptions = {}): string {
  if (!text) return text;
  const { isHeadingStart = true } = options;

  return text
    .split(/(\s+)/)
    .map((token, i, tokens) => {
      if (/^\s+$/.test(token)) return token;

      const bare = token.replace(/[«»()"'.,!?:;]/g, '').toLowerCase();
      const isFirst = isHeadingStart && tokens.slice(0, i).every((t) => /^\s+$/.test(t));
      // Treat the word right after a colon/dash/guillemet as a fresh "first word" too.
      const prevToken = tokens[i - 2];
      const startsNewClause = prevToken != null && /[:—-]$/.test(prevToken.trim());

      if (SMALL_WORDS.has(bare) && !isFirst && !startsNewClause) {
        return lowercaseWord(token);
      }
      return capitalizeWord(token);
    })
    .join('');
}

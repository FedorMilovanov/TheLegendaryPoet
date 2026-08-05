import { Fragment, type ReactNode } from 'react';
import { ruTypography } from '../../utils/typography';

/**
 * Inline rich-text helpers shared by every essay block.
 *
 * Authors write plain strings in the data files; these turn a tiny, safe subset
 * of markup into styled React nodes. No dangerouslySetInnerHTML, no parser
 * dependency — just the two conventions the whole engine agrees on.
 *
 * Russian typography (non-breaking spaces around dates, initials and units) is
 * applied here at render time, so editors never have to type `\u00A0` by hand
 * and a narrow column cannot strand `1921` away from `год`.
 */

/**
 * Wrap **double-asterisk** spans in glowing animated gold.
 *
 * Pass `verse` for poem lines and quoted documents: non-breaking spaces are
 * still applied (they only affect line breaking), but `...` is left exactly as
 * the poet wrote it.
 */
export function withGold(text: string, options: { verse?: boolean } = {}): ReactNode {
  const parts = ruTypography(text, { ellipsis: !options.verse }).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <span key={i} className="gold-gradient gold-glow-text font-medium">
        {part.slice(2, -2)}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** Split a text block into trimmed, non-empty paragraphs on blank lines. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Typography-normalised plain text, for blocks that render a bare string. */
export function withTypography(text: string, options: { verse?: boolean } = {}): string {
  return ruTypography(text, { ellipsis: !options.verse });
}

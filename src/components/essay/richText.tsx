import { Fragment, type ReactNode } from 'react';

/**
 * Inline rich-text helpers shared by every essay block.
 *
 * Authors write plain strings in the data files; these turn a tiny, safe subset
 * of markup into styled React nodes. No dangerouslySetInnerHTML, no parser
 * dependency — just the two conventions the whole engine agrees on.
 */

/** Wrap **double-asterisk** spans in glowing animated gold. */
export function withGold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
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

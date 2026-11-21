import type { EssaySource } from '../../types/essay';
import { passageStamp } from '../../utils/passageStamp';

/**
 * Single source of truth for section anchor ids.
 *
 * The rendered section heading (`<h2 id>`) and the table-of-contents links must
 * produce byte-identical anchors, or in-page navigation silently breaks. Both
 * sides call this one function so they can never drift.
 */
export function sectionAnchor(heading: string, explicit?: string): string {
  if (explicit) return explicit;
  return (
    'sec-' +
    heading
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
  );
}

/** Keep published citation IDs. Bibliography-only entries have an address
 * independent of their filter, expansion state or position in the list. */
export function sourceAnchor(source: EssaySource) {
  return 'source-' + (source.id ?? `ref.${passageStamp(source.url ?? source.title)}`);
}

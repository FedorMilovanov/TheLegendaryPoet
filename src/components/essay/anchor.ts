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

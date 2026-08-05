/**
 * Russian typography normalisation, applied at render time.
 *
 * Editors write plain text in the data files; this puts the non-breaking spaces
 * and the ellipsis character in place so that a narrow reading column cannot
 * strand a date, an initial or a unit on its own line.
 *
 * Deliberately conservative — it only fixes cases that are unambiguous in
 * Russian typesetting and can never change the meaning of a quotation:
 *
 *  - `1921 год` / `1925 г.`     → year glued to its unit
 *  - `С. А. Есенин`             → initials glued together and to the surname
 *  - `12 мин`, `с. 42`, `т. 3`  → number glued to its unit or unit to its number
 *  - one-letter prepositions    → glued to the word they govern
 *  - `...`                      → `…` (never inside `<...>`, the scholarly
 *                                 omission marker, which must stay verbatim)
 *
 * It does NOT touch quotation marks, dashes, word order or capitalisation:
 * verse and quoted documents must render exactly as the editor entered them.
 */

const NB = '\u00A0';

/** Scholarly omission marker `<...>` must survive ellipsis normalisation. */
const OMISSION = '<...>';
const OMISSION_TOKEN = '\u0000OMISSION\u0000';

/** One- and two-letter words that must not end a line. */
const SHORT_WORDS = 'а|и|о|у|в|к|с|я|бы|же|ли|бо|во|ко|со|об|от|до|по|за|на|не|ни|из';

/**
 * NOTE: JavaScript `\b` is defined on ASCII `[A-Za-z0-9_]`, so it does NOT
 * create a boundary next to a Cyrillic letter. Every boundary below is written
 * as an explicit look-around instead — using `\b` here silently matches nothing.
 */
const CYR = 'А-Яа-яЁё';

export interface RuTypographyOptions {
  /**
   * Convert `...` to `…`. Disable for verse and for quoted documents, where the
   * author's exact characters are canonical and must not be normalised.
   * Non-breaking spaces are still applied: they change line breaking only,
   * never the characters a reader sees or copies.
   */
  ellipsis?: boolean;
}

export function ruTypography(input: string, options: RuTypographyOptions = {}): string {
  if (!input) return input;
  const { ellipsis = true } = options;

  let text = input.split(OMISSION).join(OMISSION_TOKEN);

  // `...` → `…` (the omission marker is already protected above).
  if (ellipsis) text = text.replace(/\.{3,}/g, '…');

  // Initials: `С. А. Есенин` → all three joined.
  text = text.replace(
    /([А-ЯЁ]\.)\s+([А-ЯЁ]\.)\s+(?=[А-ЯЁ])/g,
    `$1${NB}$2${NB}`,
  );
  // Single initial before a surname: `А. Блок`.
  text = text.replace(
    new RegExp(`(?<![${CYR}])([А-ЯЁ]\\.)\\s+(?=[А-ЯЁ][а-яё])`, 'g'),
    `$1${NB}`,
  );

  // Number followed by a unit: `1921 год`, `12 мин`, `5 л.`.
  text = text.replace(
    new RegExp(
      `(\\d)\\s+(год[ауеов]{0,3}(?![${CYR}])|гг\\.|г\\.|мин(?![${CYR}])|сек(?![${CYR}])|с\\.|стр\\.|л\\.|т\\.|кн\\.|№)`,
      'g',
    ),
    `$1${NB}$2`,
  );
  // Unit followed by a number: `с. 42`, `№ 2028`, `т. 3`.
  text = text.replace(
    new RegExp(`(?<![${CYR}])(с\\.|стр\\.|л\\.|т\\.|кн\\.|гл\\.|№)\\s+(?=\\d)`, 'g'),
    `$1${NB}`,
  );

  // Short words must not be left hanging at the end of a line.
  text = text.replace(
    new RegExp(`(^|[\\s(«"'—-])(${SHORT_WORDS})\\s+`, 'gi'),
    `$1$2${NB}`,
  );

  // Em dash keeps company with the word before it.
  text = text.replace(/\s+—/g, `${NB}—`);

  return text.split(OMISSION_TOKEN).join(OMISSION);
}

/** Apply {@link ruTypography} to every string in a template literal. */
export function ruYear(year: number | string, unit = 'год'): string {
  return `${year}${NB}${unit}`;
}

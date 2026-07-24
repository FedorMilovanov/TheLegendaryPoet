export interface YeseninPartOneMcVayResearchCheck {
  id: `MCVAY-P5-${string}`;
  row: number;
  ledgerLabel: string;
  layer: 'research-check';
  publicationAuthorized: false;
}

export const YESENIN_MCVAY_USER_SOURCE_ID = 'USR-YE1-MCVAY-ISADORA-ESENIN-1980' as const;

/**
 * Explicit IDs for the 44 McVay/Duncan control checks.
 *
 * These are internal research checks, not public bibliography entries. Each ID
 * is bound to one numbered ledger row and its exact label so a row cannot be
 * reordered, renamed or replaced while prose citations remain silently green.
 */
export const yeseninPartOneMcVayResearchChecks = [
  { id: 'MCVAY-P5-001', row: 1, ledgerLabel: 'Автор, название, год и объём книги McVay', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-002', row: 2, ledgerLabel: 'Идентичность пользовательского файла', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-003', row: 3, ledgerLabel: 'Интервью McVay с современниками', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-004', row: 4, ledgerLabel: 'Использованные архивы', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-005', row: 5, ledgerLabel: 'Подробный аппарат notes/bibliography/index', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-006', row: 6, ledgerLabel: 'Место встречи — мастерская Якулова', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-007', row: 7, ledgerLabel: 'Точная дата неизвестна McVay', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-008', row: 8, ledgerLabel: 'Академическая дата `видимо, 3 октября`', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-009', row: 9, ledgerLabel: 'Указатель ПСС даёт 3 октября без qualifier', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-010', row: 10, ledgerLabel: 'Сцена Mariengof', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-011', row: 11, ledgerLabel: 'Анти-Duncan causal bias Mariengof', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-012', row: 12, ledgerLabel: 'Mary Desti version', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-013', row: 13, ledgerLabel: 'Sabaneev version', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-014', row: 14, ledgerLabel: 'Georgy Ivanov version', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-015', row: 15, ledgerLabel: 'Ivan Startsev mirror/lipstick variant', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-016', row: 16, ledgerLabel: 'Shneider: autumn and before 7 November', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-017', row: 17, ledgerLabel: 'Shneider personally met Esenin 8 November', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-018', row: 18, ledgerLabel: 'Konenkov confirms Yakulov party', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-019', row: 19, ledgerLabel: 'Gorodetsky observes relationship as established fact', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-020', row: 20, ledgerLabel: 'Duncan arrival: 23 July 1921', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-021', row: 21, ledgerLabel: 'McVay gives early 24 July arrival', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-022', row: 22, ledgerLabel: 'Departure from Reval on 20 July', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-023', row: 23, ledgerLabel: 'Lunacharsky article `Наша гостья`, 24 August', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-024', row: 24, ledgerLabel: 'Duncan letter dated 6 September', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-025', row: 25, ledgerLabel: 'House at Prechistenka 20', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-026', row: 26, ledgerLabel: 'First Moscow recital on 7 November', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-027', row: 27, ledgerLabel: 'Pravda/Izvestia response on 9 November', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-028', row: 28, ledgerLabel: 'Debate `Нужен ли Большой театр?`, 10 November', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-029', row: 29, ledgerLabel: 'Duncan `Искусство для масс`, 23 November', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-030', row: 30, ledgerLabel: 'Official school opening 3 December', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-031', row: 31, ledgerLabel: 'Number of pupils: 25 / 40 / 50', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-032', row: 32, ledgerLabel: 'Divorce from Zinaida Reich: 5 October 1921', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-033', row: 33, ledgerLabel: 'Registered marriage with Duncan: 2 May 1922', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-034', row: 34, ledgerLabel: 'Second registration abroad', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-035', row: 35, ledgerLabel: 'Departure to Germany: 10 May 1922', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-036', row: 36, ledgerLabel: "Esenin's state in December 1921", layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-037', row: 37, ledgerLabel: 'Esenin on Duncan and Europe, 21 June 1922', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-038', row: 38, ledgerLabel: 'Known correspondence count', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-039', row: 39, ledgerLabel: 'Break telegram, 13 October 1923', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-040', row: 40, ledgerLabel: 'Retrospective autobiography says `1921 married`', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-041', row: 41, ledgerLabel: 'NYPL Isadora programs and announcements', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-042', row: 42, ledgerLabel: 'Mariengof editions in RSL', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-043', row: 43, ledgerLabel: 'External bibliography for McVay book', layer: 'research-check', publicationAuthorized: false },
  { id: 'MCVAY-P5-044', row: 44, ledgerLabel: 'Does this replace `Esenin: A Life`?', layer: 'research-check', publicationAuthorized: false },
] as const satisfies readonly YeseninPartOneMcVayResearchCheck[];

export const yeseninPartOneMcVayResearchCheckIds = new Set<string>([
  YESENIN_MCVAY_USER_SOURCE_ID,
  ...yeseninPartOneMcVayResearchChecks.map((check) => check.id),
]);

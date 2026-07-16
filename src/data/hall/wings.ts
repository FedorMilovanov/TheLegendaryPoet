/**
 * Hall of Poets v3 — spatial / curatorial layout.
 *
 * Matches the temple reference (reference/hall_target_v3_temple.webp):
 * a central atrium and four wings by era. This is the single source of truth
 * for both the museum vestibule (DOM, Pass 1) and any future R3F rebuild.
 *
 * Poet ids MUST match src/data/library/* (e.g. "alexander-pushkin").
 */

export type HallWingId = 'golden' | 'silver' | 'soviet' | 'modern';

export interface HallWing {
  id: HallWingId;
  /** Roman numeral as on the floor compass. */
  numeral: 'I' | 'II' | 'III' | 'IV';
  /** Full wing title for headings. */
  title: string;
  /** Short label for the compass plate. */
  shortTitle: string;
  /** Years / era span, editorial. */
  era: string;
  /** Warm museum accent (not cyan-space). */
  accent: string;
  /** Soft fill for cards / glow. */
  accentSoft: string;
  /** Curatorial blurb — sober, no invented history. */
  description: string;
  /** Poet library ids, left-to-right in the wing. */
  poetIds: string[];
}

/**
 * Four wings. Poets are placed by literary-historical consensus:
 *  I  Golden Age        — Pushkin circle / pure gold age
 *  II Silver Age        — symbolism, acmeism, early 20th c.
 *  III Soviet century   — poets whose public fate was Soviet-era
 *  IV  Contemporary     — reserved (empty for now; honest empty state)
 */
export const hallWings: HallWing[] = [
  {
    id: 'golden',
    numeral: 'I',
    title: 'Зал Золотого века',
    shortTitle: 'Золотой век',
    era: 'XIX век',
    accent: '#d4af37',
    accentSoft: 'rgba(212, 175, 55, 0.14)',
    description:
      'Классика русской словесности: от Пушкина и Лермонтова к философской и пейзажной лирике Тютчева и Фета.',
    poetIds: [
      'alexander-pushkin',
      'mikhail-lermontov',
      'fyodor-tyutchev',
      'afanasy-fet',
    ],
  },
  {
    id: 'silver',
    numeral: 'II',
    title: 'Зал Серебряного века',
    shortTitle: 'Серебряный век',
    era: 'рубеж XIX–XX',
    accent: '#c9b896',
    accentSoft: 'rgba(201, 184, 150, 0.14)',
    description:
      'Символизм, акмеизм, деревенская лирика: Блок, Гумилёв, Ахматова, Есенин — разные голоса одной эпохи.',
    poetIds: [
      'alexander-blok',
      'nikolay-gumilev',
      'anna-akhmatova',
      'sergei-yesenin',
    ],
  },
  {
    id: 'soviet',
    numeral: 'III',
    title: 'Зал советской поэзии',
    shortTitle: 'Советская поэзия',
    era: 'XX век',
    accent: '#a89984',
    accentSoft: 'rgba(168, 153, 132, 0.14)',
    description:
      'Голоса, чья публичная судьба прошла через советское столетие: Маяковский и Пастернак — без упрощения и мифологизации.',
    poetIds: ['vladimir-mayakovsky', 'boris-pasternak'],
  },
  {
    id: 'modern',
    numeral: 'IV',
    title: 'Зал современных поэтов',
    shortTitle: 'Современные поэты',
    era: 'XXI век',
    accent: '#8a7a62',
    accentSoft: 'rgba(138, 122, 98, 0.12)',
    description:
      'Крыло зарезервировано. Когда появятся выверенные материалы о поэтах новейшего времени — они займут место здесь.',
    poetIds: [],
  },
];

export function getWingById(id: HallWingId): HallWing | undefined {
  return hallWings.find((w) => w.id === id);
}

/** Flat ordered list of all poet ids currently hung in the hall. */
export function getHallPoetIds(): string[] {
  return hallWings.flatMap((w) => w.poetIds);
}

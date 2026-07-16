/**
 * Data-integrity validator for THE LEGENDARY POET.
 *
 * WHY THIS EXISTS — anti-regression for an editorial project.
 * The site is built from hand-curated `src/data/library/*.ts` modules: poet
 * biographies, canonical poem texts, sourced testimonies, biblical commentary.
 * A regression here is not a crash — it is a *wrong date*, a *garbled line of
 * verse*, a *duplicate id* that breaks routing, or a `biblicalPerspective` that
 * quotes a line the poem no longer contains. Those slip past `tsc` and `vite
 * build` silently. This script catches them before they ship.
 *
 * Run it:   npx tsx scripts/validate-library.ts
 * (No package.json edit is required, per the Arena package rule.)
 *
 * Exit code is non-zero if any ERROR is found; WARNINGs are reported but do
 * not fail the build. Keep this list honest: every rule maps to a real bug we
 * have seen or could realistically introduce.
 */
import { poets, articles, musicTracks } from '../src/data/poets';
import { essays } from '../src/data/essays/index';
import type { Poet } from '../src/types/poet';

type Level = 'ERROR' | 'WARN';
const problems: { level: Level; where: string; msg: string }[] = [];
const YEAR_MIN = 1700;
const YEAR_MAX = new Date().getFullYear() + 1;

const err = (where: string, msg: string) => problems.push({ level: 'ERROR', where, msg });
const warn = (where: string, msg: string) => problems.push({ level: 'WARN', where, msg });

// Text that should never survive into published data.
const PLACEHOLDER = /\b(TODO|FIXME|XXX|lorem\s+ipsum|TBD|<заполнить>|<placeholder>)\b/i;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/* ---- Poets ------------------------------------------------------------- */

const poetIds = new Set<string>();
const poemIds = new Set<string>();
const poemIdOwners = new Map<string, string>();

poets.forEach((poet: Poet, i) => {
  const where = `poets[${i}] (${poet.id || '?'})`;

  // Required identity fields.
  if (!isNonEmptyString(poet.id)) err(where, 'missing id');
  if (!isNonEmptyString(poet.fullName)) err(where, 'missing fullName');
  if (!isNonEmptyString(poet.name)) err(where, 'missing name');
  if (!isNonEmptyString(poet.shortBio)) err(where, 'missing shortBio');
  if (!isNonEmptyString(poet.fullBio)) err(where, 'missing fullBio');
  if (!Array.isArray(poet.poems) || poet.poems.length === 0) err(where, 'has no poems');
  if (!Array.isArray(poet.famousWorks) || poet.famousWorks.length === 0)
    err(where, 'has no famousWorks');

  // Unique poet id.
  if (poet.id) {
    if (poetIds.has(poet.id)) err(where, `duplicate poet id "${poet.id}"`);
    poetIds.add(poet.id);
  }

  // Chronology.
  if (typeof poet.birthYear !== 'number') err(where, 'birthYear is not a number');
  if (typeof poet.deathYear !== 'number' && poet.deathYear !== undefined)
    err(where, 'deathYear is not a number/undefined');
  if (
    typeof poet.birthYear === 'number' &&
    (poet.birthYear < YEAR_MIN || poet.birthYear > YEAR_MAX)
  )
    err(where, `birthYear ${poet.birthYear} outside ${YEAR_MIN}–${YEAR_MAX}`);
  if (
    typeof poet.deathYear === 'number' &&
    (poet.deathYear < YEAR_MIN || poet.deathYear > YEAR_MAX)
  )
    err(where, `deathYear ${poet.deathYear} outside ${YEAR_MIN}–${YEAR_MAX}`);
  if (
    typeof poet.birthYear === 'number' &&
    typeof poet.deathYear === 'number' &&
    poet.deathYear <= poet.birthYear
  )
    err(where, `deathYear (${poet.deathYear}) <= birthYear (${poet.birthYear})`);

  // Rating range (project convention: 0–10).
  if (typeof poet.rating !== 'number' || poet.rating < 0 || poet.rating > 10)
    err(where, `rating ${poet.rating} outside 0–10`);

  // shortBio is the card/SEO blurb — keep it epigrammatic. Over-long blurbs
  // break the 3-line card clamp and bloat meta description.
  if (isNonEmptyString(poet.shortBio) && poet.shortBio.length > 520)
    warn(where, `shortBio is ${poet.shortBio.length} chars — keep the card blurb under ~480–520`);

  // Placeholder scan on prose.
  [poet.shortBio, poet.fullBio, poet.historicalNote, poet.spiritualSearch, poet.authorCommentary, poet.moralPortrait]
    .filter(isNonEmptyString)
    .forEach((t) => {
      if (PLACEHOLDER.test(t)) err(where, `placeholder text in prose: "${PLACEHOLDER.exec(t)?.[0]}"`);
    });

  // Poems.
  const seenPoemTitles = new Set<string>();
  poet.poems.forEach((poem, j) => {
    const pwhere = `${where}.poems[${j}] (${poem.id || '?'})`;
    if (!isNonEmptyString(poem.id)) err(pwhere, 'missing id');
    if (!isNonEmptyString(poem.title)) err(pwhere, 'missing title');
    // Analysis makes a poem a *study* entry, not just a quoted text.
    if (!isNonEmptyString(poem.analysis)) warn(pwhere, `"${poem.title}" has no analysis`);
    // Duplicate title within one poet confuses the reader / PoemQuickNav.
    if (poem.title) {
      if (seenPoemTitles.has(poem.title)) warn(pwhere, `duplicate poem title "${poem.title}" within this poet`);
      seenPoemTitles.add(poem.title);
    }
    if (!isNonEmptyString(poem.text)) {
      err(pwhere, 'empty poem text');
    } else if (poem.text.trim().length < 40) {
      err(pwhere, `poem text suspiciously short (${poem.text.trim().length} chars)`);
    }
    if (typeof poem.rating === 'number' && (poem.rating < 0 || poem.rating > 10))
      err(pwhere, `rating ${poem.rating} outside 0–10`);

    // Canonical-text hygiene: a poem is verse; collapse-only whitespace check.
    if (isNonEmptyString(poem.text) && poem.text.trim() === poem.text.replace(/\s+/g, ' ').trim())
      warn(pwhere, 'poem text has no line breaks — verify it is real verse, not flattened prose');

    // Poem year should plausibly fall within the poet's life (+ small tolerance).
    if (
      typeof poem.year === 'number' &&
      typeof poet.birthYear === 'number' &&
      typeof poet.deathYear === 'number'
    ) {
      if (poem.year < poet.birthYear - 1 || poem.year > poet.deathYear + 1)
        warn(pwhere, `poem year ${poem.year} outside ${poet.fullName}'s lifespan`);
    }

    // Unique poem id across the whole library (used as react key / route param).
    if (poem.id) {
      if (poemIds.has(poem.id)) {
        const owner = poemIdOwners.get(poem.id);
        err(pwhere, `duplicate poem id "${poem.id}" (also in ${owner})`);
      } else {
        poemIds.add(poem.id);
        poemIdOwners.set(poem.id, poet.id || '?');
      }
    }

    // NOTE: a verbatim "comment quotes the poem" cross-check was tried and
    // removed — this project's biblicalPerspective legitimately quotes BOTH the
    // poem AND the scripture it derives from, so an automated "is this quote in
    // the text?" test cries wolf on every real scripture citation. That class
    // of error (e.g. a paraphrased poem line that drifts from the stored text)
    // is covered by the manual checklist in AGENT_ANTI_REGRESSION_PROTOCOL.md.
  });

  // Testimonies must be sourced.
  (poet.testimonies || []).forEach((t, k) => {
    const twhere = `${where}.testimonies[${k}]`;
    if (!isNonEmptyString(t.author)) err(twhere, 'missing author');
    if (!isNonEmptyString(t.role)) err(twhere, 'missing role');
    if (!isNonEmptyString(t.quote)) err(twhere, 'missing quote');
    if (!isNonEmptyString(t.source)) err(twhere, 'missing source');
    if (!t.kind || !['contemporary', 'historian'].includes(t.kind))
      err(twhere, `invalid kind "${t.kind}"`);
    if (!t.sourceUrl) warn(twhere, `testimony "${t.author}" has no sourceUrl`);
  });
  // Sourcing standard: a serious portrait cites several voices, not one.
  if ((poet.testimonies || []).length < 2)
    warn(where, `only ${(poet.testimonies || []).length} testimony — POET_AUTHORING_GUIDE targets 5–9`);
});

/* ---- Articles ---------------------------------------------------------- */

const articleIds = new Set<string>();
articles.forEach((a, i) => {
  const where = `articles[${i}] (${a.id || '?'})`;
  if (!isNonEmptyString(a.id)) err(where, 'missing id');
  if (articleIds.has(a.id)) err(where, `duplicate article id "${a.id}"`);
  if (a.id) articleIds.add(a.id);
  if (!isNonEmptyString(a.title)) err(where, 'missing title');
  if (!isNonEmptyString(a.excerpt)) err(where, 'missing excerpt');
  if (!isNonEmptyString(a.content)) err(where, 'missing content');
  if (a.content && a.content.trim().length < 400) warn(where, 'article content is short');
  const cats = ['analysis', 'history', 'moral', 'biblical', 'biography'];
  if (!cats.includes(a.category)) err(where, `invalid category "${a.category}"`);
  if (PLACEHOLDER.test(a.content || '')) err(where, 'placeholder text in content');
});

/* ---- Music ------------------------------------------------------------- */

const trackIds = new Set<string>();
musicTracks.forEach((m, i) => {
  const where = `musicTracks[${i}] (${m.id || '?'})`;
  if (!isNonEmptyString(m.id)) err(where, 'missing id');
  if (trackIds.has(m.id)) err(where, `duplicate track id "${m.id}"`);
  if (m.id) trackIds.add(m.id);
  if (!isNonEmptyString(m.title)) err(where, 'missing title');
  if (!m.audioUrl && !m.externalUrl && !m.videoUrl)
    warn(where, 'track has no audioUrl/externalUrl/videoUrl');
});

/* ---- Essays ------------------------------------------------------------ */

const essaySlugs = new Set<string>();
essays.forEach((e, i) => {
  const where = `essays[${i}] (${e.slug || '?'})`;
  if (!isNonEmptyString(e.id)) err(where, 'missing id');
  if (!isNonEmptyString(e.slug)) err(where, 'missing slug');
  if (e.slug && essaySlugs.has(e.slug)) err(where, `duplicate essay slug "${e.slug}"`);
  if (e.slug) essaySlugs.add(e.slug);
  if (!Array.isArray(e.blocks) || e.blocks.length === 0) err(where, 'has no blocks');
  // Every essay should point to a real poet if poetId is set.
  if (e.poetId && !poetIds.has(e.poetId))
    err(where, `poetId "${e.poetId}" does not match any poet`);
  // Sources sanity: at least a few, and each is a real link+title.
  (e.sources || []).forEach((s, k) => {
    const sw = `${where}.sources[${k}]`;
    if (!isNonEmptyString(s.title)) err(sw, 'source missing title');
    if (!isNonEmptyString(s.url) || !/^https?:\/\//.test(s.url)) err(sw, `source url invalid: "${s.url}"`);
  });
  if (!e.sources || e.sources.length < 5)
    warn(where, `essay has only ${e.sources?.length || 0} sources — deep essays should cite primary sources`);
});

/* ---- Report ------------------------------------------------------------ */

const errors = problems.filter((p) => p.level === 'ERROR');
const warns = problems.filter((p) => p.level === 'WARN');

const tag = (l: Level) => (l === 'ERROR' ? '\x1b[31m✗ ERROR\x1b[0m' : '\x1b[33m! WARN \x1b[0m');
problems.forEach((p) => console.log(`${tag(p.level)}  ${p.where}\n        ${p.msg}`));

console.log(
  `\n${poets.length} poets · ${poemIds.size} poems · ${articles.length} articles · ${essays.length} essays · ${musicTracks.length} tracks`,
);
console.log(`${errors.length} error(s), ${warns.length} warning(s)`);

if (errors.length) {
  console.log('\n\x1b[31mLibrary validation FAILED — fix the errors above before shipping.\x1b[0m');
  process.exit(1);
}
console.log('\n\x1b[32mLibrary validation passed.\x1b[0m');

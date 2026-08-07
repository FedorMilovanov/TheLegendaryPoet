import { existsSync, readFileSync } from 'node:fs';
import { getAllEssays, getEssayBySlug } from '../src/data/essays/index';

const slug = 'sergei-yesenin-1921-1925';
const essays = getAllEssays();
const essay = getEssayBySlug(slug);
if (!essay) throw new Error(`Part II is not registered: ${slug}`);
const ledgerPath = 'docs/research/YESENIN_PART_II_PUBLICATION_SOURCE_LEDGER_2026-08.md';

if (!existsSync(ledgerPath)) throw new Error(`missing public source ledger: ${ledgerPath}`);
const ledger = readFileSync(ledgerPath, 'utf8');

if (essay.id !== 'essay-yesenin-biography-part-two') throw new Error('unexpected Part II essay id');
if (essay.slug !== 'sergei-yesenin-1921-1925') throw new Error('unexpected Part II slug');
if (essay.series?.part !== 2 || essay.series.total !== 2) {
  throw new Error('Yesenin biography series metadata is not 2 of 2');
}
/*
 * Guard the actual longform scope, not the advertised label.
 *
 * This used to assert `readTime >= 45`, which only proved that a number in a
 * data file was large: the body is ~2 400 words (~13 min), so CI was actively
 * requiring the site to overstate the reading time by roughly 4x. Reading time
 * is now derived from the text, so the meaningful invariant is the amount of
 * text itself.
 */
const partTwoWords = essay.blocks
  .flatMap((block) => {
    const value = block as Record<string, unknown>;
    return ['text', 'heading', 'caption', 'note', 'quote', 'lines']
      .flatMap((key) => (Array.isArray(value[key]) ? (value[key] as unknown[]) : [value[key]]))
      .filter((item): item is string => typeof item === 'string');
  })
  .reduce((total, text) => total + (text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0), 0);

if (partTwoWords < 2000) {
  throw new Error(`Part II body was compressed below longform scope: ${partTwoWords} words`);
}
if (essay.coverKind !== 'archive') throw new Error('Part II cover must remain an archive image');
if (!essay.coverSourceUrl?.includes('commons.wikimedia.org/wiki/File:Esenin1925.jpg')) {
  throw new Error('Part II cover lost its public-domain provenance URL');
}
if (!essay.coverCredit?.includes('общественное достояние')) {
  throw new Error('Part II cover lost its public-domain credit');
}

const registered = essays.filter((item) => item.slug === essay.slug);
if (registered.length !== 1 || registered[0] !== essay) {
  throw new Error('Part II is not registered exactly once in the canonical essay catalog');
}

const expectedHeadings = [
  '1921: слава, групповая машина и внутренняя трещина',
  'Айседора Дункан: встреча после снятия легенды',
  'Брак, паспорт и публичная пара',
  'Берлин: книги, деньги и литературная работа',
  'Европа: совершённый маршрут и объявленные планы',
  'Америка: гастрольная машина и отчуждение',
  'Что действительно было написано за границей',
  'Возвращение: Москва после Запада',
  '«Москва кабацкая»: роль, рынок и документированные эпизоды',
  'Имажинизм после единства',
  'Галина Бениславская: рукописи и издательские дела',
  'Кавказ и воображаемая Персия',
  'Поздняя поэзия: ясность без посмертного диагноза',
  'Софья Толстая и клиника: попытка порядка',
  'Декабрь 1925 года: что устанавливают документы',
  'После легенды: дар и ответственность',
] as const;

const headings = essay.blocks
  .filter((block) => block.type === 'section')
  .map((block) => block.heading);
if (headings.length !== expectedHeadings.length) {
  throw new Error(`expected 16 sections, found ${headings.length}`);
}
for (const heading of expectedHeadings) {
  if (!headings.includes(heading)) throw new Error(`missing final Part II section: ${heading}`);
}

const proseBlocks = essay.blocks.filter(
  (block) => block.type === 'lead' || block.type === 'paragraph' || block.type === 'note',
);
if (proseBlocks.length < 45) {
  throw new Error(`Part II is too compressed: ${proseBlocks.length} prose blocks`);
}

const articleText = [essay.title, essay.subtitle ?? '', essay.excerpt]
  .concat(
    essay.blocks.map((block) => {
      if ('text' in block) return block.text;
      if (block.type === 'section') return block.heading;
      if (block.type === 'image') return `${block.alt} ${block.caption} ${block.credit ?? ''}`;
      if (block.type === 'poem') return `${block.title ?? ''} ${block.lines} ${block.note ?? ''}`;
      if (block.type === 'voice') return `${block.quote} ${block.author} ${block.source}`;
      return '';
    }),
  )
  .join('\n');

if (articleText.length < 18_000) {
  throw new Error(`Part II reader text is below the longform floor: ${articleText.length} characters`);
}
for (const marker of [
  'юридической депортации',
  'не доказывают физического присутствия автора в Иране',
  'не объясняют административный или медицинский механизм окончания лечения',
  'Вопрос не равен доказательству',
  'официальная версия не имела документов» неверно',
  'совершенный суд над сердцем принадлежит Богу',
  'Главное произведение Есенина — не его смерть',
]) {
  if (!articleText.includes(marker)) throw new Error(`Part II lost a required reader boundary: ${marker}`);
}
for (const unsafe of [
  /Есенина (?:доказанно|точно) убили/iu,
  /Дункан (?:погубила|уничтожила) Есенина/iu,
  /Есенин (?:побывал|жил) в (?:Персии|Иране)/iu,
  /клиника[^.]{0,100}точный диагноз/iu,
  /удостоверение\s*№\s*1037/iu,
  /Ганнушкин[^.]{0,100}(?:поставил диагноз|диагностировал|лечил Есенина|лечащий врач Есенина)/iu,
  /вне всяких сомнений[^.]{0,100}предсмертн/iu,
  /Эта часть биографии не пытается/iu,
  /evidence class/iu,
]) {
  if (unsafe.test(articleText)) throw new Error(`Part II contains an unsupported or service-style claim: ${unsafe}`);
}

const myths = essay.blocks.filter((block) => block.type === 'note' && block.variant === 'myth');
if (myths.length !== 4) throw new Error(`expected 4 restrained myth checks, found ${myths.length}`);
const reflections = essay.blocks.filter((block) => block.type === 'reflection');
if (reflections.length !== 1) throw new Error(`expected one concentrated reflection, found ${reflections.length}`);

const images = essay.blocks.filter((block) => block.type === 'image');
if (images.length < 3) throw new Error(`expected at least 3 rights-cleared archive images, found ${images.length}`);
for (const [index, image] of images.entries()) {
  if (image.kind !== 'archive') throw new Error(`image ${index + 1} is not classified as archive`);
  if (!image.sourceUrl?.startsWith('https://commons.wikimedia.org/wiki/File:')) {
    throw new Error(`image ${index + 1} lacks Wikimedia Commons provenance`);
  }
  if (!image.credit?.includes('общественное достояние')) {
    throw new Error(`image ${index + 1} lacks a public-domain credit`);
  }
  if (/тело|петл|rope|autopsy|посмертн(?:ая|ое) фотограф/iu.test(`${image.src} ${image.alt} ${image.caption}`)) {
    throw new Error(`image ${index + 1} violates the dignity/forensic visual boundary`);
  }
}

const sources = essay.sources ?? [];
const sourceIds = new Set(sources.map((source) => source.id).filter((id): id is string => Boolean(id)));
if (sourceIds.size < 14) throw new Error(`Part II bibliography is too small: ${sourceIds.size} stable ids`);

const requiredOfficialUrls: Record<string, RegExp> = {
  'yes2-letopis-t3-k1': /^https:\/\/biblio\.imli\.ru\//,
  'yes2-letopis-t3-k2': /^https:\/\/biblio\.imli\.ru\//,
  'yes2-letopis-t5-k1': /^https:\/\/biblio\.imli\.ru\//,
  'yes2-pss-chronology': /^https:\/\/www\.museum-esenin\.ru\//,
  'yes2-pss-letters-vol6': /^https:\/\/feb-web\.ru\//,
  'yes2-byt-i-iskusstvo-1921': /^https:\/\/feb-web\.ru\//,
  'yes2-pugachev-commentary': /^https:\/\/feb-web\.ru\//,
  'yes2-ehrenburg-pugachev-1922': /^https:\/\/vtoraya-literatura\.com\//,
  'yes2-berlin-autobiography-1922': /^https:\/\/vtoraya-literatura\.com\//,
  'yes2-berlin-collected-1922': /^https:\/\/search\.rsl\.ru\//,
  'yes2-french-confession-1922': /^https:\/\/www\.museum-esenin\.ru\//,
  'yes2-disque-vert-1922': /^https:\/\/fr\.wikisource\.org\//,
  'yes2-strana-negodyaev-commentary': /^https:\/\/feb-web\.ru\//,
  'yes2-us-admission-1922': /^https:\/\/oregonnews\.uoregon\.edu\//,
  'yes2-us-reception-2023': /^https:\/\/doi\.org\//,
  'yes2-zhelezny-mirgorod-commentary': /^https:\/\/feb-web\.ru\//,
  'yes2-moscow-kabatskaya-1924': /^https:\/\/rusneb\.ru\//,
  'yes2-pss-cafe-accounts': /^https:\/\/feb-web\.ru\//,
  'yes2-pss-legal-1923': /^https:\/\/feb-web\.ru\//,
  'yes2-pss-business-documents': /^https:\/\/feb-web\.ru\//,
  'yes2-pss-manuscript-commentary': /^https:\/\/feb-web\.ru\//,
  'yes2-persian-motifs-commentary': /^https:\/\/feb-web\.ru\//,
  'yes2-pss-declarations-vol7k1': /^https:\/\/feb-web\.ru\//,
  'yes2-black-man-commentary': /^https:\/\/feb-web\.ru\//,
  'yes2-duncan-russian-days-1929-tu': /^https:\/\/dl\.tufts\.edu\//,
};
/*
 * A source must be honest, not merely linked.
 *
 * Requiring every source to carry an HTTPS URL is what produced the regression
 * this validator was meant to prevent: archival case files and print-only
 * scholarly editions have no public address, so the catalog silently pointed
 * them at this repository's own markdown ledger. A reader then clicked through
 * from the forensic act to our source code.
 *
 * The real invariants: a URL, when present, must be public HTTPS and must never
 * be a self-reference standing in for a document; a source without a URL must
 * instead say in prose where the document can be found.
 */
const SELF_REFERENCE = /github\.com\/FedorMilovanov/i;

for (const source of sources) {
  if (!source.id) throw new Error(`source without stable id: ${source.title}`);

  if (source.url) {
    if (!source.url.startsWith('https://')) {
      throw new Error(`source ${source.id} must use a public HTTPS URL`);
    }
    // The publication ledger itself is allowed to link to the repository.
    if (SELF_REFERENCE.test(source.url) && source.id !== 'yes2-publication-ledger') {
      throw new Error(
        `source ${source.id} points at our own repository instead of the document`,
      );
    }
  } else if (!source.note && !source.institution) {
    throw new Error(
      `source ${source.id} has no URL and no note saying where the document can be consulted`,
    );
  }

  const officialPattern = requiredOfficialUrls[source.id];
  if (officialPattern && (!source.url || !officialPattern.test(source.url))) {
    throw new Error(`source ${source.id} lost its official institutional URL`);
  }
}

const explicitPre1925Sources = new Set([
  'yes2-letopis-t3-k2',
  'yes2-pss-chronology',
  'yes2-pss-letters-vol6',
  'yes2-byt-i-iskusstvo-1921',
  'yes2-pugachev-commentary',
  'yes2-ehrenburg-pugachev-1922',
  'yes2-berlin-autobiography-1922',
  'yes2-berlin-collected-1922',
  'yes2-french-confession-1922',
  'yes2-disque-vert-1922',
  'yes2-strana-negodyaev-commentary',
  'yes2-us-admission-1922',
  'yes2-us-reception-2023',
  'yes2-zhelezny-mirgorod-commentary',
  'yes2-moscow-kabatskaya-1924',
  'yes2-pss-cafe-accounts',
  'yes2-pss-legal-1923',
  'yes2-pss-business-documents',
  'yes2-pss-declarations-vol7k1',
]);

const requiredPre1925AuthoritiesBySection: Record<string, ReadonlySet<string>> = {
  'Возвращение: Москва после Запада': new Set([
    'yes2-letopis-t3-k2',
    'yes2-pss-chronology',
    'yes2-zhelezny-mirgorod-commentary',
  ]),
  '«Москва кабацкая»: роль, рынок и документированные эпизоды': new Set([
    'yes2-moscow-kabatskaya-1924',
    'yes2-pss-cafe-accounts',
    'yes2-pss-legal-1923',
  ]),
  'Имажинизм после единства': new Set([
    'yes2-pss-declarations-vol7k1',
  ]),
  'Галина Бениславская: рукописи и издательские дела': new Set([
    'yes2-pss-letters-vol6',
    'yes2-pss-business-documents',
  ]),
};

let activeSection = '';
for (const [index, block] of essay.blocks.entries()) {
  if (block.type === 'section') {
    activeSection = block.heading;
    continue;
  }
  if (!('sourceIds' in block) || !block.sourceIds?.length) continue;
  const searchable = block.type === 'note'
    ? `${block.claim} ${block.text}`
    : 'text' in block && typeof block.text === 'string'
      ? block.text
      : '';

  const explicitPre1925Claim = /\b(?:1923|1924)(?:–1925)?\b/u.test(searchable);
  if (
    explicitPre1925Claim
    && block.sourceIds.includes('yes2-letopis-t5-k1')
    && !block.sourceIds.some((id) => explicitPre1925Sources.has(id))
  ) {
    throw new Error(
      `block ${index + 1} uses the 1925-only Letopis for an explicit pre-1925 claim without a period-capable source`,
    );
  }

  const requiredSectionAuthorities = requiredPre1925AuthoritiesBySection[activeSection];
  if (
    requiredSectionAuthorities
    && !block.sourceIds.some((id) => requiredSectionAuthorities.has(id))
  ) {
    throw new Error(
      `block ${index + 1} in section ${activeSection} lacks its section-specific pre-1925 authority`,
    );
  }

  if (searchable.includes('Корпус переписки') && !block.sourceIds.includes('yes2-pss-letters-vol6')) {
    throw new Error(`block ${index + 1} discusses the correspondence corpus without item-level PSS vol.6`);
  }
}

const benislavskayaLegalBlock = essay.blocks.find(
  (block) => block.type === 'paragraph' && block.text.startsWith('Галина Бениславская была не только героиней несчастной любви.'),
);
if (
  !benislavskayaLegalBlock
  || !('sourceIds' in benislavskayaLegalBlock)
  || !benislavskayaLegalBlock.sourceIds?.includes('yes2-pss-business-documents')
) {
  throw new Error('Benislavskaya legal-role paragraph lost item-level business-document authority');
}

const benislavskayaLetterBlock = essay.blocks.find(
  (block) => block.type === 'paragraph' && block.text.startsWith('29 октября 1924 года из Тифлиса'),
);
if (
  !benislavskayaLetterBlock
  || !('sourceIds' in benislavskayaLetterBlock)
  || !benislavskayaLetterBlock.sourceIds?.includes('yes2-pss-letters-vol6')
) {
  throw new Error('Benislavskaya 29 October correspondence paragraph lost item-level PSS vol.6 authority');
}

const postReturnMoscowBlock = essay.blocks.find(
  (block) => block.type === 'paragraph' && block.text.startsWith('Московская литературная среда тоже изменилась.'),
);
if (!postReturnMoscowBlock || !('sourceIds' in postReturnMoscowBlock) || !postReturnMoscowBlock.sourceIds?.includes('yes2-pss-chronology')) {
  throw new Error('post-return Moscow context lost its 1923–1924-capable chronology source');
}

const imagismBlock = essay.blocks.find(
  (block) => block.type === 'paragraph' && block.text.startsWith('Имажинизм дал Есенину издательскую сеть'),
);
if (!imagismBlock || !('sourceIds' in imagismBlock) || !imagismBlock.sourceIds?.includes('yes2-pss-declarations-vol7k1')) {
  throw new Error('Imagism public-break paragraph lost item-level declarations evidence');
}

const admissionBlock = essay.blocks.find(
  (block) => block.type === 'paragraph' && block.text.startsWith('Американский этап начался 1 октября 1922 года'),
);
if (!admissionBlock || !('sourceIds' in admissionBlock) || !admissionBlock.sourceIds?.includes('yes2-us-admission-1922')) {
  throw new Error('U.S. admission paragraph lost contemporaneous item-level press evidence');
}

const cafeBlock = essay.blocks.find(
  (block) => block.type === 'paragraph' && block.text.startsWith('«Москва кабацкая» была книгой'),
);
if (
  !cafeBlock
  || !('sourceIds' in cafeBlock)
  || !cafeBlock.sourceIds?.includes('yes2-pss-cafe-accounts')
  || !cafeBlock.sourceIds?.includes('yes2-pss-legal-1923')
) {
  throw new Error('Moscow Kabatskaya paragraph lost cafe-account/legal-process source separation');
}

const blackManBlock = essay.blocks.find(
  (block) => block.type === 'paragraph' && block.text.startsWith('Сохранившаяся редакция «Чёрного человека»'),
);
if (!blackManBlock || !('sourceIds' in blackManBlock) || !blackManBlock.sourceIds?.includes('yes2-black-man-commentary')) {
  throw new Error('Black Man paragraph lost item-level creative-history authority');
}

let citationCount = 0;
for (const [index, block] of essay.blocks.entries()) {
  if (!('sourceIds' in block) || !block.sourceIds?.length) continue;
  for (const sourceId of block.sourceIds) {
    citationCount += 1;
    if (!sourceIds.has(sourceId)) {
      throw new Error(`block ${index + 1} cites missing source id: ${sourceId}`);
    }
  }
}
if (citationCount < 70) throw new Error(`Part II citation topology is too sparse: ${citationCount}`);

for (const marker of [
  '# Сергей Есенин. Часть II — публичный реестр источников',
  '## yes2-letopis-t3-k1',
  '## yes2-letopis-t3-k2',
  '## yes2-letopis-t5-k1',
  '## yes2-pss-chronology',
  '## yes2-pss-letters-vol6',
  '## yes2-byt-i-iskusstvo-1921',
  '## yes2-ehrenburg-pugachev-1922',
  '## yes2-french-confession-1922',
  '## yes2-disque-vert-1922',
  '## yes2-us-reception-2023',
  '## yes2-pss-business-documents',
  '## yes2-pss-manuscript-commentary',
  '## yes2-pss-declarations-vol7k1',
  '## yes2-aronson-receipt-1925-12-16',
  '## yes2-duncan-russian-days-1929-tu',
  'Запросы на дополнительные цифровые копии и разрешения отправлены 4 августа 2026 года',
  'Локальные зеркала полных PDF не публикуются до письменного разрешения',
]) {
  if (!ledger.includes(marker)) throw new Error(`public source ledger lost required marker: ${marker}`);
}

console.log(
  `Yesenin Part II publication: 16 sections, ${proseBlocks.length} prose blocks, ${citationCount} citations, ${sourceIds.size} public source links, ${images.length} public-domain images; documentary, visual and rights boundaries passed.`,
);
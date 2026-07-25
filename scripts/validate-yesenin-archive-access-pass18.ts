import {
  yeseninArchiveAccessPassEighteen,
  yeseninArchiveAccessPassEighteenSummary,
  yeseninNyplDuncanProgramItemQueuePassEighteen,
} from '../src/data/essays/yeseninArchiveAccessPassEighteen';

const fail = (message: string): never => {
  throw new Error(`[yesenin-archive-access-pass18] ${message}`);
};

const records = yeseninArchiveAccessPassEighteen;
const summary = yeseninArchiveAccessPassEighteenSummary;
const nyplItems = yeseninNyplDuncanProgramItemQueuePassEighteen;

if (records.length !== 6) fail(`expected 6 records, found ${records.length}`);
if (new Set(records.map((record) => record.id)).size !== records.length) {
  fail('record IDs must be unique');
}
if (records.some((record) => !record.url.startsWith('https://'))) {
  fail('all record URLs must be HTTPS');
}
if (
  records.some(
    (record) =>
      record.syntheticContentUsed !== false ||
      record.wikipediaUsedAsEvidence !== false ||
      record.productionAuthorized !== false,
  )
) {
  fail('synthetic/Wikipedia/production boundary drifted');
}
if (records.some((record) => record.fullTextAcquired !== false)) {
  fail('pass 18 must not claim any newly acquired full text');
}

const materials = records.find((record) => record.id === 'ARC18-YE1-MATERIALS-1992');
if (
  !materials ||
  materials.url !== 'https://feb-web.ru/feb/esenin/critics/-g1992.html' ||
  materials.exactLocator !== 'М.: Историческое наследие, 1992. 446 с.' ||
  !materials.evidenceLimits.some((limit) => limit.includes('110')) ||
  materials.contentInspected !== false
) {
  fail('1992 Materials edition/page-110 boundary drifted');
}

const rgali122 = records.find((record) => record.id === 'ARC18-YE1-RGALI-190-1-122');
if (
  !rgali122 ||
  rgali122.grade !== 'A+' ||
  !rgali122.exactLocator.includes('ед. хр. 122') ||
  !rgali122.exactLocator.includes('71 л.') ||
  !rgali122.evidenceLimits.some((limit) => limit.includes('не указывает автора')) ||
  !rgali122.evidenceLimits.some((limit) => limit.includes('Бениславской')) ||
  rgali122.contentInspected !== false
) {
  fail('RGALI ed.hr.122 anonymous-access boundary drifted');
}

const rgali132 = records.find((record) => record.id === 'ARC18-YE1-RGALI-190-1-132');
if (
  !rgali132 ||
  !rgali132.title.includes('А. Г. Назарова') ||
  !rgali132.exactLocator.includes('ед. хр. 132') ||
  !rgali132.exactLocator.includes('39 л.') ||
  !rgali132.verifiedFacts.some((fact) => fact.includes('пометах Г. А. Бениславской')) ||
  !rgali132.evidenceLimits.some((limit) => limit.includes('не собственные воспоминания')) ||
  rgali132.contentInspected !== true
) {
  fail('Nazarova/Benislavskaya attribution correction drifted');
}

const imli = records.find((record) => record.id === 'ARC18-YE1-IMLI-F32-BENISLAVSKAYA');
if (
  !imli ||
  imli.grade !== 'A+' ||
  !imli.exactLocator.includes('ф. 32') ||
  !imli.exactLocator.includes('23 фотокопии') ||
  !imli.exactLocator.includes('1921–1925') ||
  imli.contentInspected !== false
) {
  fail('IMLI f.32 Benislavskaya correspondence locator drifted');
}

const nyplCollection = records.find((record) => record.id === 'ARC18-YE1-NYPL-DUNCAN-PROGRAMS');
if (
  !nyplCollection ||
  nyplCollection.url !==
    'https://digitalcollections.nypl.org/collections/isadora-duncan-programs-and-announcements' ||
  !nyplCollection.exactLocator.includes('*MGZB-Res. ++ 93-8695') ||
  !nyplCollection.exactLocator.includes('b12284786') ||
  !nyplCollection.verifiedFacts.some((fact) => fact.includes('110 программ')) ||
  !nyplCollection.verifiedFacts.some((fact) => fact.includes('четыре оцифрованных')) ||
  !nyplCollection.evidenceLimits.some((limit) => limit.includes('московской программы 1921')) ||
  nyplCollection.contentInspected !== false
) {
  fail('NYPL program collection boundary drifted');
}

const nyplStudies = records.find((record) => record.id === 'ARC18-YE1-NYPL-DUNCAN-STUDIES');
if (
  !nyplStudies ||
  nyplStudies.url !==
    'https://digitalcollections.nypl.org/items/6bd555f0-c625-012f-008e-58d385a7bc34' ||
  !nyplStudies.exactLocator.includes('*MGZEC 87-290') ||
  !nyplStudies.exactLocator.includes('ISADORA_0001VB') ||
  !nyplStudies.verifiedFacts.some((fact) => fact.includes('1915–1918')) ||
  !nyplStudies.verifiedFacts.some((fact) => fact.includes('США')) ||
  !nyplStudies.evidenceLimits.some((limit) => limit.includes('Москвой')) ||
  nyplStudies.contentInspected !== true
) {
  fail('NYPL Duncan studies item boundary drifted');
}

const expectedNyplItems = [
  '89b93c5d-a42e-99bb-e040-e00a18066f5f',
  '311074d0-26fa-0137-dbf3-5fc18a3ba411',
  'ef354620-26fa-0137-4425-5325a3c555ef',
  '522978b0-26fb-0137-0433-0f1659985b85',
] as const;
if (
  nyplItems.length !== expectedNyplItems.length ||
  nyplItems.some((id, index) => id !== expectedNyplItems[index]) ||
  new Set(nyplItems).size !== nyplItems.length
) {
  fail('NYPL item UUID queue drifted');
}

if (
  summary.records !== 6 ||
  summary.aPlusRecords !== 4 ||
  summary.aRecords !== 2 ||
  summary.nyplDigitizedItemUuids !== 4 ||
  summary.fullTextsAcquired !== 0 ||
  summary.productionAuthorizedRecords !== 0 ||
  !summary.correctedAttribution.includes('A. G. Nazarova') ||
  !summary.correctedAttribution.includes('annotations only') ||
  summary.remainingControllingTargets.length !== 5 ||
  !summary.remainingControllingTargets.some((target) => target.includes('page 110')) ||
  !summary.remainingControllingTargets.some((target) => target.includes('Правда')) ||
  summary.articlePublished !== false ||
  summary.wikipediaUsedAsEvidence !== false ||
  summary.productionAuthorized !== false
) {
  fail(`summary drifted: ${JSON.stringify(summary)}`);
}

console.log(
  JSON.stringify(
    {
      status: 'ARCHIVE-ACCESS-PASS18-VALID',
      records: summary.records,
      grades: { aPlus: summary.aPlusRecords, a: summary.aRecords },
      correction: summary.correctedAttribution,
      nyplItemQueue: nyplItems,
      fullTextsAcquired: summary.fullTextsAcquired,
      productionAuthorized: summary.productionAuthorized,
      remainingTargets: summary.remainingControllingTargets,
    },
    null,
    2,
  ),
);

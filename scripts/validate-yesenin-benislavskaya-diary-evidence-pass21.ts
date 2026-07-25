import {
  yeseninBenislavskayaDiaryEffectiveStatePassTwentyOne,
  yeseninBenislavskayaDiaryEvidencePassTwentyOne,
} from '../src/data/essays/yeseninBenislavskayaDiaryEvidencePassTwentyOne';

const fail = (message: string): never => {
  throw new Error(`[yesenin-benislavskaya-diary-pass21] ${message}`);
};

const record = yeseninBenislavskayaDiaryEvidencePassTwentyOne;
const effective = yeseninBenislavskayaDiaryEffectiveStatePassTwentyOne;

if (
  record.id !== 'DIARY21-YE1-RGALI-1604-1-1123' ||
  record.authority !== 'Российский государственный архив литературы и искусства' ||
  record.archiveUrl !== 'https://rgali.ru/storage-unit/2623734' ||
  record.fundId !== '8212' ||
  record.opisId !== '9084' ||
  record.storageUnitSystemId !== '2623734' ||
  record.cipher !== 'ф.1604 оп.1 ед. хр.1123' ||
  !record.fundTitle.includes('Зелинский') ||
  !record.systematizationSection.includes('Рукописи разных лиц') ||
  record.title !== 'Г. А. Бениславская. Дневник.' ||
  record.dateRange !== '28 августа [1919]-25 июля 1926' ||
  record.visibleLeafCount !== 35 ||
  record.hiddenCommentLeafValueExcluded !== 40 ||
  record.authorPerson !== 'Бениславская Галина Артуровна' ||
  record.reproductionMethod !== 'Машинописная копия'
) {
  fail('exact RGALI archive-card identity drifted');
}

if (
  record.diagnosticWorkflowRun !== 30171017702 ||
  record.diagnosticHead !== '2b44256e8b58a05ad472a6718907119d2ce58dff' ||
  record.artifactId !== 8622920215 ||
  record.artifactDigest !==
    'sha256:2d0bfb0b87fa00b72fddc21b4209714228c86d896423de3f795889ff44442690' ||
  record.opisPagesCrawled !== 57 ||
  record.exactLiteralMatches !== 1 ||
  record.detailHtmlBytes !== 114_014 ||
  record.detailHtmlSha256 !==
    '794ba94dc47c808eeaaa5994efa9d0136145c5c8052bd10839f36c45eb3c0e59' ||
  record.visibleTextSha256 !==
    '734257d23c7110023664e1ed0e13a206da131fc5b6d21194682bb451556fbd30'
) {
  fail('diagnostic artifact or archive-card byte evidence drifted');
}

if (
  record.literalStorageUnitLinkDiscovered !== true ||
  record.storageUnitIdConstructed !== false ||
  record.hiddenHtmlCommentsExcludedFromVisibleEvidence !== true ||
  record.facsimileAcquired !== false ||
  record.fullTextAcquired !== false ||
  record.diaryContentInspected !== false ||
  record.autographInspected !== false ||
  record.ocrUsedForEvidence !== false ||
  record.syntheticContentUsed !== false ||
  record.productionAuthorized !== false
) {
  fail('access/content/publication boundary drifted');
}

const requiredLimits = [
  'машинописной копии',
  'автограф',
  'старое значение 40',
  'facsimile',
  'не разрешает публикацию',
] as const;
for (const marker of requiredLimits) {
  if (!record.evidenceLimits.some((limit) => limit.includes(marker))) {
    fail(`evidence limit lost marker: ${marker}`);
  }
}

const requiredRequests = [
  '35 видимых листов',
  'обложку',
  'происхождение машинописной копии',
  'SHA-256',
] as const;
for (const marker of requiredRequests) {
  if (!record.acquisitionRequest.some((request) => request.includes(marker))) {
    fail(`acquisition request lost marker: ${marker}`);
  }
}

if (
  effective.sourceClass !== 'A+ exact archive-unit card' ||
  effective.exactArchiveCardIdentified !== true ||
  effective.exactArchiveCardVisuallyRenderedByInstitution !== true ||
  effective.typescriptCopyIdentified !== true ||
  effective.visibleLeafCount !== 35 ||
  effective.autographStatus !== 'NOT-INSPECTED / NOT-ESTABLISHED-AS-EXTANT-BY-CARD' ||
  effective.contentStatus !== 'FACSIMILE-NOT-ACQUIRED / FULL-TEXT-NOT-INSPECTED' ||
  effective.supersedesGenericBenislavskayaDiaryRequest !== true ||
  effective.articleClaimPromotionAllowed !== false ||
  effective.articlePublished !== false ||
  effective.productionAuthorized !== false
) {
  fail(`effective diary access state drifted: ${JSON.stringify(effective)}`);
}

console.log(
  JSON.stringify(
    {
      status: 'BENISLAVSKAYA-DIARY-PASS21-EXACT-RGALI-CARD',
      card: {
        url: record.archiveUrl,
        cipher: record.cipher,
        title: record.title,
        dates: record.dateRange,
        visibleLeaves: record.visibleLeafCount,
        reproductionMethod: record.reproductionMethod,
      },
      artifact: {
        run: record.diagnosticWorkflowRun,
        id: record.artifactId,
        digest: record.artifactDigest,
        detailHtmlBytes: record.detailHtmlBytes,
        detailHtmlSha256: record.detailHtmlSha256,
        visibleTextSha256: record.visibleTextSha256,
      },
      access: effective.contentStatus,
      autograph: effective.autographStatus,
      claimPromotionAllowed: effective.articleClaimPromotionAllowed,
      productionAuthorized: effective.productionAuthorized,
    },
    null,
    2,
  ),
);

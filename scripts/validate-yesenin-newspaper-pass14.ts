import {
  yeseninPartOneNewspaperPassFourteen,
  yeseninPartOneNewspaperPassFourteenArtifact,
  yeseninPartOneNewspaperPassFourteenCoverage,
  yeseninPartOnePravdaPassFifteenAccess,
} from '../src/data/essays/yeseninPartOneNewspaperPassFourteen';

const fail = (message: string): never => {
  throw new Error(`[yesenin-newspaper-pass14] ${message}`);
};

const records = yeseninPartOneNewspaperPassFourteen;
const coverage = yeseninPartOneNewspaperPassFourteenCoverage;
const artifact = yeseninPartOneNewspaperPassFourteenArtifact;
const pravda = yeseninPartOnePravdaPassFifteenAccess;

if (records.length !== 3) fail(`expected 3 Izvestia records, found ${records.length}`);
if (new Set(records.map((record) => record.id)).size !== records.length) {
  fail('newspaper record IDs must be unique');
}
if (new Set(records.map((record) => record.catalogueCode)).size !== records.length) {
  fail('newspaper catalogue codes must be unique');
}

const expected = [
  {
    id: 'NEWS14-YE1-IZVESTIA-NO186',
    issue: '186',
    date: '24 August 1921',
    code: '000199_000009_013351165',
    bytes: 52_016_796,
    frames: 4,
    sha: 'c8f83373f17c4c34bb059c624f81b917a2e5d4f4ed636d7735d398fb0789dd79',
    frame: 'PDF 03',
    title: 'Наша гостья.',
    signature: 'А. ЛУНАЧАРСКИЙ',
  },
  {
    id: 'NEWS14-YE1-IZVESTIA-NO251',
    issue: '251',
    date: '9 November 1921',
    code: '000199_000009_013351339',
    bytes: 23_798_944,
    frames: 2,
    sha: '0e35e292398e6b281c43bd016fd94d62df3981476aa0ed79d4130d987c98ef99',
    frame: 'PDF 02',
    title: 'Айседора Дункан. (Первое выступление 7 ноября).',
    signature: undefined,
  },
  {
    id: 'NEWS14-YE1-IZVESTIA-NO263',
    issue: '263',
    date: '23 November 1921',
    code: '000199_000009_013351387',
    bytes: 49_148_667,
    frames: 4,
    sha: 'b3e007bf66bf9efafd103481f2108ba315770627b4df35fa503ad31c241fcdec',
    frame: 'PDF 04',
    title: 'Искусство для масс.',
    signature: 'А. АЙСЕДОРА ДУНКАН',
  },
] as const;

for (const item of expected) {
  const record = records.find((candidate) => candidate.id === item.id);
  if (!record) fail(`missing ${item.id}`);
  if (
    record.historicalHoldId !== 'PW6-YE1-IZVESTIA-1921-SERIAL' ||
    record.issueNumber !== item.issue ||
    record.dateLabel !== item.date ||
    record.catalogueCode !== item.code ||
    record.catalogueUrl !== `https://rusneb.ru/catalog/${item.code}/` ||
    record.bytes !== item.bytes ||
    record.pdfFrames !== item.frames ||
    record.sha256 !== item.sha ||
    record.articleTitle !== item.title ||
    record.verifiedSignature !== item.signature ||
    !record.inspectedFrames.some((frame) => frame.includes(item.frame))
  ) {
    fail(`${item.id} exact identity or physical evidence drifted`);
  }
  if (
    record.realPdfAcquired !== true ||
    record.visuallyInspected !== true ||
    record.routeConstructed !== false ||
    record.ocrUsedForEvidence !== false ||
    record.syntheticContentUsed !== false ||
    record.archiveOriginalInspected !== false ||
    record.productionAuthorized !== false ||
    record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved'
  ) {
    fail(`${item.id} evidence or rights boundary drifted`);
  }
  if (!record.unresolvedQuestions.some((question) => question.includes('Esenin'))) {
    fail(`${item.id} lost the no-Esenin-attendance/meeting boundary`);
  }
  if (
    !record.unresolvedQuestions.some(
      (question) => question.includes('school') || question.includes('школ'),
    )
  ) {
    fail(`${item.id} lost the school-opening boundary`);
  }
}

if (
  coverage.historicalHoldId !== 'PW6-YE1-IZVESTIA-1921-SERIAL' ||
  coverage.effectiveStatus !== 'superseded-by-acquisition' ||
  coverage.supersedesHistoricalHold !== true ||
  coverage.evidenceIds.length !== 3 ||
  coverage.evidenceIds.some((id, index) => id !== records[index].id) ||
  coverage.remainingTargets.length !== 0
) {
  fail(`Izvestia coverage drifted: ${JSON.stringify(coverage)}`);
}

if (
  artifact.discoveryArtifactSha256 !==
    'd06600474df1449a7fa0a17355cc6cca0370e17eba35245fcdecaa3f2f655dde' ||
  artifact.acquisitionArtifactSha256 !==
    '66520651ad99e962e2fd160d2fe606d517f8a9e410dd16c504f50dbe6e7ff206' ||
  artifact.totalPdfBytes !== 124_964_407 ||
  artifact.totalPdfFrames !== 10 ||
  artifact.realPdfObjects !== 3 ||
  artifact.ocrUsedForEvidence !== false ||
  artifact.productionAuthorized !== false
) {
  fail(`newspaper artifact summary drifted: ${JSON.stringify(artifact)}`);
}

if (
  pravda.id !== 'PR15-YE1-PRAVDA-1921-11-09' ||
  pravda.historicalHoldId !== 'PW6-YE1-PRAVDA-1921-11-09' ||
  pravda.state !== 'no-literal-official-central-moscow-match' ||
  pravda.officialParentUrl !== 'https://search.rsl.ru/ru/record/01004548325' ||
  pravda.officialSearchQueries !== 4 ||
  pravda.literalIssueCandidates !== 0 ||
  pravda.inspectedCandidateCards !== 0 ||
  pravda.acceptedCentralMoscowCards !== 0 ||
  pravda.rejectedSameNamePublications.join('|') !==
    'Деревенская правда|Правда Севера|Правда Востока' ||
  pravda.artifactSha256 !==
    'd02149ce5d760cc07014d283faceff3f5e6c051c0d79125f709447b52246dc1c' ||
  pravda.catalogueIdConstructed !== false ||
  pravda.pdfRouteConstructed !== false ||
  pravda.ocrUsedForEvidence !== false ||
  pravda.syntheticContentUsed !== false ||
  pravda.productionAuthorized !== false ||
  !pravda.remainingTarget.includes('exact Moscow central-party issue')
) {
  fail(`Pravda bounded access record drifted: ${JSON.stringify(pravda)}`);
}

console.log(
  JSON.stringify(
    {
      status: 'IZVESTIA-3/3-ACQUIRED-AND-VISUALLY-INSPECTED / PRAVDA-UNRESOLVED',
      historicalIzvestiaHold: coverage.historicalHoldId,
      supersededBy: coverage.evidenceIds,
      records: records.map((record) => ({
        id: record.id,
        issueNumber: record.issueNumber,
        catalogueCode: record.catalogueCode,
        bytes: record.bytes,
        sha256: record.sha256,
        pdfFrames: record.pdfFrames,
        inspectedFrames: record.inspectedFrames,
        articleTitle: record.articleTitle,
      })),
      totalPdfBytes: artifact.totalPdfBytes,
      totalPdfFrames: artifact.totalPdfFrames,
      acquisitionArtifactSha256: artifact.acquisitionArtifactSha256,
      pravdaState: pravda.state,
      publicationAuthorized: false,
      mediaPublicationAuthorized: false,
    },
    null,
    2,
  ),
);

import {
  yeseninMirokPassSeventeenEnvelope,
  yeseninMirokPdfEvidencePassSeventeen,
  yeseninMirokUnresolvedPassSeventeen,
} from '../src/data/essays/yeseninMirokPdfEvidencePassSeventeen';

const fail = (message: string): never => {
  throw new Error(`[yesenin-mirok-pdf-evidence-pass17] ${message}`);
};

const records = yeseninMirokPdfEvidencePassSeventeen;
const unresolved = yeseninMirokUnresolvedPassSeventeen;
const envelope = yeseninMirokPassSeventeenEnvelope;

if (records.length !== 2) fail(`expected 2 acquired Mirok issues, found ${records.length}`);
if (unresolved.length !== 4) fail(`expected 4 unresolved Mirok issues, found ${unresolved.length}`);
if (new Set(records.map((record) => record.id)).size !== records.length) fail('acquired IDs must be unique');
if (new Set(records.map((record) => record.catalogueCode)).size !== records.length) {
  fail('acquired catalogue codes must be unique');
}

const expected = [
  {
    id: 'MIROK17-YE1-BOOK-2',
    book: 2,
    month: 'February',
    code: '000199_000009_013508098',
    catalogueHtmlBytes: 57_942,
    catalogueHtmlSha: '7a6fb56df74bc66f5deb3c3b0a31d03304946b880f5daacbed17f845372e6b20',
    pdfBytes: 30_792_767,
    pdfFrames: 40,
    pdfSha: '6bccf4e8a8783454c2e6bf644ac1871a97d6dd57c4b40691e40900c26bc4652b',
    targetTitle: 'Пороша',
    printedPage: 46,
    inspectedFrame: 20,
    printedTitle: 'ПОРОША.',
    incipit: 'А подъ самою макушкой',
  },
  {
    id: 'MIROK17-YE1-BOOK-4',
    book: 4,
    month: 'April',
    code: '000199_000009_013508100',
    catalogueHtmlBytes: 57_942,
    catalogueHtmlSha: '10cc0f920f5101d625c594329886cf7a7876000edf75900385ea491bc91562ce',
    pdfBytes: 29_702_539,
    pdfFrames: 40,
    pdfSha: '3b98a4b9e14bcf84241b1ea058ffc7cc4cde35e2faf6b268bdc6d2f91cc91e7f',
    targetTitle: 'Пасхальный благовест',
    printedPage: 124,
    inspectedFrame: 30,
    printedTitle: 'Пасхальный благовѣстъ.',
    incipit: 'Колоколъ дрѣмавшій',
  },
] as const;

for (const item of expected) {
  const record = records.find((candidate) => candidate.id === item.id);
  if (!record) fail(`missing ${item.id}`);
  if (
    record.year !== 1914 ||
    record.book !== item.book ||
    record.month !== item.month ||
    record.catalogueCode !== item.code ||
    record.catalogueUrl !== `https://rusneb.ru/catalog/${item.code}/` ||
    record.catalogueHtmlBytes !== item.catalogueHtmlBytes ||
    record.catalogueHtmlSha256 !== item.catalogueHtmlSha ||
    record.pdfBytes !== item.pdfBytes ||
    record.pdfFrames !== item.pdfFrames ||
    record.pdfSha256 !== item.pdfSha ||
    record.targetTitle !== item.targetTitle ||
    record.printedPage !== item.printedPage ||
    record.inspectedPdfFrame !== item.inspectedFrame ||
    record.printedTitle !== item.printedTitle ||
    record.printedSignature !== 'Сергѣй Есенинъ'
  ) {
    fail(`${item.id} exact identity or byte evidence drifted`);
  }
  if (!record.visualFindings.some((finding) => finding.includes(item.incipit))) {
    fail(`${item.id} lost its visible first-publication marker`);
  }
  if (
    record.febControlUrl !== 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p' ||
    record.state !== 'exact-neb-card / pdf-acquired / visually-inspected' ||
    record.realPdfAcquired !== true ||
    record.magicBytesVerified !== true ||
    record.independentlyRehashed !== true ||
    record.visuallyInspected !== true ||
    record.ocrUsedForNavigationOnly !== true ||
    record.ocrUsedForEvidence !== false ||
    record.catalogueArithmeticUsed !== false ||
    record.routeConstructed !== false ||
    record.syntheticContentUsed !== false ||
    record.archiveOriginalInspected !== false ||
    record.productionAuthorized !== false ||
    record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved'
  ) {
    fail(`${item.id} evidence-method or rights boundary drifted`);
  }
}

const expectedUnresolved = [
  { id: 'MIROK17-YE1-UNRESOLVED-1', book: 1, title: 'Берёза', pages: '10' },
  { id: 'MIROK17-YE1-UNRESOLVED-3', book: 3, title: 'Село', pages: '85' },
  { id: 'MIROK17-YE1-UNRESOLVED-7', book: 7, title: 'С добрым утром!', pages: '219' },
  { id: 'MIROK17-YE1-UNRESOLVED-12', book: 12, title: 'Сиротка', pages: '364–368' },
] as const;

for (const item of expectedUnresolved) {
  const record = unresolved.find((candidate) => candidate.id === item.id);
  if (!record) fail(`missing unresolved record ${item.id}`);
  if (
    record.year !== 1914 ||
    record.book !== item.book ||
    record.targetTitle !== item.title ||
    record.printedPages !== item.pages ||
    record.state !== 'literal-neb-issue-card-unresolved' ||
    record.parentSeriesInspected !== true ||
    record.officialNebSearchPerformed !== true ||
    record.literalIssueCardsAccepted !== 0 ||
    record.catalogueArithmeticUsed !== false ||
    record.pdfRouteConstructed !== false ||
    record.contentInspected !== false ||
    record.productionAuthorized !== false
  ) {
    fail(`${item.id} unresolved access boundary drifted`);
  }
}

if (
  envelope.parentSeriesCode !== '000199_000009_006697247' ||
  envelope.parentSeriesUrl !== 'https://rusneb.ru/catalog/000199_000009_006697247/' ||
  envelope.publisher !== 'Т-во И. Д. Сытин' ||
  envelope.acquiredIssueBooks.join('|') !== '2|4' ||
  envelope.unresolvedIssueBooks.join('|') !== '1|3|7|12' ||
  envelope.acquiredPdfObjects !== 2 ||
  envelope.acquiredPdfBytes !== 60_495_306 ||
  envelope.acquiredPdfFrames !== 80 ||
  envelope.officialNebSearchRoutesForUnresolvedIssues !== 32 ||
  envelope.diagnosticWorkflowRunId !== 30_165_843_617 ||
  envelope.diagnosticArtifactId !== 8_621_566_554 ||
  envelope.diagnosticArtifactSha256 !==
    '49a69a6b9d762f7942099212a0aec62c48757a2a51cfa717e5ea0882bfd57da1' ||
  envelope.diagnosticPr !== 154 ||
  envelope.diagnosticPrMerged !== false ||
  envelope.pdfBinariesCommittedToRepository !== false ||
  envelope.wikipediaUsedAsEvidence !== false ||
  envelope.publicationAuthorized !== false ||
  envelope.productionAuthorized !== false
) {
  fail(`pass-17 envelope drifted: ${JSON.stringify(envelope)}`);
}

const summedBytes = records.reduce((sum, record) => sum + record.pdfBytes, 0);
const summedFrames = records.reduce((sum, record) => sum + record.pdfFrames, 0);
if (summedBytes !== envelope.acquiredPdfBytes || summedFrames !== envelope.acquiredPdfFrames) {
  fail(`aggregate mismatch: bytes=${summedBytes}, frames=${summedFrames}`);
}

console.log(
  JSON.stringify(
    {
      status: 'MIROK-1914-BOOKS-2-AND-4-ACQUIRED / BOOKS-1-3-7-12-UNRESOLVED',
      parentSeriesCode: envelope.parentSeriesCode,
      acquired: records.map((record) => ({
        id: record.id,
        book: record.book,
        catalogueCode: record.catalogueCode,
        pdfBytes: record.pdfBytes,
        pdfFrames: record.pdfFrames,
        pdfSha256: record.pdfSha256,
        printedPage: record.printedPage,
        inspectedPdfFrame: record.inspectedPdfFrame,
        printedTitle: record.printedTitle,
        printedSignature: record.printedSignature,
      })),
      unresolved: unresolved.map((record) => ({
        book: record.book,
        targetTitle: record.targetTitle,
        printedPages: record.printedPages,
        state: record.state,
      })),
      totalPdfBytes: envelope.acquiredPdfBytes,
      totalPdfFrames: envelope.acquiredPdfFrames,
      diagnosticArtifactSha256: envelope.diagnosticArtifactSha256,
      publicationAuthorized: false,
      productionAuthorized: false,
    },
    null,
    2,
  ),
);

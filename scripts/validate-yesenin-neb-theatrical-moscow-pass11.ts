import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  yeseninPartOneTheatricalMoscowPassEleven,
  yeseninPartOneTheatricalMoscowPassElevenCoverage,
} from '../src/data/essays/yeseninPartOneTheatricalMoscowPassEleven';

const root = process.cwd();
const output = process.env.YESENIN_NEB_THEATRE_OUTPUT ?? 'artifacts/yesenin-neb-theatrical-moscow-pass11';
const manifestPath = resolve(root, output, 'manifest.json');
const summaryPath = resolve(root, output, 'summary.json');
const ledgerPath = resolve(root, 'research/yesenin/PART_ONE_NEB_THEATRICAL_MOSCOW_PASS11.md');
const fail = (message: string): never => {
  throw new Error(`[yesenin-neb-theatrical-moscow-pass11] ${message}`);
};
const normalizeIssueLabel = (value: string): string => value.replace(/[–—]/gu, '-').replace(/\s+/gu, ' ').trim();

interface RuntimeIssue {
  label: string;
  catalogueCode: string;
  catalogueUrl: string;
  localPdf: string;
  bytes: number;
  sha256: string;
  pdfFrames: number;
  routeConstructed: boolean;
  ocrUsed: boolean;
  synthetic: boolean;
  productionAuthorized: boolean;
  contactSheets: string[];
}

interface RuntimeSummary {
  records: number;
  realPdfObjects: number;
  totalPdfBytes: number;
  totalPdfFrames: number;
  routesConstructed: boolean;
  ocrUsed: boolean;
  syntheticImages: number;
  generatedDocuments: number;
  productionAuthorized: boolean;
}

const runtimeIssues = JSON.parse(readFileSync(manifestPath, 'utf8')) as RuntimeIssue[];
const runtimeSummary = JSON.parse(readFileSync(summaryPath, 'utf8')) as RuntimeSummary;
const ledger = readFileSync(ledgerPath, 'utf8');
const records = yeseninPartOneTheatricalMoscowPassEleven;
const coverage = yeseninPartOneTheatricalMoscowPassElevenCoverage;

if (records.length !== 4 || runtimeIssues.length !== 4) {
  fail(`expected four typed and runtime issues, found ${records.length}/${runtimeIssues.length}`);
}
if (
  runtimeSummary.records !== 4 ||
  runtimeSummary.realPdfObjects !== 4 ||
  runtimeSummary.totalPdfBytes !== 43_100_448 ||
  runtimeSummary.totalPdfFrames !== 94 ||
  runtimeSummary.routesConstructed !== false ||
  runtimeSummary.ocrUsed !== false ||
  runtimeSummary.syntheticImages !== 0 ||
  runtimeSummary.generatedDocuments !== 0 ||
  runtimeSummary.productionAuthorized !== false
) {
  fail(`runtime summary drifted: ${JSON.stringify(runtimeSummary)}`);
}

const typedIds = records.map((record) => record.id);
const typedCodes = records.map((record) => record.catalogueCode);
if (new Set(typedIds).size !== records.length) fail('typed evidence IDs must be unique');
if (new Set(typedCodes).size !== records.length) fail('catalogue codes must be unique');

const runtimeByCode = new Map(runtimeIssues.map((issue) => [issue.catalogueCode, issue]));
for (const record of records) {
  const runtime = runtimeByCode.get(record.catalogueCode);
  if (!runtime) fail(`${record.id} is missing from runtime acquisition manifest`);
  if (
    normalizeIssueLabel(runtime.label) !== normalizeIssueLabel(record.label) ||
    runtime.catalogueUrl !== record.catalogueUrl ||
    runtime.bytes !== record.bytes ||
    runtime.sha256 !== record.sha256 ||
    runtime.pdfFrames !== record.pdfFrames
  ) {
    fail(`${record.id} exact PDF baseline differs from runtime manifest`);
  }
  if (!/^[a-f0-9]{64}$/u.test(record.sha256)) fail(`${record.id} has invalid SHA-256`);
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
    fail(`${record.id} evidence boundary changed`);
  }
  if (
    runtime.routeConstructed !== false ||
    runtime.ocrUsed !== false ||
    runtime.synthetic !== false ||
    runtime.productionAuthorized !== false
  ) {
    fail(`${record.id} runtime boundary changed`);
  }
  if (record.inspectedFrames.length < 2 || record.verifiedPageFindings.length < 3) {
    fail(`${record.id} lacks a usable manual inspection map`);
  }
  if (runtime.contactSheets.length < 2) fail(`${record.id} lacks complete contact sheets`);
  const pdfPath = resolve(root, output, 'originals', runtime.localPdf);
  if (statSync(pdfPath).size !== record.bytes) fail(`${record.id} local PDF byte size drifted`);
}

const no2 = records.find((record) => record.id === 'TM11-YE1-NO2');
const no7 = records.find((record) => record.id === 'TM11-YE1-NO7');
const no8 = records.find((record) => record.id === 'TM11-YE1-NO8');
const no1112 = records.find((record) => record.id === 'TM11-YE1-NO11-12');
if (!no2 || !no7 || !no8 || !no1112) fail('typed issue registry is incomplete');

const requiredFindings: Array<[typeof no2, string]> = [
  [no2, 'Айседора Дункан о Москве'],
  [no7, 'Спор о Дункан'],
  [no7, '7 November'],
  [no8, 'internal header marked no. 7'],
  [no8, '11 November'],
  [no8, 'Meyerhold'],
  [no1112, 'Литературная богема Москвы!'],
  [no1112, 'Esenin and Klyuev'],
];
for (const [record, marker] of requiredFindings) {
  const haystack = [...record.verifiedPageFindings, ...record.promotedClaims, ...record.unresolvedQuestions].join('\n');
  if (!haystack.includes(marker)) fail(`${record.id} lost manual finding marker ${marker}`);
}
if (no8.promotedClaims.length !== 1) {
  fail('issue no. 8 must promote exactly one bounded follow-up reception claim');
}
if (!no7.unresolvedQuestions.some((item) => item.includes('does not by itself establish Esenin'))) {
  fail('issue no. 7 lost the Esenin-attendance boundary');
}
if (!no1112.unresolvedQuestions.some((item) => item.includes('No claim about the official opening'))) {
  fail('issue no. 11–12 lost the Duncan-school boundary');
}

if (
  coverage.historicalHoldId !== 'PW6-YE1-TEATRALNAYA-MOSKVA-1921' ||
  coverage.effectiveStatus !== 'active-hold-partially-satisfied' ||
  coverage.supersedesHistoricalHold !== false ||
  coverage.evidenceIds.length !== records.length ||
  coverage.evidenceIds.some((id, index) => id !== records[index].id) ||
  coverage.verifiedTargetCoverage.length < 4 ||
  coverage.remainingTargets.length < 3
) {
  fail(`series-level HOLD coverage drifted: ${JSON.stringify(coverage)}`);
}
if (!coverage.remainingTargets.some((item) => item.includes('official program'))) {
  fail('series coverage lost the unresolved 7 November program target');
}
if (!coverage.remainingTargets.some((item) => item.includes('official opening'))) {
  fail('series coverage lost the unresolved Duncan-school target');
}

for (const required of [
  '4-REAL-ISSUES / 43,100,448-BYTES / 94-PDF-FRAMES',
  'PARTIALLY-SATISFIED / ACTIVE-HOLD',
  '3d25919732a139957d18e35e69a9ea1360fe7644b8c99af52bc47622c327749f',
  '19ebd9b12a94ad3ff70e5b4b87cae2c1b5b9fe552dee6d385072382f129259f8',
  '236bd3480451f0829b07b160c1b7cd1b2f103771fcf1e1ddf31852ba23dff1dc',
  'e800c77d8c2ba1d5d4b58f681a71c354c96757db434dc4bab65b41ad063a6ca8',
  '`PDF 06`, печатная с. 4',
  '**«Спор о Дункан»**',
  '`PDF 05`, печатная с. 5',
  '`PDF 03` несёт напечатанный внутренний колонтитул `№ 7`',
  '**«Литературная богема Москвы!»**',
  '`ocrUsedForEvidence=false`',
  '`productionAuthorized=false`',
] as const) {
  if (!ledger.includes(required)) fail(`research ledger is missing ${required}`);
}

console.log(
  JSON.stringify(
    {
      status: '4-REAL-ISSUES / EXACT-BYTES-SHA-FRAMES / MANUAL-PAGE-MAP / PARTIAL-HOLD-COVERAGE / NO-OCR-EVIDENCE',
      issues: records.map((record) => ({
        id: record.id,
        label: record.label,
        catalogueCode: record.catalogueCode,
        bytes: record.bytes,
        sha256: record.sha256,
        pdfFrames: record.pdfFrames,
        promotedClaims: record.promotedClaims.length,
      })),
      targetCoverage: coverage,
      totalPdfBytes: runtimeSummary.totalPdfBytes,
      totalPdfFrames: runtimeSummary.totalPdfFrames,
      manuallyInspectedIssues: records.filter((record) => record.visuallyInspected).length,
      archiveOriginalsInspected: 0,
      ocrUsedForEvidence: false,
      syntheticContentUsed: false,
      productionAuthorized: false,
    },
    null,
    2,
  ),
);

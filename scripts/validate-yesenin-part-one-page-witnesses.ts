import { yeseninPartOneSources } from '../src/data/essays/yeseninPartOneSources';
import { yeseninPartOneSourcesPassTwo } from '../src/data/essays/yeseninPartOneSourcesPassTwo';
import { yeseninPartOneSourcesPassThree } from '../src/data/essays/yeseninPartOneSourcesPassThree';
import { yeseninPartOnePageWitnesses } from '../src/data/essays/yeseninPartOnePageWitnesses';

const errors: string[] = [];
const witnessIds = new Set<string>();
const sourceIds = new Set(
  [...yeseninPartOneSources, ...yeseninPartOneSourcesPassTwo, ...yeseninPartOneSourcesPassThree]
    .map((source) => source.id)
    .filter((id): id is string => Boolean(id)),
);

const guardedClaims = new Set([
  'YE1-004',
  'YE1-010',
  'YE1-016',
  'YE1-020',
  'YE1-023',
]);

function fail(message: string) {
  errors.push(message);
}

if (yeseninPartOnePageWitnesses.length < 8) {
  fail(`page-witness registry regressed below first-pass floor: ${yeseninPartOnePageWitnesses.length} < 8`);
}

for (const witness of yeseninPartOnePageWitnesses) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(witness.id)) {
    fail(`${witness.id}: witness id must be lowercase kebab-case`);
  }
  if (witnessIds.has(witness.id)) fail(`${witness.id}: duplicate witness id`);
  witnessIds.add(witness.id);

  if (!witness.referenceUrl.startsWith('https://')) {
    fail(`${witness.id}: reference URL must use HTTPS`);
  }
  if (witness.title.length < 20) fail(`${witness.id}: title is too weak`);
  if (witness.institution.length < 8) fail(`${witness.id}: institution/holding boundary is required`);
  if (witness.controls.length === 0) fail(`${witness.id}: controlling claim effect is required`);
  if (witness.limitations.length === 0) fail(`${witness.id}: evidence limitations are required`);

  for (const claimId of witness.claimIds) {
    if (!guardedClaims.has(claimId)) fail(`${witness.id}: unguarded claim id ${claimId}`);
  }
  for (const sourceId of witness.sourceIds) {
    if (!sourceIds.has(sourceId)) fail(`${witness.id}: unknown source id ${sourceId}`);
  }

  if (witness.layer === 'published-page') {
    if (!witness.printedPages || witness.printedPages.length === 0) {
      fail(`${witness.id}: published-page witness requires printed page identity`);
    }
    if (witness.status !== 'capture-required' && witness.status !== 'identified') {
      fail(`${witness.id}: published-page witness has incompatible status ${witness.status}`);
    }
  }

  if (witness.layer === 'archive-original' && witness.status !== 'archive-request-required') {
    fail(`${witness.id}: unresolved archive original must retain archive-request-required status`);
  }

  if (witness.status === 'locate-required' && witness.layer !== 'object-facsimile') {
    fail(`${witness.id}: locate-required is reserved for missing object facsimiles`);
  }
}

const requiredPageSets: Array<[string, readonly number[]]> = [
  ['wit-ye1-school-certificate-545', [545]],
  ['wit-ye1-train-assignment-672-674', [672, 673, 674]],
  ['wit-ye1-train-reports-688-691', [688, 689, 690, 691]],
  ['wit-ye1-imagist-sirena-cover-621', [621]],
];

for (const [id, requiredPages] of requiredPageSets) {
  const witness = yeseninPartOnePageWitnesses.find((item) => item.id === id);
  if (!witness) {
    fail(`${id}: required exact page witness disappeared`);
    continue;
  }
  const pages = new Set(witness.printedPages ?? []);
  for (const page of requiredPages) {
    if (!pages.has(page)) fail(`${id}: required printed page ${page} disappeared`);
  }
}

for (const id of [
  'wit-ye1-imagist-sovetskaya-strana-no3',
  'wit-ye1-imagist-sirena-internal-pages',
]) {
  const witness = yeseninPartOnePageWitnesses.find((item) => item.id === id);
  if (!witness) {
    fail(`${id}: two-witness imagist publication collation target disappeared`);
    continue;
  }
  if (witness.status !== 'locate-required') {
    fail(`${id}: first-publication target must remain locate-required until exact pages are acquired`);
  }
}

const trainWitnesses = yeseninPartOnePageWitnesses.filter((witness) =>
  witness.claimIds.includes('YE1-016'),
);
if (!trainWitnesses.some((witness) =>
  witness.archiveShelfmarks?.some((value) => value.includes('ф. 1328')),
)) {
  fail('YE1-016: controlling RGIA fond 1328 shelfmark boundary disappeared');
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

const publishedPageCount = yeseninPartOnePageWitnesses
  .filter((witness) => witness.layer === 'published-page')
  .reduce((count, witness) => count + (witness.printedPages?.length ?? 0), 0);
const openCaptureCount = yeseninPartOnePageWitnesses
  .filter((witness) => witness.status !== 'identified')
  .length;

console.log(
  `Yesenin Part I page-witness validation: ${yeseninPartOnePageWitnesses.length} targets, `
  + `${publishedPageCount} exact printed pages guarded, ${openCaptureCount} targets remain capture/locate/archive holds.`,
);

import {
  yeseninNyplProgramCapturesPassNineteen,
  yeseninNyplProgramEvidencePassNineteen,
  yeseninNyplProgramItemsPassNineteen,
} from '../src/data/essays/yeseninNyplProgramEvidencePassNineteen';

const fail = (message: string): never => {
  throw new Error(`[yesenin-nypl-program-pass19] ${message}`);
};

const items = yeseninNyplProgramItemsPassNineteen;
const captures = yeseninNyplProgramCapturesPassNineteen;
const evidence = yeseninNyplProgramEvidencePassNineteen;

if (items.length !== 4) fail(`expected 4 NYPL root items, found ${items.length}`);
if (captures.length !== 15) fail(`expected 15 NYPL captures, found ${captures.length}`);
if (new Set(items.map((item) => item.id)).size !== items.length) fail('item IDs must be unique');
if (new Set(items.map((item) => item.rootItemUuid)).size !== items.length) {
  fail('root item UUIDs must be unique');
}
if (new Set(captures.map((capture) => capture.id)).size !== captures.length) {
  fail('capture IDs must be unique');
}
if (new Set(captures.map((capture) => capture.captureUuid)).size !== captures.length) {
  fail('capture UUIDs must be unique');
}
if (new Set(captures.map((capture) => capture.imageId)).size !== captures.length) {
  fail('NYPL image IDs must be unique');
}

const expectedItems = [
  {
    id: 'NYPL19-ITEM-001',
    requested: '89b93c5d-a42e-99bb-e040-e00a18066f5f',
    root: '360acb20-c605-012f-5a1e-58d385a7bc34',
    title: 'Carnegie Hall, Duncan-Damrosch Tour: Symphonic music and the dance',
    date: '1911-02-15',
    qualification: 'printed',
    place: 'New York',
    bytes: 507_030,
    sha: '5747e6e5545b1d6b9c73de7951d5a3843504c9e7c397be54a5695083cd806471',
    count: 1,
    rights: 'copyright-status-undetermined',
    marker: 'Carnegie Hall',
  },
  {
    id: 'NYPL19-ITEM-002',
    requested: '311074d0-26fa-0137-dbf3-5fc18a3ba411',
    root: '300e71f0-26fa-0137-efbc-2b3acc82e3f4',
    title: 'Idilli alla Danza eseguiti da Miss Isadora Duncan',
    date: '1903 (inferred)',
    qualification: 'catalog-inferred',
    place: 'Trieste',
    bytes: 514_815,
    sha: '8beec2061e4e2cc14d08cf5f6d44da0c395e7884bbd52f714275a0d25b6ef7d2',
    count: 4,
    rights: 'public-domain-us / international-status-not-determined',
    marker: 'catalog-inferred',
  },
  {
    id: 'NYPL19-ITEM-003',
    requested: 'ef354620-26fa-0137-4425-5325a3c555ef',
    root: 'ee239660-26fa-0137-bad9-0f2615afff59',
    title: 'Miss Isadora Duncan eseguira danze e cori de "L’Iphigenie" di Christoph Gluck',
    date: '1912-04-22',
    qualification: 'printed',
    place: 'Teatro Costanzi, Rome',
    bytes: 516_725,
    sha: 'd526fc2f2381eea8484cbc3314d85832ee34b1a18eb93e8df46db96d79158b13',
    count: 6,
    rights: 'public-domain-us / international-status-not-determined',
    marker: '22 April 1912',
  },
  {
    id: 'NYPL19-ITEM-004',
    requested: '522978b0-26fb-0137-0433-0f1659985b85',
    root: '512a89d0-26fb-0137-a8bb-47c28987601e',
    title: 'Miss Isadora Duncan eseguira le danze dell’Orfeo',
    date: '1912-04-25',
    qualification: 'printed',
    place: 'Teatro Costanzi, Rome',
    bytes: 513_976,
    sha: '74884908f6d6d686b9e8629980beeaf328ef9e4480826af6ee3d519a7d0f2bca',
    count: 4,
    rights: 'public-domain-us / international-status-not-determined',
    marker: '25 April 1912',
  },
] as const;

for (const expected of expectedItems) {
  const item = items.find((candidate) => candidate.id === expected.id);
  if (!item) fail(`missing ${expected.id}`);
  if (
    item.requestedCaptureUuid !== expected.requested ||
    item.rootItemUuid !== expected.root ||
    item.title !== expected.title ||
    item.dateIssued !== expected.date ||
    item.dateQualification !== expected.qualification ||
    item.place !== expected.place ||
    item.pageUrl !== `https://digitalcollections.nypl.org/items/${expected.requested}` ||
    item.finalUrl !==
      `https://digitalcollections.nypl.org/items/${expected.root}?canvasIndex=0` ||
    item.htmlBytes !== expected.bytes ||
    item.htmlSha256 !== expected.sha ||
    item.captureCount !== expected.count ||
    item.rightsState !== expected.rights
  ) {
    fail(`${expected.id} exact item identity or byte evidence drifted`);
  }
  if (
    item.acquiredOfficialHtml !== true ||
    item.visuallyInspected !== true ||
    item.diplomaticTranscriptionComplete !== false ||
    item.moscow1921Witness !== false ||
    item.productionAuthorized !== false
  ) {
    fail(`${expected.id} evidence/publication boundary drifted`);
  }
  if (!item.visualFindings.some((finding) => finding.includes(expected.marker))) {
    fail(`${expected.id} lost its controlling visual marker ${expected.marker}`);
  }
  if (!item.visualFindings.some((finding) => finding.includes('Moscow'))) {
    fail(`${expected.id} lost the explicit no-Moscow boundary`);
  }
}

const expectedCaptures = [
  ['NYPL19-CAPTURE-001', 'NYPL19-ITEM-001', '89b93c5d-a42e-99bb-e040-e00a18066f5f', '1947210', 1, 718, 'b987edfc12f18568777615c95dd9714b913a7351b3fc292fe5bbb5c17eca3030', 80_265, '05e38a5a8dbd029a3a5e798aa38eac9b1ba9439f8421f4e3f2cc594ad7e1f9a1', 497, 760],
  ['NYPL19-CAPTURE-002', 'NYPL19-ITEM-002', '311074d0-26fa-0137-dbf3-5fc18a3ba411', '57840595', 1, 844, 'afb1de6514a0486f6091f849f24097364a9a11f50b548192822ff6a474eacda7', 4_526_455, '3b245e5c8363fec9721dd77a0ce9cdfdb7611c613456dd19814df0e716c36aac', 4482, 6059],
  ['NYPL19-CAPTURE-003', 'NYPL19-ITEM-002', '31cf3de0-26fa-0137-05f8-638de25b2932', '57840596', 2, 844, '7e90a52a27e7c1133979878978f47889e5a0a65e4137a0599556a829908656c5', 4_955_129, '51aa4a370b37d3c0892130bb0ab0aecd4f6a7b57ccb36e4708c2bc5e8422ae87', 4482, 6059],
  ['NYPL19-CAPTURE-004', 'NYPL19-ITEM-002', '1fd61fb0-26fc-0137-c0fe-0154c49baf79', '57840597', 3, 844, 'b9788fc8652efd426cc5393e59c6f34da3b79b465b893d189414ce38532ee399', 4_692_754, 'fa7ac6ad0c327d8a83333c320170b8bbacd58c5eb55b9750a734ccdb2e478a0d', 4482, 6059],
  ['NYPL19-CAPTURE-005', 'NYPL19-ITEM-002', '1ff69b60-26fc-0137-f23b-737c54249e33', '57840598', 4, 844, 'e9b3d48a8bffb499aebd032e68315f8b7384de2a561344f1c93697e86aefaf57', 4_592_404, '48fecdb1acd2cd716641345ee1e3b88180c47a8d843ddceebd4453011244430f', 4482, 6059],
  ['NYPL19-CAPTURE-006', 'NYPL19-ITEM-003', 'ef354620-26fa-0137-4425-5325a3c555ef', '57840585', 1, 845, '1170a2da630fefe5d4fab50f6705aed7310be81d34efb4905e41c11250188f64', 3_666_922, '18334b54be54e42799a3ebcefc27c4364fe8c92e0a71e2ad930cc2eebb7a828e', 4355, 6705],
  ['NYPL19-CAPTURE-007', 'NYPL19-ITEM-003', 'efee3710-26fa-0137-0e6f-276a253666f3', '57840586', 2, 845, 'd2201be2766a36dff8e1addef795a730fa534c55cf3137ad2295fc5f9c676abb', 3_015_212, '3654ed128bc72e395236ac56edb9838452e6bd349bf18571c0f5296049d80ad4', 4354, 6705],
  ['NYPL19-CAPTURE-008', 'NYPL19-ITEM-003', 'b56ed430-26fc-0137-b17b-3fd1894db45f', '57840587', 3, 845, 'e410d4bea0e6efff665bd15b7ce7d6e4c1e80015af2c21f19c80e4b9eb270bbb', 3_217_024, '08f99363f3f2ecd03c61c6721e7d213da8673ef7e91c19e32936af5cb6437c1a', 4354, 6705],
  ['NYPL19-CAPTURE-009', 'NYPL19-ITEM-003', 'b5990d00-26fc-0137-b21e-67ad796126be', '57840588', 4, 845, 'd5801933f551d1d97592e20d956bebfe6c1b697a2b2735a29000757b8469859c', 3_860_633, '54bc273de3126265fe1cc258de923712e470f787ba2626c02dc36d939b3fdc98', 4203, 6705],
  ['NYPL19-CAPTURE-010', 'NYPL19-ITEM-003', 'b5bb6050-26fc-0137-68e8-01d848e26eb0', '57840589', 5, 845, 'bf15b5ff5661cfb6e92a7cc82a3f4273622c8f006993a51f61741cec1853d09f', 3_593_560, 'f8bd14a1c90dbac754631588f4ce7e7003b4369aab855c95adc37da1f8737df9', 4233, 6705],
  ['NYPL19-CAPTURE-011', 'NYPL19-ITEM-003', 'b5daf500-26fc-0137-6bc2-211be11ac026', '57840590', 6, 845, 'f667724c659ee152d354d1b0d348b8ee3244475ed64e4ae9cdb08336556b19c7', 3_479_419, 'b90d179b0413b3038ccca9ba1ee79719d5a35e9896108496e118a8dd254768bf', 4354, 6705],
  ['NYPL19-CAPTURE-012', 'NYPL19-ITEM-004', '522978b0-26fb-0137-0433-0f1659985b85', '57840591', 1, 815, 'f7a85e3b7bdb56bc484b6daf56bd25fbe762574964d1d02c44570cbd3d34c8e9', 2_202_772, 'ae188d4c4b9ca14b5a0be88a5c4678d8bfd4b35449b25c8f16d54d6f2c050668', 3383, 5370],
  ['NYPL19-CAPTURE-013', 'NYPL19-ITEM-004', '52dd3c20-26fb-0137-2511-4798824f5a97', '57840592', 2, 815, '8c944943c8422736f827601e4e3a305a669af5bdbb6cfbeeb6f8b91515cf0bcd', 2_171_266, '7e54778887399891252d6cf1a2b1d5d407cae9184b332fe4ddcbf8b690dec3bd', 3382, 5370],
  ['NYPL19-CAPTURE-014', 'NYPL19-ITEM-004', '119de5b0-26fd-0137-c61a-671d669f207c', '57840593', 3, 815, '34c7762a8a10e11b1dae28e52c03aa9f4755261d36bcdfedd4d8884953c15ebe', 1_929_054, 'b1ed5e0202146a331d69f2161e9d1d3b2e9f744ae28ac55cf09e3032175e71cf', 3450, 5370],
  ['NYPL19-CAPTURE-015', 'NYPL19-ITEM-004', '11be9130-26fd-0137-b7f3-05e89b90c9a2', '57840594', 4, 815, 'ae1b2c0702bb1ba8143ced5439f8fd1257d3f5e3c538b3ed9d9c841520ae3a4e', 1_741_857, 'b11af8f8c024c231e8635030e081f122ccc3a4fde776e4ddc12ca2528f6d5452', 3480, 5370],
] as const;

for (const expected of expectedCaptures) {
  const [id, itemId, captureUuid, imageId, order, infoBytes, infoSha, imageBytes, imageSha, width, height] =
    expected;
  const capture = captures.find((candidate) => candidate.id === id);
  if (!capture) fail(`missing ${id}`);
  const item = items.find((candidate) => candidate.id === itemId);
  if (!item) fail(`${id} references missing item ${itemId}`);
  if (
    capture.itemId !== itemId ||
    capture.rootItemUuid !== item.rootItemUuid ||
    capture.captureUuid !== captureUuid ||
    capture.imageId !== imageId ||
    capture.orderInSequence !== order ||
    capture.infoUrl !== `https://iiif.nypl.org/iiif/3/${imageId}/info.json` ||
    capture.infoBytes !== infoBytes ||
    capture.infoSha256 !== infoSha ||
    capture.imageUrl !== `https://iiif.nypl.org/iiif/3/${imageId}/full/max/0/default.jpg` ||
    capture.imageBytes !== imageBytes ||
    capture.imageSha256 !== imageSha ||
    capture.width !== width ||
    capture.height !== height
  ) {
    fail(`${id} exact IIIF byte evidence drifted`);
  }
  if (
    capture.infoDimensionsMatchJpeg !== true ||
    capture.jpegMagicVerified !== true ||
    capture.visuallyInspected !== true ||
    capture.ocrUsedForEvidence !== false ||
    capture.syntheticContentUsed !== false ||
    capture.productionAuthorized !== false
  ) {
    fail(`${id} verification or publication boundary drifted`);
  }
}

for (const item of items) {
  const itemCaptures = captures
    .filter((capture) => capture.itemId === item.id)
    .sort((left, right) => left.orderInSequence - right.orderInSequence);
  if (itemCaptures.length !== item.captureCount) {
    fail(`${item.id} capture count differs from item declaration`);
  }
  if (itemCaptures.some((capture, index) => capture.orderInSequence !== index + 1)) {
    fail(`${item.id} capture order is not complete and sequential`);
  }
}

const htmlBytes = items.reduce((sum, item) => sum + item.htmlBytes, 0);
const infoBytes = captures.reduce((sum, capture) => sum + capture.infoBytes, 0);
const imageBytes = captures.reduce((sum, capture) => sum + capture.imageBytes, 0);
const publicDomainUsItems = items.filter((item) =>
  item.rightsState.startsWith('public-domain-us'),
).length;
const undeterminedRightsItems = items.filter(
  (item) => item.rightsState === 'copyright-status-undetermined',
).length;

if (
  evidence.diagnosticWorkflowRun !== 30169331186 ||
  evidence.diagnosticHead !== 'f5f59eef2476c4cc42dcecfc0399a8e41ac7f65b' ||
  evidence.artifactId !== 8622467372 ||
  evidence.artifactDigest !==
    'sha256:7460c3fe44a419c3b24492f9b8693afc3d1e88935a13dd4f5e87973aea4cea89' ||
  evidence.rootItems !== 4 ||
  evidence.captures !== 15 ||
  evidence.totalHtmlBytes !== 2_052_546 ||
  evidence.totalInfoBytes !== 12_424 ||
  evidence.totalImageBytes !== 47_724_726 ||
  htmlBytes !== evidence.totalHtmlBytes ||
  infoBytes !== evidence.totalInfoBytes ||
  imageBytes !== evidence.totalImageBytes ||
  evidence.publicDomainUsItems !== 3 ||
  evidence.undeterminedRightsItems !== 1 ||
  publicDomainUsItems !== evidence.publicDomainUsItems ||
  undeterminedRightsItems !== evidence.undeterminedRightsItems ||
  evidence.visuallyInspectedItems !== 4 ||
  evidence.visuallyInspectedCaptures !== 15 ||
  evidence.repoApiTokenPresent !== false ||
  evidence.repoApiEvidenceAccepted !== false ||
  evidence.publicHtmlAndIiifEvidenceAccepted !== true ||
  evidence.supersedesPassEighteenNyplItemQueue !== true ||
  evidence.noMoscow1921Item !== true ||
  evidence.ocrUsedForEvidence !== false ||
  evidence.syntheticContentUsed !== false ||
  evidence.articlePublished !== false ||
  evidence.productionAuthorized !== false ||
  !evidence.remainingTarget.includes('Moscow/Russian 1921')
) {
  fail(`aggregate evidence state drifted: ${JSON.stringify(evidence)}`);
}

console.log(
  JSON.stringify(
    {
      status: 'NYPL-PASS19-4-ITEMS-15-CAPTURES-VISUALLY-INSPECTED',
      artifact: {
        run: evidence.diagnosticWorkflowRun,
        id: evidence.artifactId,
        digest: evidence.artifactDigest,
      },
      bytes: {
        html: evidence.totalHtmlBytes,
        info: evidence.totalInfoBytes,
        images: evidence.totalImageBytes,
      },
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        date: item.dateIssued,
        place: item.place,
        captures: item.captureCount,
        rights: item.rightsState,
      })),
      noMoscow1921Item: evidence.noMoscow1921Item,
      productionAuthorized: evidence.productionAuthorized,
    },
    null,
    2,
  ),
);

import { getEssayBySlug } from '../src/data/essays/index';

const essay = getEssayBySlug('sergei-yesenin-1921-1925');
if (!essay) throw new Error('Yesenin Part II is not registered');

const sources = essay.sources ?? [];
const byId = new Map(sources.map((source) => [source.id, source]));
const expectedExactUrls: Record<string, string> = {
  'yes2-benislavskaya-memoir':
    'https://feb-web.ru/feb/esenin/critics/ev2/ev2-049-.htm?cmd=p',
  'yes2-memoirs-editorial-comments-vol2':
    'https://feb-web.ru/feb/esenin/critics/ev2/ev2-361-.htm?cmd=p',
  'yes2-death-discovery-act-1925-12-28':
    'https://or.imli.ru/akt-ob-obnaruzhenii-tela-s-esenina',
  'yes2-inquiry-gf-ustinov-1925-12-28':
    'https://or.imli.ru/protokol-oprosa-g-f-ustinova',
  'yes2-death-inventory-1925-12-28':
    'https://or.imli.ru/protokol-opisi-veshchej-v-nomere-esenina',
  'yes2-death-phoneogram-1925-12-28':
    'https://or.imli.ru/telefonogramma-o-dostavke-trupa-s-esenina-v-obukhovskuyu-bolnitsu',
};

for (const [id, expectedUrl] of Object.entries(expectedExactUrls)) {
  const source = byId.get(id);
  if (!source) throw new Error(`missing exact provenance source ${id}`);
  if (source.url !== expectedUrl) {
    throw new Error(`exact provenance URL drift for ${id}: ${source.url ?? '<none>'}`);
  }
}

const retiredBroadIds = new Set([
  'yes2-contemporary-memoirs-1986',
  'yes2-imli-death-documents-2003',
]);
for (const id of retiredBroadIds) {
  if (byId.has(id)) throw new Error(`retired broad source is still reader-facing: ${id}`);
}
for (const [index, block] of essay.blocks.entries()) {
  if (!('sourceIds' in block)) continue;
  for (const id of block.sourceIds ?? []) {
    if (retiredBroadIds.has(id)) {
      throw new Error(`block ${index + 1} still cites retired broad source ${id}`);
    }
  }
}

const citedNoUrlIds = new Set<string>();
const sourceIdsByUrlStatus = new Map(
  sources.map((source) => [source.id, Boolean(source.url)]),
);
for (const block of essay.blocks) {
  if (!('sourceIds' in block)) continue;
  for (const id of block.sourceIds ?? []) {
    if (sourceIdsByUrlStatus.get(id) === false) citedNoUrlIds.add(id);
  }
}
const expectedHonestNoUrl = new Set([
  'yes2-medical-facsimile-1925',
  'yes2-aronson-receipt-1925-12-16',
]);
if (
  citedNoUrlIds.size !== expectedHonestNoUrl.size
  || [...citedNoUrlIds].some((id) => !expectedHonestNoUrl.has(id))
) {
  throw new Error(`unexpected cited no-URL set: ${[...citedNoUrlIds].sort().join(', ')}`);
}

const readerText = essay.blocks
  .map((block) => {
    if ('text' in block && typeof block.text === 'string') return block.text;
    if (block.type === 'note') return `${block.claim} ${block.text}`;
    return '';
  })
  .join('\n');
if (readerText.includes('Полная опубликованная факсимильная страница проверена')) {
  throw new Error('power-of-attorney paragraph again overclaims facsimile inspection');
}
if (!readerText.includes('Академическая публикация ПСС печатает документ по подлиннику ИМЛИ')) {
  throw new Error('power-of-attorney paragraph lost its exact public-witness boundary');
}
if (!readerText.includes('карточки подтверждают существование и архивные шифры документов')) {
  throw new Error('death-document paragraph lost object-card provenance boundary');
}

console.log(
  'Yesenin Part II exact provenance: broad memoir/death corpora retired from reader graph; 6 exact public authorities locked; 2 honest no-URL objects preserved.',
);

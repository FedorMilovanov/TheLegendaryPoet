import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { yeseninPartOneUnpublishedArticle } from './lib/yesenin-part-one-unpublished-article';
import type { Essay, EssaySource } from '../src/types/essay';

const source = yeseninPartOneUnpublishedArticle.essay;

if (yeseninPartOneUnpublishedArticle.wholeArticleSentenceEditComplete !== true) {
  throw new Error('whole-article sentence edit is not complete');
}
if (source.blocks.length !== 152) throw new Error(`expected 152 blocks, found ${source.blocks.length}`);
if (source.blocks.filter((block) => block.type === 'section').length !== 12) {
  throw new Error('expected 12 section blocks');
}
if (source.blocks.filter((block) => block.type !== 'section').length !== 140) {
  throw new Error('expected 140 reader-facing blocks');
}
if (source.blocks.some((block) => block.type === 'image')) {
  throw new Error('research article unexpectedly contains documentary image blocks');
}

const stableImliPublicationsUrl =
  'https://imli.ru/nauchnye-otdely/otdel-novejshej-russkoj-literatury-i-literatury-russkogo-zarubezhya/1497-publikatcii-otdela-otdel-novejshej-russkoj-literatury-i-literatury-russkogo-zarubezhya';

const sources = (source.sources ?? []).map((record): EssaySource => {
  if (!record.id) throw new Error(`source has no stable id: ${record.title}`);
  if (!record.url?.startsWith('https://')) {
    throw new Error(`source has no stable HTTPS locator: ${record.id}`);
  }
  if (record.id === 'ye1-imli-chronicle-v1-catalogue') {
    return {
      ...record,
      url: stableImliPublicationsUrl,
      institution: 'ИМЛИ РАН',
      note:
        'Официальная страница публикаций отдела ИМЛИ РАН подтверждает академическую серию; точные факты статьи проверяются по страницам ФЭБ и первичным текстам.',
    };
  }
  return { ...record };
});

if (sources.length !== 64) throw new Error(`expected 64 public source cards, found ${sources.length}`);
if (new Set(sources.map((record) => record.id)).size !== sources.length) {
  throw new Error('duplicate source ids in public bibliography');
}

const sourceIds = new Set(sources.map((record) => record.id as string));
for (const block of source.blocks) {
  if (!('sourceIds' in block) || !block.sourceIds) continue;
  for (const sourceId of block.sourceIds) {
    if (!sourceIds.has(sourceId)) throw new Error(`block references missing public source ${sourceId}`);
  }
}

const publicArticle: Essay = {
  ...source,
  id: 'essay-yesenin-biography-part-one',
  slug: 'sergei-yesenin-1895-1921',
  kicker: 'Большая биография · часть I',
  excerpt:
    'Документальная биография Сергея Есенина от Константинова и Спас-Клепиков до Москвы, Блока, Клюева, революционных поэм, имажинизма и рубежа 1921 года.',
  seoTitle: 'Сергей Есенин: документальная биография 1895–1921',
  seoDescription:
    'Первая часть большой документальной биографии Сергея Есенина: детство, учёба, Москва, Блок, Клюев, Радуница, военно-санитарный поезд № 143, Зинаида Райх, революционные поэмы и имажинизм.',
  date: '2026-07-26',
  cover: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Esenin1914.jpg',
  cardCover: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Esenin1914.jpg',
  coverAlt: 'Сергей Александрович Есенин в 1914 году',
  coverKind: 'archive',
  coverCredit:
    'Сергей Есенин, 1914 · Wikimedia Commons · Public domain (PD-RusEmpire; pre-1931 publication in the United States)',
  coverSourceUrl: 'https://commons.wikimedia.org/wiki/File:Esenin1914.jpg',
  tags: ['Сергей Есенин', 'Биография', 'Серебряный век', 'Часть I', 'Источники'],
  blocks: source.blocks,
  sources,
};

const readerText = publicArticle.blocks
  .flatMap((block) => ('text' in block && typeof block.text === 'string' ? [block.text] : []))
  .join('\n');
for (const forbidden of [
  /непубличн/iu,
  /редакционн(?:ый|ого|ом) черновик/iu,
  /публикация изображения не разрешена/iu,
  /статья должна/iu,
  /в авторском тексте/iu,
  /citation topology/iu,
]) {
  if (forbidden.test(`${publicArticle.kicker}\n${publicArticle.excerpt}\n${readerText}`)) {
    throw new Error(`public candidate contains forbidden editorial language: ${forbidden}`);
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  canonicalResearchCommit: process.env.GITHUB_SHA ?? null,
  contract: {
    sections: 12,
    readerFacingBlocks: 140,
    renderBlocks: 152,
    sources: 64,
    documentaryImageBlocks: 0,
    coverRightsRoute: 'Wikimedia Commons PD-RusEmpire + pre-1931 US public domain',
    closedArchiveMediaPublished: false,
  },
  article: publicArticle,
};

const artifactDir = resolve('artifacts');
mkdirSync(artifactDir, { recursive: true });
writeFileSync(
  resolve(artifactDir, 'yesenin-part-one-public-candidate.json'),
  `${JSON.stringify(output, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  resolve(artifactDir, 'yeseninPartOnePublic.ts'),
  `import type { Essay } from '../../types/essay';\n\nexport const yeseninPartOnePublic: Essay = ${JSON.stringify(publicArticle, null, 2)};\n`,
  'utf8',
);

console.log(
  `exported Yesenin Part I public candidate: ${publicArticle.blocks.length} blocks, ${sources.length} sources`,
);

import { getEssayBySlug } from '../src/data/essays/index';

const slug = 'sergei-yesenin-1921-1925';
const essay = getEssayBySlug(slug);
if (!essay) throw new Error(`Part II is not registered: ${slug}`);

const forbiddenChaginTokens = [
  'Chagin_and_Esenin_1924.jpg',
  'Chagin%20and%20Esenin%201924.jpg',
];
const expectedGrzhebinSourceId = 'yesenin-grzhebin-1922-cover';
const expectedGimObjectUrl = 'https://catalog.shm.ru/entity/OBJECT/133719';
const expectedGrzhebinCommonsPage =
  'https://commons.wikimedia.org/wiki/File:Есенин_С.А._Собрание_стихов_и_поэм._Т._I._1922г_(обложка_изд._Гржебина_З.)_ГИМ.jpg';
const expectedGrzhebinUploadToken =
  '%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD_%D0%A1.%D0%90._%D0%A1%D0%BE%D0%B1%D1%80%D0%B0%D0%BD%D0%B8%D0%B5_%D1%81%D1%82%D0%B8%D1%85%D0%BE%D0%B2_%D0%B8_%D0%BF%D0%BE%D1%8D%D0%BC._%D0%A2._I._1922%D0%B3_';

const sources = essay.sources ?? [];
for (const source of sources) {
  const value = `${source.id ?? ''} ${source.url ?? ''} ${source.title}`;
  if (source.id === 'yesenin-chagin-1924' || forbiddenChaginTokens.some((token) => value.includes(token))) {
    throw new Error(
      'Part II publication reintroduced the Chagin/Bregadze photograph whose known authorship requires a separate copyright-term basis',
    );
  }
}

const grzhebinSource = sources.find((source) => source.id === expectedGrzhebinSourceId);
if (!grzhebinSource) {
  throw new Error(`Part II publication is missing replacement source ${expectedGrzhebinSourceId}`);
}
if (grzhebinSource.url !== expectedGimObjectUrl) {
  throw new Error(
    `replacement source ${expectedGrzhebinSourceId} must retain exact GIM object provenance: ${expectedGimObjectUrl}`,
  );
}
if (!grzhebinSource.institution?.includes('Государственный исторический музей')) {
  throw new Error('replacement source must retain State Historical Museum institutional authority');
}

const images = essay.blocks.filter((block) => block.type === 'image');
for (const image of images) {
  const value = `${image.src} ${image.sourceUrl ?? ''}`;
  if (forbiddenChaginTokens.some((token) => value.includes(token))) {
    throw new Error(
      'Part II publication reintroduced the Chagin/Bregadze image bytes or Commons page',
    );
  }
}

const grzhebinImage = images.find((image) => image.sourceUrl === expectedGrzhebinCommonsPage);
if (!grzhebinImage) {
  throw new Error('Part II publication is missing the rights-repair Grzhebin 1922 cover image');
}
if (!grzhebinImage.src.includes('upload.wikimedia.org/wikipedia/commons/9/92/')) {
  throw new Error('Grzhebin replacement must use the verified Wikimedia Commons delivery path');
}
if (!grzhebinImage.src.includes(expectedGrzhebinUploadToken)) {
  throw new Error('Grzhebin replacement delivery bytes do not match the verified 1922 cover identity');
}
if (!grzhebinImage.credit?.includes('Государственный исторический музей')) {
  throw new Error('Grzhebin replacement credit must retain the GIM provenance authority');
}
if (!grzhebinImage.credit?.includes('общественное достояние')) {
  throw new Error('Grzhebin replacement must retain its public-domain delivery decision');
}
if (grzhebinImage.kind !== 'archive') {
  throw new Error('Grzhebin replacement must remain classified as an archive image');
}

console.log(
  'Yesenin Part II media-rights validation passed: Chagin/Bregadze asset is excluded and the GIM→Commons Grzhebin replacement chain is enforced.',
);

import { yeseninPartOneEditorialPassSeven } from './yeseninPartOneEditorialPassSeven';
import { yeseninPartOnePhysicalEditionAcquisitionsPassEight } from './yeseninPartOnePhysicalEditionAcquisitionsPassEight';

const radunitsaAcquisition = yeseninPartOnePhysicalEditionAcquisitionsPassEight.find(
  (record) => record.id === 'PWA8-YE1-RADUNITSA-1916',
);
const ispovedAcquisition = yeseninPartOnePhysicalEditionAcquisitionsPassEight.find(
  (record) => record.id === 'PWA8-YE1-ISPOVED-1921',
);

if (!radunitsaAcquisition || !ispovedAcquisition) {
  throw new Error('[yesenin-physical-editions-pass8] canonical typed acquisitions are missing');
}
for (const record of [radunitsaAcquisition, ispovedAcquisition]) {
  if (
    record.facsimileBytesAcquired !== true ||
    record.facsimileVisuallyInspected !== true ||
    record.ocrUsedForEvidence !== false ||
    record.archiveOriginalInspected !== false ||
    record.productionAuthorized !== false
  ) {
    throw new Error(`[yesenin-physical-editions-pass8] invalid evidence boundary for ${record.id}`);
  }
}

export const yeseninPartOneEditorialPhysicalEditionsPassEight = {
  'yesenin-p1-transition-ispoved-text-book-dates':
    '«Исповедь хулигана» как произведение относится к 1920 году: комментарии ПСС связывают завершённый текст с письмом Иванову-Разумнику от 4 декабря. Физически просмотренный экземпляр НЭБ имеет на печатной обложке название «Исповедь хулигана» и год 1921, но внутри содержит не одну одноимённую поэму, а последовательность из «Хулигана», «Сорокоуста» и «Исповеди хулигана». История текста и история книжного объекта поэтому требуют разных датировок.',
  'yesenin-p1-transition-ispoved-bounded-formula':
    'Завершение отдельных произведений, сборка книжного блока, печать, получение первых экземпляров и библиотечный учёт могли приходиться на разные дни. Постраничная колляция подтверждает московский книжный объект 1921 года и порядок трёх текстов; она не доказывает точный день выхода. Наиболее точная формула остаётся такой: тексты написаны в 1920 году, отдельная книга появилась на рубеже 1920–1921 годов и библиографически закреплена за 1921-м.',
  'yesenin-p1-transition-ispoved-page-hold':
    'Цифровой экземпляр НЭБ теперь получен и просмотрен покадрово: 16 PDF-кадров показывают печатную обложку, внутренний титул, «Хулигана», «Сорокоуст» с посвящением А. Мариенгофу и датой «Август 1920», затем «Исповедь хулигана» с датой «Ноябрь 1920». SHA-256 исходного PDF зафиксирован. Это закрывает прежний вопрос о составе книги, но не превращает открытый библиотечный скан в автоматически разрешённое для публикации изображение.',
} as const satisfies Readonly<Record<string, string>>;

export const yeseninPartOneEditorialPhysicalEditionsPassEightExpectedCount = 3 as const;
export const yeseninPartOneEditorialPhysicalEditionsPassEightAcquisitionIds = [
  radunitsaAcquisition.id,
  ispovedAcquisition.id,
] as const;
export const yeseninPartOneEditorialPhysicalEditionsPassEightObjectIds = [
  radunitsaAcquisition.objectId,
  ispovedAcquisition.objectId,
] as const;
export const yeseninPartOneEditorialPhysicalEditionEvidenceByBlockId = {
  'yesenin-p1-radunitsa-bibliographic-date': [radunitsaAcquisition.id],
  'yesenin-p1-radunitsa-date-method': [radunitsaAcquisition.id],
  'yesenin-p1-transition-ispoved-text-book-dates': [ispovedAcquisition.id],
  'yesenin-p1-transition-ispoved-bounded-formula': [ispovedAcquisition.id],
  'yesenin-p1-transition-ispoved-page-hold': [ispovedAcquisition.id],
} as const satisfies Readonly<Record<string, readonly string[]>>;

const mutablePassSeven = yeseninPartOneEditorialPassSeven as unknown as Record<string, string>;
Object.assign(mutablePassSeven, yeseninPartOneEditorialPhysicalEditionsPassEight);

for (const [blockId, text] of Object.entries(yeseninPartOneEditorialPhysicalEditionsPassEight)) {
  if (!(blockId in yeseninPartOneEditorialPassSeven)) {
    throw new Error(`[yesenin-physical-editions-pass8] unknown pass-seven block ${blockId}`);
  }
  if (text.length < 300 || text.length > 1000) {
    throw new Error(`[yesenin-physical-editions-pass8] implausible text length for ${blockId}: ${text.length}`);
  }
}
if (Object.keys(yeseninPartOneEditorialPhysicalEditionEvidenceByBlockId).length !== 5) {
  throw new Error('[yesenin-physical-editions-pass8] expected five physical-edition prose links');
}

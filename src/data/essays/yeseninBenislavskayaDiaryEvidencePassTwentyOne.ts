export interface YeseninBenislavskayaDiaryEvidencePassTwentyOne {
  id: 'DIARY21-YE1-RGALI-1604-1-1123';
  authority: 'Российский государственный архив литературы и искусства';
  archiveUrl: 'https://rgali.ru/storage-unit/2623734';
  fundId: '8212';
  opisId: '9084';
  storageUnitSystemId: '2623734';
  cipher: 'ф.1604 оп.1 ед. хр.1123';
  fundTitle: string;
  systematizationSection: string;
  title: 'Г. А. Бениславская. Дневник.';
  dateRange: '28 августа [1919]-25 июля 1926';
  visibleLeafCount: 35;
  hiddenCommentLeafValueExcluded: 40;
  authorPerson: 'Бениславская Галина Артуровна';
  reproductionMethod: 'Машинописная копия';
  diagnosticWorkflowRun: 30171017702;
  diagnosticHead: '2b44256e8b58a05ad472a6718907119d2ce58dff';
  artifactId: 8622920215;
  artifactDigest: string;
  opisPagesCrawled: 57;
  exactLiteralMatches: 1;
  detailHtmlBytes: 114014;
  detailHtmlSha256: string;
  visibleTextSha256: string;
  literalStorageUnitLinkDiscovered: true;
  storageUnitIdConstructed: false;
  hiddenHtmlCommentsExcludedFromVisibleEvidence: true;
  facsimileAcquired: false;
  fullTextAcquired: false;
  diaryContentInspected: false;
  autographInspected: false;
  ocrUsedForEvidence: false;
  syntheticContentUsed: false;
  productionAuthorized: false;
  evidenceLimits: readonly string[];
  acquisitionRequest: readonly string[];
}

export const yeseninBenislavskayaDiaryEvidencePassTwentyOne = {
  id: 'DIARY21-YE1-RGALI-1604-1-1123',
  authority: 'Российский государственный архив литературы и искусства',
  archiveUrl: 'https://rgali.ru/storage-unit/2623734',
  fundId: '8212',
  opisId: '9084',
  storageUnitSystemId: '2623734',
  cipher: 'ф.1604 оп.1 ед. хр.1123',
  fundTitle: 'Зелинский Корнелий Люцианович (1896-1970) — критик, литературовед',
  systematizationSection: '6. Материалы, собранные К. Л. Зелинским / 3. Рукописи разных лиц',
  title: 'Г. А. Бениславская. Дневник.',
  dateRange: '28 августа [1919]-25 июля 1926',
  visibleLeafCount: 35,
  hiddenCommentLeafValueExcluded: 40,
  authorPerson: 'Бениславская Галина Артуровна',
  reproductionMethod: 'Машинописная копия',
  diagnosticWorkflowRun: 30171017702,
  diagnosticHead: '2b44256e8b58a05ad472a6718907119d2ce58dff',
  artifactId: 8622920215,
  artifactDigest: 'sha256:2d0bfb0b87fa00b72fddc21b4209714228c86d896423de3f795889ff44442690',
  opisPagesCrawled: 57,
  exactLiteralMatches: 1,
  detailHtmlBytes: 114_014,
  detailHtmlSha256: '794ba94dc47c808eeaaa5994efa9d0136145c5c8052bd10839f36c45eb3c0e59',
  visibleTextSha256: '734257d23c7110023664e1ed0e13a206da131fc5b6d21194682bb451556fbd30',
  literalStorageUnitLinkDiscovered: true,
  storageUnitIdConstructed: false,
  hiddenHtmlCommentsExcludedFromVisibleEvidence: true,
  facsimileAcquired: false,
  fullTextAcquired: false,
  diaryContentInspected: false,
  autographInspected: false,
  ocrUsedForEvidence: false,
  syntheticContentUsed: false,
  productionAuthorized: false,
  evidenceLimits: [
    'Официальная карточка доказывает существование и архивную идентичность машинописной копии, но не содержание 35 листов.',
    'Статус «Машинописная копия» запрещает описывать единицу как просмотренный автограф дневника Бениславской.',
    'Скрытое в HTML старое значение 40 находится внутри комментария и не является видимым полем карточки; operational leaf count — 35.',
    'До получения facsimile нельзя проверять последовательность дневниковых записей, купюры, правку, поздние вставки или точность опубликованных фрагментов.',
    'Архивная карточка не разрешает публикацию изображений листов и не усиливает читательский текст статьи автоматически.',
  ],
  acquisitionRequest: [
    'Запросить цифровую копию всех 35 видимых листов ф.1604 оп.1 ед. хр.1123.',
    'Включить в заказ архивную обложку, заверительные листы, обороты и любые вложения/пометы, если они относятся к единице.',
    'Попросить РГАЛИ уточнить происхождение машинописной копии, дату копирования и наличие сведений об утраченных или разрозненных оригиналах.',
    'После получения зафиксировать bytes, SHA-256, число файлов/кадров и выполнить постраничное визуальное сравнение с опубликованными фрагментами.',
  ],
} as const satisfies YeseninBenislavskayaDiaryEvidencePassTwentyOne;

export const yeseninBenislavskayaDiaryEffectiveStatePassTwentyOne = {
  sourceClass: 'A+ exact archive-unit card',
  exactArchiveCardIdentified: true,
  exactArchiveCardVisuallyRenderedByInstitution: true,
  typescriptCopyIdentified: true,
  visibleLeafCount: 35,
  autographStatus: 'NOT-INSPECTED / NOT-ESTABLISHED-AS-EXTANT-BY-CARD',
  contentStatus: 'FACSIMILE-NOT-ACQUIRED / FULL-TEXT-NOT-INSPECTED',
  supersedesGenericBenislavskayaDiaryRequest: true,
  articleClaimPromotionAllowed: false,
  articlePublished: false,
  productionAuthorized: false,
} as const;

export interface YeseninPartOneTopologyInsertion {
  afterBlockId: string;
  blockId: string;
  sectionNumber: number;
  sectionHeading: string;
  subsectionHeading: string;
  text: string;
  claimIds: readonly string[];
  editorialClaims: readonly string[];
  sourceIds: readonly string[];
}

export interface YeseninPartOneTopologySourceAugmentation {
  blockId: string;
  sourceIds: readonly string[];
}

/**
 * Research-only bridge for two verified coverage gaps discovered after the
 * Markdown authoring corpus was converted into a typed citation topology.
 *
 * This module is deliberately not exported from the public essay registry.
 */
export const yeseninPartOneTopologyInsertions = [
  {
    afterBlockId: 'yesenin-p1-reich-orel-1919',
    blockId: 'yesenin-p1-reich-1918-retrospective-boundary',
    sectionNumber: 9,
    sectionHeading: 'Зинаида Райх: брак внутри революционного перелома',
    subsectionHeading: 'Поздняя авторская датировка разрыва',
    text:
      'В автобиографии 1924 года Есенин писал, что разошёлся с Райх в 1918 году. Эту дату следует передавать как позднюю авторскую ретроспекцию, а не как точную дату юридического расторжения брака или полный отчёт о семейном разрыве. Академический комментарий к письму от 18 июня 1919 года всё ещё фиксирует Райх в Орле с дочерью Татьяной; поэтому семейная хронология не сводится к одной строке поздней автобиографии.',
    claimIds: ['YE1-021'],
    editorialClaims: [],
    sourceIds: [
      'ye1-autobiography-1924',
      'ye1-reich-family-documents-commentary',
      'SUP-YE1-003',
    ],
  },
] as const satisfies readonly YeseninPartOneTopologyInsertion[];

export const yeseninPartOneTopologySourceAugmentations = [
  {
    blockId: 'yesenin-p1-spas-klepiki-certificate',
    sourceIds: ['feb-ye1-school-certificate-545'],
  },
] as const satisfies readonly YeseninPartOneTopologySourceAugmentation[];

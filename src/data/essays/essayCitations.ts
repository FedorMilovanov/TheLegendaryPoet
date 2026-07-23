import type { EssayBlock } from '../../types/essay';

export interface StableCitationRule {
  /** Stable identity attached to the final prose block. */
  blockId: string;
  /** Semantic section boundary; null means prose before the first section. */
  sectionHeading: string | null;
  /** Zero-based prose position inside the section; images and voices do not count. */
  proseIndex: number;
  sourceIds: string[];
}

function isProseBlock(block: EssayBlock) {
  return block.type === 'paragraph' || block.type === 'lead' || block.type === 'note';
}

function identifyCitationBlocks(
  blocks: EssayBlock[],
  rules: StableCitationRule[],
): EssayBlock[] {
  const ruleIds = new Set<string>();
  for (const rule of rules) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rule.blockId)) {
      throw new Error(`Invalid stable citation block id: ${rule.blockId}`);
    }
    if (ruleIds.has(rule.blockId)) {
      throw new Error(`Duplicate stable citation block id: ${rule.blockId}`);
    }
    if (!Number.isInteger(rule.proseIndex) || rule.proseIndex < 0) {
      throw new Error(`Invalid prose index for ${rule.blockId}: ${rule.proseIndex}`);
    }
    if (rule.sourceIds.length === 0) {
      throw new Error(`Stable citation block ${rule.blockId} has no source ids`);
    }
    ruleIds.add(rule.blockId);
  }

  const matchedIds = new Set<string>();
  let currentSection: string | null = null;
  let proseIndex = 0;

  const identified = blocks.map((block) => {
    if (block.type === 'section') {
      currentSection = block.heading;
      proseIndex = 0;
      return block;
    }
    if (!isProseBlock(block)) return block;

    const currentProseIndex = proseIndex;
    proseIndex += 1;
    const matches = rules.filter(
      (rule) => rule.sectionHeading === currentSection && rule.proseIndex === currentProseIndex,
    );
    if (matches.length === 0) return block;
    if (matches.length > 1) {
      throw new Error(
        `Ambiguous citation locator in section ${currentSection ?? '<lead>'} at prose ${currentProseIndex}`,
      );
    }

    const rule = matches[0];
    if (matchedIds.has(rule.blockId)) {
      throw new Error(`Stable citation locator matched more than once: ${rule.blockId}`);
    }
    if (block.id && block.id !== rule.blockId) {
      throw new Error(`Block id conflict: ${block.id} cannot be replaced by ${rule.blockId}`);
    }
    matchedIds.add(rule.blockId);
    return { ...block, id: rule.blockId };
  });

  const missing = rules.filter((rule) => !matchedIds.has(rule.blockId));
  if (missing.length > 0) {
    throw new Error(`Orphan stable citation rules: ${missing.map((rule) => rule.blockId).join(', ')}`);
  }

  return identified;
}

/**
 * Two explicit phases keep citation identity independent from paragraph wording:
 * first assign the stable editorial block ids from semantic section positions,
 * then attach bibliography ids only through the resulting `block.id` map.
 */
export function attachEssayCitations(
  blocks: EssayBlock[],
  rules: StableCitationRule[],
): EssayBlock[] {
  const identified = identifyCitationBlocks(blocks, rules);
  const citationsByBlockId = new Map(
    rules.map((rule) => [rule.blockId, [...rule.sourceIds]] as const),
  );

  return identified.map((block) => {
    if (!block.id) return block;
    const sourceIds = citationsByBlockId.get(block.id);
    return sourceIds ? { ...block, sourceIds } : block;
  });
}

export const mayakovskyPartOneCitationRules: StableCitationRule[] = [
  {
    blockId: 'mayakovsky-early-baghdadi-birth',
    sectionHeading: 'Багдади, смерть отца и Москва',
    proseIndex: 0,
    sourceIds: ['self-autobiography', 'family-1905'],
  },
  {
    blockId: 'mayakovsky-early-underground-arrests',
    sectionHeading: 'Подполье, аресты и камера № 103',
    proseIndex: 0,
    sourceIds: ['self-autobiography', 'reg-card-1908'],
  },
  {
    blockId: 'mayakovsky-early-burliuk-school',
    sectionHeading: 'Бурлюк и рождение футуриста',
    proseIndex: 0,
    sourceIds: ['self-autobiography', 'student-1910', 'early-chronicle-1912'],
  },
  {
    blockId: 'mayakovsky-early-futurists-1912',
    sectionHeading: 'Бурлюк и рождение футуриста',
    proseIndex: 1,
    sourceIds: ['early-chronicle-1912', 'futurists-1912', 'early-latest-russian-poetry'],
  },
  {
    blockId: 'mayakovsky-early-yellow-jacket',
    sectionHeading: 'Жёлтая кофта и театр публичного чтения',
    proseIndex: 0,
    sourceIds: ['early-chronicle-1913', 'nate'],
  },
  {
    blockId: 'mayakovsky-early-listen-vulnerability',
    sectionHeading: '«Послушайте!» — человек под бронёй',
    proseIndex: 0,
    sourceIds: ['listen'],
  },
  {
    blockId: 'mayakovsky-early-cloud-history',
    sectionHeading: '«Облако в штанах»: четыре крика «долой»',
    proseIndex: 0,
    sourceIds: ['cloud', 'cloud-preface'],
  },
  {
    blockId: 'mayakovsky-early-briks-1915',
    sectionHeading: 'Июль 1915-го: Лиля и Осип Брики',
    proseIndex: 0,
    sourceIds: ['self-autobiography', 'mayakovsky-lilya-1915', 'early-chronicle-1915'],
  },
  {
    blockId: 'mayakovsky-early-lilichka-1916',
    sectionHeading: '«Лиличка!» и язык зависимости',
    proseIndex: 0,
    sourceIds: ['lilichka'],
  },
  {
    blockId: 'mayakovsky-early-film-revolution-1918',
    sectionHeading: 'Кино, революция и конец первой эпохи',
    proseIndex: 0,
    sourceIds: ['lady-hooligan', 'mystery-bouffe-first'],
  },
];

export const mayakovskyPartTwoCitationRules: StableCitationRule[] = [
  {
    blockId: 'mayakovsky-late-bridge',
    sectionHeading: null,
    proseIndex: 0,
    sourceIds: ['self-late', 'full-voice'],
  },
  {
    blockId: 'mayakovsky-late-rosta',
    sectionHeading: 'РОСТА: рисунок, ритм и ежедневная работа',
    proseIndex: 0,
    sourceIds: ['articles-1918-1930', 'how-to-make-poems'],
  },
  {
    blockId: 'mayakovsky-late-lef',
    sectionHeading: 'ЛЕФ и редакционный дом',
    proseIndex: 0,
    sourceIds: ['lef-ref', 'circle-1924', 'circle-1925'],
  },
  {
    blockId: 'mayakovsky-late-america-1925',
    sectionHeading: 'Мексика, Америка и взгляд извне',
    proseIndex: 0,
    sourceIds: ['mexico-1925', 'jangfeldt-biography'],
  },
  {
    blockId: 'mayakovsky-late-lilya-yakovleva-home',
    sectionHeading: 'Лиля, Татьяна и невозможность дома',
    proseIndex: 0,
    sourceIds: ['yakovleva-letter', 'kostrov-letter', 'crimea-1926'],
  },
  {
    blockId: 'mayakovsky-late-exhibition-role',
    sectionHeading: 'Революцией мобилизованный',
    proseIndex: 0,
    sourceIds: ['opening-exhibition', 'museum-invited-list'],
  },
  {
    blockId: 'mayakovsky-late-october-revolution',
    sectionHeading: 'Революцией мобилизованный',
    proseIndex: 1,
    sourceIds: ['self-late', 'mystery-bouffe-libretto', 'lenin-poem'],
  },
  {
    blockId: 'mayakovsky-late-crises-1930',
    sectionHeading: '1930: несколько кризисов сразу',
    proseIndex: 0,
    sourceIds: ['bathhouse', 'letter-lilya-march-1930', 'opening-exhibition', 'red-presnya-speech'],
  },
  {
    blockId: 'mayakovsky-late-death-1930',
    sectionHeading: '1930: несколько кризисов сразу',
    proseIndex: 3,
    sourceIds: ['letter-everyone', 'chronicle-1930'],
  },
  {
    blockId: 'mayakovsky-late-funeral-canon',
    sectionHeading: 'После выстрела — бронза',
    proseIndex: 0,
    sourceIds: ['chronicle-1930', 'kle-mayakovsky'],
  },
];

export const brikCitationRules: StableCitationRule[] = [
  {
    blockId: 'brik-lead-1915',
    sectionHeading: null,
    proseIndex: 0,
    sourceIds: ['brik-self', 'brik-photo-mayakovsky-lilya-1915', 'brik-correspondence'],
  },
  {
    blockId: 'brik-zhukovskogo-apartment',
    sectionHeading: 'Жуковского, июль 1915-го',
    proseIndex: 0,
    sourceIds: ['brik-self', 'brik-photo-circle-1924', 'brik-photo-circle-1925'],
  },
  {
    blockId: 'brik-cloud-before-lilya',
    sectionHeading: 'Жуковского, июль 1915-го',
    proseIndex: 1,
    sourceIds: ['brik-self', 'brik-variants'],
  },
  {
    blockId: 'brik-changing-union',
    sectionHeading: 'Не треугольник, а меняющийся союз',
    proseIndex: 0,
    sourceIds: ['brik-correspondence', 'rgali-lilya-katanyan', 'rgali-osip'],
  },
  {
    blockId: 'brik-jealousy',
    sectionHeading: 'Не треугольник, а меняющийся союз',
    proseIndex: 1,
    sourceIds: ['brik-correspondence', 'puppy-note'],
  },
  {
    blockId: 'brik-ring',
    sectionHeading: 'Кольцо и язык привязанности',
    proseIndex: 0,
    sourceIds: ['ring-lyub', 'brik-love'],
  },
  {
    blockId: 'brik-separation-1922',
    sectionHeading: 'Два месяца и поэма «Про это»',
    proseIndex: 0,
    sourceIds: ['brik-letter-dec-1922', 'brik-letter-jan-1923', 'brik-pro-eto'],
  },
  {
    blockId: 'brik-voluntary-confinement',
    sectionHeading: 'Два месяца и поэма «Про это»',
    proseIndex: 1,
    sourceIds: ['brik-correspondence', 'paperny-pro-eto'],
  },
  {
    blockId: 'brik-diary-publication',
    sectionHeading: 'Два месяца и поэма «Про это»',
    proseIndex: 3,
    sourceIds: ['parnis-diary', 'rgali-lilya-katanyan'],
  },
];

export const stableCitationRuleSets = {
  'mayakovsky-before-revolution': mayakovskyPartOneCitationRules,
  'mayakovsky-gromovoy': mayakovskyPartTwoCitationRules,
  'brik-case': brikCitationRules,
} as const;

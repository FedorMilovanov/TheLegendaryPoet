from pathlib import Path

ROOT = Path('.')


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding='utf-8')


def add_object_id(path: str, marker: str, block_id: str) -> None:
    text = read(path)
    marker_index = text.find(marker)
    if marker_index < 0:
        raise SystemExit(f'{path}: marker not found: {marker}')

    object_start = text.rfind('    {\n', 0, marker_index)
    if object_start < 0:
        raise SystemExit(f'{path}: object start not found for {marker}')
    insert_at = object_start + len('    {\n')
    object_prefix = text[insert_at:marker_index]
    if "id: '" in object_prefix:
        return
    text = text[:insert_at] + f"      id: '{block_id}',\n" + text[insert_at:]
    write(path, text)


def add_inline_section_id(path: str, heading: str, block_id: str) -> None:
    text = read(path)
    old = f"{{ type: 'section', heading: '{heading}' }}"
    new = f"{{ id: '{block_id}', type: 'section', heading: '{heading}' }}"
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'{path}: inline section not found: {heading}')
    write(path, text.replace(old, new, 1))


# Stable paragraph / lead ids for citations.
for path, marker, block_id in [
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'Владимир Маяковский родился", 'early-birth'),
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'В пятнадцать лет Маяковский вступил", 'early-underground'),
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'В 1911 году Маяковский поступил", 'early-burlyuk'),
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'В декабре 1912 года", 'early-futurists'),
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'Высокий рост, жёлтая кофта", 'early-stage'),
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'Раннего Маяковского легко свести", 'early-listen'),
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'Главная дореволюционная поэма", 'early-cloud'),
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'В конце июля 1915 года Эльза Каган", 'early-briks'),
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'В 1916 году Маяковский написал", 'early-lilichka'),
    ('src/data/essays/mayakovskyPartOne.ts', "text: 'В 1918 году Маяковский писал сценарии", 'early-cinema'),
    ('src/data/essays/mayakovskyPartTwoVisual.ts', "text: 'Вторая часть начинается там", 'late-lead'),
    ('src/data/essays/mayakovskyPartTwoVisual.ts', "text: 'В 1919–1922 годах Маяковский работал", 'late-rosta'),
    ('src/data/essays/mayakovskyPartTwoVisual.ts', "text: 'В 1922 году возник ЛЕФ", 'late-lef'),
    ('src/data/essays/mayakovskyPartTwoVisual.ts', "text: 'В 1925 году Маяковский через Мексику", 'late-america'),
    ('src/data/essays/mayakovskyPartTwoVisual.ts', "text: 'Связь с Лилей Брик сохранялась", 'late-relationships'),
    ('src/data/essays/mayakovskyGromovoy.ts', "text: 'На открытии выставки «20 лет работы»", 'late-exhibition'),
    ('src/data/essays/mayakovskyGromovoy.ts', "text: 'Октябрьскую революцию Маяковский принял", 'late-october'),
    ('src/data/essays/mayakovskyGromovoy.ts', "text: 'Последние месяцы не укладываются", 'late-crises'),
    ('src/data/essays/mayakovskyGromovoy.ts', "text: '14 апреля 1930 года", 'late-death'),
    ('src/data/essays/mayakovskyGromovoy.ts', "text: 'Похороны 17 апреля 1930 года", 'late-funeral'),
    ('src/data/essays/brikCase.ts', "text: 'В конце июля 1915 года Маяковский познакомился", 'brik-lead'),
    ('src/data/essays/brikCase.ts', "text: 'Квартира Бриков на улице Жуковского", 'brik-apartment'),
    ('src/data/essays/brikCase.ts', "text: 'Эта сцена не была мгновенным пленением", 'brik-cloud-context'),
    ('src/data/essays/brikCase.ts', "text: 'Слово «треугольник» создаёт", 'brik-union'),
    ('src/data/essays/brikCase.ts', "text: 'Эта свобода не уничтожила ревность", 'brik-dependence'),
    ('src/data/essays/brikCase.ts', "text: 'Одним из самых точных символов", 'brik-ring'),
    ('src/data/essays/brikCase.ts', "text: 'В конце 1922 года отношения переживали кризис", 'brik-separation'),
    ('src/data/essays/brikCase.ts', "text: 'Формула «добровольное заключение»", 'brik-imprisonment'),
    ('src/data/essays/brikCase.ts', "text: 'История публикации письма-дневника", 'brik-diary'),
]:
    add_object_id(path, marker, block_id)

# Stable image ids used by editorial placement rules.
for path, marker, block_id in [
    ('src/data/essays/mayakovskyPartOne.ts', 'Mayakovsky-SN-001.jpg', 'image-family-1905'),
    ('src/data/essays/mayakovskyPartOne.ts', 'Mayakovsky_Reg_card.jpg', 'image-reg-card-1908'),
    ('src/data/essays/mayakovskyPartOne.ts', 'Mayakovsky_1910.jpg', 'image-student-1910'),
    ('src/data/essays/mayakovskyPartOne.ts', 'Vladimir_Mayakovsky_1914.jpg', 'image-mayakovsky-1914'),
    ('src/data/essays/mayakovskyPartTwoVisual.ts', 'Mayakovsky_Brik_Crimea_1926.jpg', 'image-crimea-1926'),
    ('src/data/essays/mayakovskyPartTwoVisual.ts', '1927._Владимир_Маяковский_бреется.jpg', 'image-shaving-1927'),
    ('src/data/essays/brikCaseVisual.ts', 'Osip_LUB.jpg', 'image-briks-honeymoon-1912'),
    ('src/data/essays/brikCaseVisual.ts', 'Osip_Brik.jpg', 'image-osip-1928'),
    ('src/data/essays/brikCaseVisual.ts', '1928_LYuB_editing_film.jpg', 'image-lilya-editing-1928'),
    ('src/data/essays/brikCaseVisual.ts', 'Mayakovsky_Brik_Crimea_1926.jpg', 'image-brik-crimea-1926'),
]:
    add_object_id(path, marker, block_id)

# Stable section ids for archive insertion and movement extraction.
for path, heading, block_id in [
    ('src/data/essays/mayakovskyGromovoy.ts', 'Революцией мобилизованный', 'late-revolution-section'),
    ('src/data/essays/mayakovskyGromovoy.ts', '1930: несколько кризисов сразу', 'late-crises-section'),
    ('src/data/essays/mayakovskyGromovoy.ts', 'После выстрела — бронза', 'late-after-shot-section'),
    ('src/data/essays/brikCase.ts', 'Жуковского, июль 1915-го', 'brik-zhukovskogo-section'),
    ('src/data/essays/brikCase.ts', 'Не треугольник, а меняющийся союз', 'brik-union-section'),
    ('src/data/essays/brikCase.ts', 'Кольцо и язык привязанности', 'brik-ring-section'),
    ('src/data/essays/brikCase.ts', 'Осип: издатель, теоретик и сотрудник органов', 'brik-osip-section'),
    ('src/data/essays/brikCase.ts', 'Деньги, работа и общий быт', 'brik-money-section'),
    ('src/data/essays/brikCase.ts', 'Поздняя история о закрытой двери', 'brik-closed-door-section'),
    ('src/data/essays/yeseninKutezhi.ts', 'Два Есенина', 'yesenin-two-section'),
    ('src/data/essays/yeseninKutezhi.ts', 'Дурная слава', 'yesenin-bad-fame-section'),
    ('src/data/essays/yeseninKutezhi.ts', 'Москва кабацкая', 'yesenin-moscow-tavern-section'),
    ('src/data/essays/yeseninKutezhi.ts', 'Железный гость', 'yesenin-iron-guest-section'),
    ('src/data/essays/yeseninKutezhi.ts', 'Персидская передышка', 'yesenin-persian-section'),
    ('src/data/essays/yeseninKutezhi.ts', 'Чёрный человек', 'yesenin-black-man-section'),
    ('src/data/essays/yeseninKutezhi.ts', 'Под маской — нежность', 'yesenin-tenderness-section'),
    ('src/data/essays/yeseninKutezhi.ts', 'Что это было', 'yesenin-conclusion-section'),
]:
    add_inline_section_id(path, heading, block_id)

# Replace fragile text-prefix citation rules with stable block ids.
write('src/data/essays/essayCitations.ts', """import type { EssayBlock } from '../../types/essay';

interface CitationRule {
  blockId: string;
  sourceIds: string[];
}

export function attachEssayCitations(
  blocks: EssayBlock[],
  rules: CitationRule[],
): EssayBlock[] {
  const blockIds = new Set(blocks.flatMap((block) => (block.id ? [block.id] : [])));
  for (const rule of rules) {
    if (!blockIds.has(rule.blockId)) {
      throw new Error(`Citation rule points to missing essay block: ${rule.blockId}`);
    }
  }

  return blocks.map((block) => {
    if (block.type !== 'paragraph' && block.type !== 'lead' && block.type !== 'note') return block;
    const rule = rules.find(({ blockId }) => block.id === blockId);
    return rule ? { ...block, sourceIds: rule.sourceIds } : block;
  });
}

export const mayakovskyPartOneCitationRules: CitationRule[] = [
  { blockId: 'early-birth', sourceIds: ['self-autobiography', 'family-1905'] },
  { blockId: 'early-underground', sourceIds: ['self-autobiography', 'reg-card-1908'] },
  { blockId: 'early-burlyuk', sourceIds: ['self-autobiography', 'student-1910', 'early-chronicle-1912'] },
  { blockId: 'early-futurists', sourceIds: ['early-chronicle-1912', 'futurists-1912', 'early-latest-russian-poetry'] },
  { blockId: 'early-stage', sourceIds: ['early-chronicle-1913', 'nate'] },
  { blockId: 'early-listen', sourceIds: ['listen'] },
  { blockId: 'early-cloud', sourceIds: ['cloud', 'cloud-preface'] },
  { blockId: 'early-briks', sourceIds: ['self-autobiography', 'mayakovsky-lilya-1915', 'early-chronicle-1915'] },
  { blockId: 'early-lilichka', sourceIds: ['lilichka'] },
  { blockId: 'early-cinema', sourceIds: ['lady-hooligan', 'mystery-bouffe-first'] },
];

export const mayakovskyPartTwoCitationRules: CitationRule[] = [
  { blockId: 'late-lead', sourceIds: ['self-late', 'full-voice'] },
  { blockId: 'late-rosta', sourceIds: ['articles-1918-1930', 'how-to-make-poems'] },
  { blockId: 'late-lef', sourceIds: ['lef-ref', 'circle-1924', 'circle-1925'] },
  { blockId: 'late-america', sourceIds: ['mexico-1925', 'jangfeldt-biography'] },
  { blockId: 'late-relationships', sourceIds: ['yakovleva-letter', 'kostrov-letter', 'crimea-1926'] },
  { blockId: 'late-exhibition', sourceIds: ['opening-exhibition', 'museum-invited-list'] },
  { blockId: 'late-october', sourceIds: ['self-late', 'mystery-bouffe-libretto', 'lenin-poem'] },
  { blockId: 'late-crises', sourceIds: ['bathhouse', 'letter-lilya-march-1930', 'opening-exhibition', 'red-presnya-speech'] },
  { blockId: 'late-death', sourceIds: ['letter-everyone', 'chronicle-1930'] },
  { blockId: 'late-funeral', sourceIds: ['chronicle-1930', 'kle-mayakovsky'] },
];

export const brikCitationRules: CitationRule[] = [
  { blockId: 'brik-lead', sourceIds: ['brik-self', 'brik-photo-mayakovsky-lilya-1915', 'brik-correspondence'] },
  { blockId: 'brik-apartment', sourceIds: ['brik-self', 'brik-photo-circle-1924', 'brik-photo-circle-1925'] },
  { blockId: 'brik-cloud-context', sourceIds: ['brik-self', 'brik-variants'] },
  { blockId: 'brik-union', sourceIds: ['brik-correspondence', 'rgali-lilya-katanyan', 'rgali-osip'] },
  { blockId: 'brik-dependence', sourceIds: ['brik-correspondence', 'puppy-note'] },
  { blockId: 'brik-ring', sourceIds: ['ring-lyub', 'brik-love'] },
  { blockId: 'brik-separation', sourceIds: ['brik-letter-dec-1922', 'brik-letter-jan-1923', 'brik-pro-eto'] },
  { blockId: 'brik-imprisonment', sourceIds: ['brik-correspondence', 'paperny-pro-eto'] },
  { blockId: 'brik-diary', sourceIds: ['parnis-diary', 'rgali-lilya-katanyan'] },
];
""")

write('src/data/essays/essayVisualLayout.ts', """import type { EssayBlock, EssayImagePlacement } from '../../types/essay';

interface PlacementRule {
  imageId: string;
  placement: EssayImagePlacement;
}

export function placeEssayImages(
  blocks: EssayBlock[],
  rules: PlacementRule[],
): EssayBlock[] {
  const blockIds = new Set(blocks.flatMap((block) => (block.id ? [block.id] : [])));
  for (const rule of rules) {
    if (!blockIds.has(rule.imageId)) {
      throw new Error(`Image placement points to missing essay block: ${rule.imageId}`);
    }
  }

  return blocks.map((block) => {
    if (block.type !== 'image') return block;
    const rule = rules.find(({ imageId }) => block.id === imageId);
    return rule ? { ...block, placement: rule.placement } : block;
  });
}

export const mayakovskyPartOnePlacements: PlacementRule[] = [
  { imageId: 'image-family-1905', placement: 'right' },
  { imageId: 'image-reg-card-1908', placement: 'left' },
  { imageId: 'image-student-1910', placement: 'right' },
  { imageId: 'image-mayakovsky-1914', placement: 'left' },
];

export const mayakovskyPartTwoPlacements: PlacementRule[] = [
  { imageId: 'image-crimea-1926', placement: 'right' },
  { imageId: 'image-shaving-1927', placement: 'left' },
];

export const brikEssayPlacements: PlacementRule[] = [
  { imageId: 'image-briks-honeymoon-1912', placement: 'left' },
  { imageId: 'image-osip-1928', placement: 'right' },
  { imageId: 'image-lilya-editing-1928', placement: 'left' },
  { imageId: 'image-brik-crimea-1926', placement: 'right' },
];
""")

write('src/data/essays/visualArchive.ts', """import type { EssayBlock } from '../../types/essay';

type ArchiveImage = Extract<EssayBlock, { type: 'image' }>;

/** Insert sourced visuals after a stable section id, never after editable display text. */
export function insertArchiveImages(
  blocks: EssayBlock[],
  imagesBySectionId: Record<string, ArchiveImage[]>,
): EssayBlock[] {
  const matched = new Set<string>();
  const result = blocks.reduce<EssayBlock[]>((output, block) => {
    output.push(block);
    if (block.type === 'section' && block.id) {
      const images = imagesBySectionId[block.id];
      if (images) {
        matched.add(block.id);
        output.push(...images);
      }
    }
    return output;
  }, []);

  for (const sectionId of Object.keys(imagesBySectionId)) {
    if (!matched.has(sectionId)) {
      throw new Error(`Archive image group points to missing section: ${sectionId}`);
    }
  }
  return result;
}

/** Return the essay movement beginning with a stable section id. */
export function fromSection(blocks: EssayBlock[], sectionId: string): EssayBlock[] {
  const index = blocks.findIndex(
    (block) => block.type === 'section' && block.id === sectionId,
  );
  if (index < 0) throw new Error(`Essay movement section not found: ${sectionId}`);
  return blocks.slice(index);
}
""")

# Replace archive maps and movement lookups with stable ids.
for path, replacements in {
    'src/data/essays/mayakovskyPartTwoVisual.ts': {
        "fromSection(baseMayakovsky.blocks, 'Революцией мобилизованный')": "fromSection(baseMayakovsky.blocks, 'late-revolution-section')",
        "'Революцией мобилизованный':": "'late-revolution-section':",
        "'1930: несколько кризисов сразу':": "'late-crises-section':",
        "'После выстрела — бронза':": "'late-after-shot-section':",
    },
    'src/data/essays/brikCaseVisual.ts': {
        "'Жуковского, июль 1915-го':": "'brik-zhukovskogo-section':",
        "'Не треугольник, а меняющийся союз':": "'brik-union-section':",
        "'Кольцо и язык привязанности':": "'brik-ring-section':",
        "'Осип: издатель, теоретик и сотрудник органов':": "'brik-osip-section':",
        "'Деньги, работа и общий быт':": "'brik-money-section':",
        "'Поздняя история о закрытой двери':": "'brik-closed-door-section':",
    },
    'src/data/essays/yeseninVisual.ts': {
        "'Два Есенина':": "'yesenin-two-section':",
        "'Дурная слава':": "'yesenin-bad-fame-section':",
        "'Москва кабацкая':": "'yesenin-moscow-tavern-section':",
        "'Железный гость':": "'yesenin-iron-guest-section':",
        "'Персидская передышка':": "'yesenin-persian-section':",
        "'Чёрный человек':": "'yesenin-black-man-section':",
        "'Под маской — нежность':": "'yesenin-tenderness-section':",
        "'Что это было':": "'yesenin-conclusion-section':",
    },
}.items():
    text = read(path)
    for old, new in replacements.items():
        if old not in text and new not in text:
            raise SystemExit(f'{path}: replacement target missing: {old}')
        text = text.replace(old, new)
    write(path, text)

from pathlib import Path

ROOT = Path('.')

MODULE = r'''import type { EssayBlock } from '../../types/essay';

const disclosureText =
  'В статье используются подлинные архивные изображения, документы и редакционные реконструкции. Все реконструкции отдельно помечены, созданы по историческим референсам и не являются подлинными фотографиями эпохи.';

const disclosure: EssayBlock = {
  type: 'note',
  variant: 'editorial',
  text: disclosureText,
};

function insertDisclosure(blocks: EssayBlock[]): EssayBlock[] {
  if (blocks.some((block) => block.type === 'note' && block.text === disclosureText)) return blocks;
  const leadIndex = blocks.findIndex((block) => block.type === 'lead');
  if (leadIndex < 0) return [disclosure, ...blocks];
  return [...blocks.slice(0, leadIndex + 1), disclosure, ...blocks.slice(leadIndex + 1)];
}

function insertAfterSectionIntro(
  blocks: EssayBlock[],
  heading: string,
  additions: EssayBlock[],
): EssayBlock[] {
  const imageSources = new Set(
    blocks.filter((block) => block.type === 'image').map((block) => block.src),
  );
  const pending = additions.filter(
    (block) => block.type !== 'image' || !imageSources.has(block.src),
  );
  if (pending.length === 0) return blocks;

  const sectionIndex = blocks.findIndex(
    (block) => block.type === 'section' && block.heading === heading,
  );
  if (sectionIndex < 0) {
    throw new Error(`Mayakovsky visual wave placement section not found: ${heading}`);
  }

  const introIndex = blocks.findIndex(
    (block, index) => index > sectionIndex && block.type === 'paragraph',
  );
  if (introIndex < 0) {
    throw new Error(`Mayakovsky visual wave intro paragraph not found: ${heading}`);
  }

  return [
    ...blocks.slice(0, introIndex + 1),
    ...pending,
    ...blocks.slice(introIndex + 1),
  ];
}

const reconstructionCredit = 'THE LEGENDARY POET · редакционная реконструкция';

const rostaWorkshop: EssayBlock = {
  type: 'image',
  src: '/images/essays/mayakovsky/wave/mayakovsky-rosta-workshop.webp',
  alt: 'Редакционная реконструкция Владимира Маяковского за работой в плакатной мастерской',
  caption:
    'Редакционная реконструкция: собирательный образ Маяковского за работой над агитационной графикой. Сцена создана по историческим портретным, плакатным и интерьерным референсам. Не является подлинной фотографией эпохи.',
  credit: reconstructionCredit,
  kind: 'reconstruction',
  layout: 'cinematic',
  tilt: false,
};

const dlyaGolosa: EssayBlock = {
  type: 'image',
  src: '/images/essays/mayakovsky/wave/mayakovsky-dlya-golosa-1923.webp',
  alt: 'Разворот книги Владимира Маяковского Для голоса в оформлении Эль Лисицкого, 1923',
  caption:
    'Подлинный печатный объект: разворот страниц 2–3 книги Маяковского «Для голоса», оформленной Эль Лисицким в 1923 году.',
  credit: 'Эль Лисицкий · конструкция книги, 1923 · public domain',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dlja_golosa._1923-100.jpg',
  kind: 'document',
  layout: 'wide',
  tilt: false,
};

const publicReader: EssayBlock = {
  type: 'image',
  src: '/images/essays/mayakovsky/wave/mayakovsky-public-reader.webp',
  alt: 'Редакционная реконструкция публичного чтения Владимира Маяковского',
  caption:
    'Редакционная реконструкция: собирательный образ Маяковского как публичного читателя. Сцена создана по историческим портретным и биографическим референсам. Не является подлинной фотографией эпохи.',
  credit: reconstructionCredit,
  kind: 'reconstruction',
  layout: 'cinematic',
  tilt: false,
};

const lateDesk: EssayBlock = {
  type: 'image',
  src: '/images/essays/mayakovsky/wave/mayakovsky-late-desk.webp',
  alt: 'Редакционная реконструкция позднего Владимира Маяковского за рабочим столом',
  caption:
    'Редакционная реконструкция: собирательная камерная сцена позднего рабочего периода Маяковского. Создана по историческим портретным и интерьерным референсам. Не является подлинной фотографией эпохи.',
  credit: reconstructionCredit,
  kind: 'reconstruction',
  layout: 'cinematic',
  tilt: false,
};

const brikReading: EssayBlock = {
  type: 'image',
  src: '/images/essays/mayakovsky/wave/brik-reading-table.webp',
  alt: 'Редакционная реконструкция чтения рукописи Владимиром Маяковским Лиле и Осипу Брикам',
  caption:
    'Редакционная реконструкция: Маяковский читает рукопись Лиле и Осипу Брикам. Сцена создана по историческим портретным и биографическим референсам. Не является подлинной фотографией эпохи.',
  credit: reconstructionCredit,
  kind: 'reconstruction',
  layout: 'cinematic',
  tilt: false,
};

const brikCabinet: EssayBlock = {
  type: 'image',
  src: '/images/essays/mayakovsky/wave/brik-trio-cabinet.webp',
  alt: 'Редакционная реконструкция камерной сцены с Маяковским, Лилей и Осипом Бриками',
  caption:
    'Редакционная реконструкция: собирательная камерная сцена из круга Маяковского и Бриков. Создана по историческим портретным, интерьерным и биографическим референсам. Не является подлинной фотографией эпохи.',
  credit: reconstructionCredit,
  kind: 'reconstruction',
  layout: 'cinematic',
  tilt: false,
};

export function applyMayakovskyPartTwoVisualWave(source: EssayBlock[]): EssayBlock[] {
  let blocks = insertDisclosure(source);
  blocks = insertAfterSectionIntro(
    blocks,
    'РОСТА: рисунок, ритм и ежедневная работа',
    [rostaWorkshop],
  );
  blocks = insertAfterSectionIntro(
    blocks,
    'ЛЕФ: журнал, теория и новый круг',
    [dlyaGolosa],
  );
  blocks = insertAfterSectionIntro(
    blocks,
    'Лирик, которого не отменил плакат',
    [publicReader],
  );
  blocks = insertAfterSectionIntro(
    blocks,
    '1930: несколько кризисов сразу',
    [lateDesk],
  );
  return blocks;
}

export function applyBrikVisualWave(source: EssayBlock[]): EssayBlock[] {
  let blocks = insertDisclosure(source);
  blocks = insertAfterSectionIntro(blocks, 'Жуковского, июль 1915-го', [brikReading]);
  blocks = insertAfterSectionIntro(
    blocks,
    'Не треугольник, а меняющийся союз',
    [brikCabinet],
  );
  return blocks;
}
'''

DOC = r'''# Mayakovsky visual wave — 2026-08-03

**Scope:** `mayakovsky-gromovoy` and `brik-case`  
**Branch:** `editorial/longform-marathon-2026-08`  
**Status:** integrated editorial wave; PR remains Draft

## Editorial rule

The wave keeps archival evidence and project-created scenes visibly separate.

- `document` / `archive` means an item-level historical object with a public source URL;
- `reconstruction` means project artwork created from historical references;
- every reconstruction states that it is not an authentic photograph of the period;
- reconstructions are atmosphere and interpretation, never evidence for a factual claim.

## User-supplied editorial reconstructions

| Asset | Article placement | SHA-256 |
|---|---|---|
| `brik-reading-table.webp` | `brik-case` — after the opening paragraph of “Жуковского, июль 1915-го” | `66fb70933548f8366313bc0e082da246f07e626d533c4e71d0bc2fc376cbffd8` |
| `brik-trio-cabinet.webp` | `brik-case` — after the opening paragraph of “Не треугольник, а меняющийся союз” | `bbc47272bf8b579d700789dd2e89acbe488f9fc7a2b9423e893360b6ec100d01` |
| `mayakovsky-rosta-workshop.webp` | `mayakovsky-gromovoy` — ROSTA section | `c5e27649d7f935622821556f607d1972de7d06da81d31c864b46d8b300092cec` |
| `mayakovsky-public-reader.webp` | `mayakovsky-gromovoy` — lyric/public voice section | `64b971c8c4afa515a7dff9bf10eb0bf7f5b338c1364d24a1b93cb9772a480424` |
| `mayakovsky-late-desk.webp` | `mayakovsky-gromovoy` — 1930 crisis section | `9af946dad87d0ae7444c18863801a15ca5932fdf14a9db0e0519606bdb739bb7` |

These five files are credited to `THE LEGENDARY POET · редакционная реконструкция`; they carry no archival source link.

## Historical document from Drive

- asset: `mayakovsky-dlya-golosa-1923.webp`;
- Drive source file ID: `11VuZIqX58rJlyvUS5E62h52bj2MD47Zi`;
- identity: Vladimir Mayakovsky, *Для голоса*, pages 2–3, book design by El Lissitzky, 1923;
- public item page: `https://commons.wikimedia.org/wiki/File:Dlja_golosa._1923-100.jpg`;
- rights marker: public domain on the Commons item page;
- SHA-256: `f470dfbf33b722796ab7389c43ca3c09c4273323823814423ba7d84c29408e8b`;
- placement: LEF section of `mayakovsky-gromovoy`.

## Package integrity

- source package: `MAYAKOVSKY_VISUAL_WAVE_2026-08-03.zip`;
- package bytes: `142318`;
- package SHA-256: `148290b498bf6d5e05ed15aa5fdab5781a9f5853edddc936b6031d196cc53326`;
- internal `SHA256SUMS.txt` is checked before installation.
'''

PROVENANCE_APPEND = r'''

  - path: public/images/essays/mayakovsky/wave/brik-reading-table.webp
    role: essay_inline_reconstruction
    origin_class: local_editorial_reconstruction_from_historical_references
    evidence: docs/research/MAYAKOVSKY_VISUAL_WAVE_2026-08-03.md
    sha256: 66fb70933548f8366313bc0e082da246f07e626d533c4e71d0bc2fc376cbffd8
    review_status: VERIFIED-LOCAL-EDITORIAL
    source_use: not_primary_evidence
    notes: User-supplied project artwork; caption explicitly states that it is not an authentic photograph of the period.

  - path: public/images/essays/mayakovsky/wave/brik-trio-cabinet.webp
    role: essay_inline_reconstruction
    origin_class: local_editorial_reconstruction_from_historical_references
    evidence: docs/research/MAYAKOVSKY_VISUAL_WAVE_2026-08-03.md
    sha256: bbc47272bf8b579d700789dd2e89acbe488f9fc7a2b9423e893360b6ec100d01
    review_status: VERIFIED-LOCAL-EDITORIAL
    source_use: not_primary_evidence
    notes: User-supplied project artwork; caption explicitly states that it is not an authentic photograph of the period.

  - path: public/images/essays/mayakovsky/wave/mayakovsky-rosta-workshop.webp
    role: essay_inline_reconstruction
    origin_class: local_editorial_reconstruction_from_historical_references
    evidence: docs/research/MAYAKOVSKY_VISUAL_WAVE_2026-08-03.md
    sha256: c5e27649d7f935622821556f607d1972de7d06da81d31c864b46d8b300092cec
    review_status: VERIFIED-LOCAL-EDITORIAL
    source_use: not_primary_evidence
    notes: User-supplied project artwork; used as a composite atmosphere scene, not as evidence of a specific photographed event.

  - path: public/images/essays/mayakovsky/wave/mayakovsky-public-reader.webp
    role: essay_inline_reconstruction
    origin_class: local_editorial_reconstruction_from_historical_references
    evidence: docs/research/MAYAKOVSKY_VISUAL_WAVE_2026-08-03.md
    sha256: 64b971c8c4afa515a7dff9bf10eb0bf7f5b338c1364d24a1b93cb9772a480424
    review_status: VERIFIED-LOCAL-EDITORIAL
    source_use: not_primary_evidence
    notes: User-supplied project artwork; used as a composite public-reading image, not as evidence of a specific event.

  - path: public/images/essays/mayakovsky/wave/mayakovsky-late-desk.webp
    role: essay_inline_reconstruction
    origin_class: local_editorial_reconstruction_from_historical_references
    evidence: docs/research/MAYAKOVSKY_VISUAL_WAVE_2026-08-03.md
    sha256: 9af946dad87d0ae7444c18863801a15ca5932fdf14a9db0e0519606bdb739bb7
    review_status: VERIFIED-LOCAL-EDITORIAL
    source_use: not_primary_evidence
    notes: User-supplied project artwork; used as a composite late-period atmosphere scene, not as evidence of a specific event.

  - path: public/images/essays/mayakovsky/wave/mayakovsky-dlya-golosa-1923.webp
    role: essay_inline_document
    origin_class: public_domain_historical_print_from_commons_drive_copy
    evidence: docs/research/MAYAKOVSKY_VISUAL_WAVE_2026-08-03.md
    source_url: https://commons.wikimedia.org/wiki/File:Dlja_golosa._1923-100.jpg
    drive_source_id: 11VuZIqX58rJlyvUS5E62h52bj2MD47Zi
    sha256: f470dfbf33b722796ab7389c43ca3c09c4273323823814423ba7d84c29408e8b
    review_status: VERIFIED-PUBLIC-DOMAIN-DOCUMENT
    source_use: historical_document
    notes: Pages 2–3 of Mayakovsky's 1923 book designed by El Lissitzky; item page carries public-domain markers.
'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)


def edit_segment(text: str, start_marker: str, end_marker: str, transform) -> str:
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    segment = text[start:end]
    segment = transform(segment)
    return text[:start] + segment + text[end:]


module_path = ROOT / 'src/data/essays/mayakovskyVisualWave.ts'
module_path.write_text(MODULE)

doc_path = ROOT / 'docs/research/MAYAKOVSKY_VISUAL_WAVE_2026-08-03.md'
doc_path.write_text(DOC)

index_path = ROOT / 'src/data/essays/index.ts'
index = index_path.read_text()
import_block = "import {\n  applyBrikVisualWave,\n  applyMayakovskyPartTwoVisualWave,\n} from './mayakovskyVisualWave';\n"
if import_block not in index:
    anchor = "} from './essayMythChecks';\n"
    index = replace_once(index, anchor, anchor + import_block, 'visual-wave import')


def part_two(segment: str) -> str:
    if "dateModified: '2026-08-03'" not in segment:
        segment = replace_once(
            segment,
            '  ...mayakovskyPartTwo,\n',
            "  ...mayakovskyPartTwo,\n  dateModified: '2026-08-03',\n",
            'part two dateModified',
        )
    segment = replace_once(
        segment,
        '  blocks: placeEssayImages(\n',
        '  blocks: applyMayakovskyPartTwoVisualWave(placeEssayImages(\n',
        'part two visual wrapper',
    )
    segment = replace_once(
        segment,
        '    mayakovskyPartTwoPlacements,\n  ),\n',
        '    mayakovskyPartTwoPlacements,\n  )),\n',
        'part two visual wrapper close',
    )
    return segment


index = edit_segment(
    index,
    'const mayakovskyPartTwoWithLocalCover: Essay = {',
    'const brikCaseWithSourceLibrary: Essay = {',
    part_two,
)


def brik(segment: str) -> str:
    if "dateModified: '2026-08-03'" not in segment:
        segment = replace_once(
            segment,
            '  ...brikCaseVisual,\n',
            "  ...brikCaseVisual,\n  dateModified: '2026-08-03',\n",
            'brik dateModified',
        )
    segment = replace_once(
        segment,
        '  blocks: placeEssayImages(\n',
        '  blocks: applyBrikVisualWave(placeEssayImages(\n',
        'brik visual wrapper',
    )
    segment = replace_once(
        segment,
        '    brikEssayPlacements,\n  ),\n',
        '    brikEssayPlacements,\n  )),\n',
        'brik visual wrapper close',
    )
    return segment


index = edit_segment(
    index,
    'const brikCaseWithSourceLibrary: Essay = {',
    'export const essays: Essay[] = [',
    brik,
)
index_path.write_text(index)

renderer_path = ROOT / 'src/components/essay/EssayBlocks.tsx'
renderer = renderer_path.read_text()
renderer = replace_once(
    renderer,
    "  reconstruction: 'Художественная реконструкция',\n",
    "  reconstruction: 'Реконструкция по историческим референсам',\n",
    'reconstruction label',
)
renderer_path.write_text(renderer)

validator_path = ROOT / 'scripts/validate-essays.ts'
validator = validator_path.read_text()
validator_anchor = "      validateImagePath(essay, `image block ${index + 1}`, block.src);\n"
validator_checks = r'''      validateImagePath(essay, `image block ${index + 1}`, block.src);

      if (block.src.includes('/images/essays/mayakovsky/wave/')) {
        if (block.kind === 'reconstruction') {
          if (!block.caption.includes('Не является подлинной фотографией эпохи')) {
            error(essay, `reconstruction image block ${index + 1} lacks the authenticity disclosure`);
          }
          if (!block.credit?.includes('THE LEGENDARY POET')) {
            error(essay, `reconstruction image block ${index + 1} lacks the project credit`);
          }
          if (block.sourceUrl) {
            error(essay, `reconstruction image block ${index + 1} must not present an archival source URL`);
          }
        }
        if (block.kind === 'document' && !block.sourceUrl) {
          error(essay, `document image block ${index + 1} requires an item-level source URL`);
        }
      }
'''
if validator_checks not in validator:
    validator = replace_once(
        validator,
        validator_anchor,
        validator_checks,
        'visual-wave validator',
    )
validator_path.write_text(validator)

provenance_path = ROOT / 'public/images/PROVENANCE.yml'
provenance = provenance_path.read_text()
if 'public/images/essays/mayakovsky/wave/brik-reading-table.webp' not in provenance:
    provenance = provenance.rstrip() + PROVENANCE_APPEND + '\n'
provenance_path.write_text(provenance)

print('Mayakovsky visual wave content integration prepared.')

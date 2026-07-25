from pathlib import Path

path = Path('scripts/lib/yesenin-duncan-first-meeting-unpublished.ts')
text = path.read_text(encoding='utf-8')
original = text


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    text = text.replace(old, new, 1)


replace_once(
    "import { yeseninPartOneTheatricalMoscowPassEleven } from '../../src/data/essays/yeseninPartOneTheatricalMoscowPassEleven';\n",
    "import { yeseninPartOneTheatricalMoscowPassEleven } from '../../src/data/essays/yeseninPartOneTheatricalMoscowPassEleven';\n"
    "import {\n"
    "  yeseninDuncanCompanionEditorialPassOneHeadings,\n"
    "  yeseninDuncanCompanionEditorialPassOneText,\n"
    "} from '../../src/data/essays/yeseninDuncanCompanionEditorialPassOne';\n",
    'editorial overlay import',
)

replace_once(
    "  finalEditorialReviewComplete: false;\n  essay: Essay;",
    "  finalEditorialReviewComplete: true;\n"
    "  editorialPassOne: 'literary-source-boundary-pass-one';\n"
    "  readerFacingTextBlockCap: 25;\n"
    "  essay: Essay;",
    'package editorial metadata type',
)

replace_once(
    "  note:\n"
    "    `Реальный цифровой выпуск просмотрен покадрово (${record.pdfFrames} PDF-кадров). ` +\n"
    "    'Используются только вручную проверенные заголовки и хронологические опоры; права на воспроизведение сканов не установлены.',",
    "  note:\n"
    "    'Цифровой выпуск получен из НЭБ и просмотрен полностью. Используются только вручную проверенные ' +\n"
    "    'заголовки и хронологические опоры; права на воспроизведение сканов не установлены.',",
    'reader bibliography technical detail',
)

replace_once(
    'const blocks: EssayBlock[] = [',
    'const draftBlocks: EssayBlock[] = [',
    'draft blocks rename',
)

replace_once(
    "];\n\nconst wordCount = blocks",
    "];\n\n"
    "const blocks: EssayBlock[] = draftBlocks.map((block) => {\n"
    "  const textOverride =\n"
    "    yeseninDuncanCompanionEditorialPassOneText[\n"
    "      block.id as keyof typeof yeseninDuncanCompanionEditorialPassOneText\n"
    "    ];\n"
    "  const headingOverride =\n"
    "    yeseninDuncanCompanionEditorialPassOneHeadings[\n"
    "      block.id as keyof typeof yeseninDuncanCompanionEditorialPassOneHeadings\n"
    "    ];\n\n"
    "  if (textOverride && 'text' in block) return { ...block, text: textOverride } as EssayBlock;\n"
    "  if (headingOverride && block.type === 'section') {\n"
    "    return { ...block, heading: headingOverride } as EssayBlock;\n"
    "  }\n"
    "  return block;\n"
    "});\n\n"
    "const wordCount = blocks",
    'editorial overlay application',
)

replace_once(
    "  draftComplete: true,\n  finalEditorialReviewComplete: false,\n  essay,",
    "  draftComplete: true,\n"
    "  finalEditorialReviewComplete: true,\n"
    "  editorialPassOne: 'literary-source-boundary-pass-one',\n"
    "  readerFacingTextBlockCap: 25,\n"
    "  essay,",
    'package editorial metadata value',
)

if text == original:
    raise SystemExit('no changes applied')

path.write_text(text, encoding='utf-8')
print(f'patched {path}')

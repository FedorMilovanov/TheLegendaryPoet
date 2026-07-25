from pathlib import Path

path = Path('scripts/validate-yesenin-duncan-first-meeting-unpublished.ts')
text = path.read_text(encoding='utf-8')
original = text


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    text = text.replace(old, new, 1)


replace_once(
    "} from '../src/data/essays/yeseninDuncanMainArticleSplit';\n",
    "} from '../src/data/essays/yeseninDuncanMainArticleSplit';\n"
    "import {\n"
    "  yeseninDuncanCompanionEditorialPassOneExpectedHeadingIds,\n"
    "  yeseninDuncanCompanionEditorialPassOneExpectedTextIds,\n"
    "  yeseninDuncanCompanionEditorialPassOneHeadings,\n"
    "  yeseninDuncanCompanionEditorialPassOneText,\n"
    "} from '../src/data/essays/yeseninDuncanCompanionEditorialPassOne';\n",
    'editorial registry imports',
)

replace_once(
    "  article.draftComplete !== true ||\n"
    "  article.finalEditorialReviewComplete !== false ||\n"
    "  essay.id !== YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID ||",
    "  article.draftComplete !== true ||\n"
    "  article.finalEditorialReviewComplete !== true ||\n"
    "  article.editorialPassOne !== 'literary-source-boundary-pass-one' ||\n"
    "  article.readerFacingTextBlockCap !== 25 ||\n"
    "  essay.id !== YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID ||",
    'editorial completion contract',
)

replace_once(
    "if (sections.length !== 9) fail(`expected nine investigation sections, found ${sections.length}`);\n"
    "if (textBlocks.length < 24 || textBlocks.length > 28) {\n"
    "  fail(`expected a substantial but bounded companion draft, found ${textBlocks.length} text blocks`);\n"
    "}",
    "if (sections.length !== 9) fail(`expected nine investigation sections, found ${sections.length}`);\n"
    "if (textBlocks.length !== article.readerFacingTextBlockCap) {\n"
    "  fail(`expected exactly ${article.readerFacingTextBlockCap} companion text blocks, found ${textBlocks.length}`);\n"
    "}",
    'exact text block cap',
)

replace_once(
    "for (const block of essay.blocks) {\n"
    "  if (!('sourceIds' in block) || !block.sourceIds) continue;\n"
    "  for (const sourceId of block.sourceIds) {\n"
    "    if (!sourceIdSet.has(sourceId)) fail(`${block.id ?? block.type} references missing source ${sourceId}`);\n"
    "  }\n"
    "}\n",
    "const referencedSourceIds = new Set<string>();\n"
    "for (const block of essay.blocks) {\n"
    "  if (!('sourceIds' in block) || !block.sourceIds) continue;\n"
    "  for (const sourceId of block.sourceIds) {\n"
    "    if (!sourceIdSet.has(sourceId)) fail(`${block.id ?? block.type} references missing source ${sourceId}`);\n"
    "    referencedSourceIds.add(sourceId);\n"
    "  }\n"
    "}\n"
    "for (const sourceId of sourceIds) {\n"
    "  if (!referencedSourceIds.has(sourceId)) fail(`companion bibliography contains unused source ${sourceId}`);\n"
    "}\n"
    "const internalOnlySourceIds = new Set(['yd1-pss-duncan-chronology', 'yd1-mcvay-isadora-yesenin']);\n"
    "for (const source of essay.sources ?? []) {\n"
    "  if (!source.id) continue;\n"
    "  if (internalOnlySourceIds.has(source.id)) {\n"
    "    if (source.url) fail(`${source.id} must remain an internal-only source until a stable locator is recorded`);\n"
    "    continue;\n"
    "  }\n"
    "  if (!source.url?.startsWith('https://')) fail(`${source.id} is missing a stable HTTPS URL`);\n"
    "}\n",
    'source usage and locator policy',
)

replace_once(
    "  'Анатолия Мариенгофа',\n  'шести движений',",
    "  'Анатолия Мариенгофа',\n  'Устойчивый итог',\n  'порог новой главы',",
    'reader anchor update',
)

replace_once(
    "  /PDF\\s+\\d{2}/u,\n] as const)",
    "  /PDF\\s+\\d{2}/u,\n"
    "  /PDF-кадр/iu,\n"
    "  /item-level/iu,\n"
    "  /reader-facing/iu,\n"
    "  /production/iu,\n"
    "  /provenance/iu,\n"
    "  /для первой части биографии/iu,\n"
    "  /всё остальное принадлежит отдельному расследованию/iu,\n"
    "  /следующий шаг/iu,\n"
    "] as const)",
    'service and technical language ban',
)

replace_once(
    "if (essay.cluster?.role !== 'investigation' || essay.series) {\n"
    "  fail('companion must remain an investigation, not a numbered biography part');\n"
    "}\n\nconsole.log(",
    "if (essay.cluster?.role !== 'investigation' || essay.series) {\n"
    "  fail('companion must remain an investigation, not a numbered biography part');\n"
    "}\n\n"
    "const textById = new Map(textBlocks.map((block) => [block.id, block.text] as const));\n"
    "for (const blockId of yeseninDuncanCompanionEditorialPassOneExpectedTextIds) {\n"
    "  if (textById.get(blockId) !== yeseninDuncanCompanionEditorialPassOneText[blockId]) {\n"
    "    fail(`editorial text override is not rendered at ${blockId}`);\n"
    "  }\n"
    "}\n"
    "const sectionById = new Map(sections.map((block) => [block.id, block] as const));\n"
    "for (const blockId of yeseninDuncanCompanionEditorialPassOneExpectedHeadingIds) {\n"
    "  if (sectionById.get(blockId)?.heading !== yeseninDuncanCompanionEditorialPassOneHeadings[blockId]) {\n"
    "    fail(`editorial heading override is not rendered at ${blockId}`);\n"
    "  }\n"
    "}\n\nconsole.log(",
    'editorial overlay exact rendering checks',
)

replace_once(
    "status: 'UNPUBLISHED-COMPANION-DRAFT / MAIN-BIOGRAPHY-6-BLOCK-BUDGET / NO-REGISTRATION',",
    "status: 'UNPUBLISHED-COMPANION-EDITORIAL-PASS-ONE-COMPLETE / 25-BLOCK-CAP / NO-REGISTRATION',",
    'diagnostic status',
)

replace_once(
    "      sourceImagesAuthorized: article.sourceImagesAuthorized,",
    "      finalEditorialReviewComplete: article.finalEditorialReviewComplete,\n"
    "      editorialPassOne: article.editorialPassOne,\n"
    "      readerFacingTextBlockCap: article.readerFacingTextBlockCap,\n"
    "      sourceImagesAuthorized: article.sourceImagesAuthorized,",
    'diagnostic fields',
)

if text == original:
    raise SystemExit('no changes applied')

path.write_text(text, encoding='utf-8')
print(f'patched {path}')

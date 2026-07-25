#!/usr/bin/env python3
"""Apply the diagnostic Yesenin Part I Duncan compaction deterministically.

This helper exists only on the stacked diagnostic branch. It performs exact,
asserted text transformations so the main article keeps 146 evidence nodes while
rendering 140 reader-facing prose blocks. It also removes the physical-editorial
side effect and makes that override layer explicit in the builder.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_exact(path: str, old: str, new: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one exact replacement, found {count}\n--- OLD ---\n{old}")
    target.write_text(text.replace(old, new), encoding="utf-8")


# Freeze the split as applied only on this diagnostic branch.
replace_exact(
    "src/data/essays/yeseninDuncanMainArticleSplit.ts",
    "export const yeseninDuncanSplitApplied = false as const;",
    "export const yeseninDuncanSplitApplied = true as const;",
)
replace_exact(
    "scripts/validate-yesenin-duncan-first-meeting-unpublished.ts",
    "yeseninDuncanSplitApplied !== false",
    "yeseninDuncanSplitApplied !== true",
)
replace_exact(
    "scripts/validate-yesenin-duncan-first-meeting-unpublished.ts",
    "main-biography six-block budget changed or was applied prematurely",
    "main-biography six-block budget or applied split state changed",
)

# Remove order-dependent module execution and registry mutation.
replace_exact(
    "src/data/essays/yeseninPartOneEditorialPassEightEarlyB.ts",
    "import './yeseninPartOneEditorialPhysicalEditionsPassEight';\n\n",
    "",
)
replace_exact(
    "src/data/essays/yeseninPartOneEditorialPhysicalEditionsPassEight.ts",
    "const mutablePassSeven = yeseninPartOneEditorialPassSeven as unknown as Record<string, string>;\n"
    "Object.assign(mutablePassSeven, yeseninPartOneEditorialPhysicalEditionsPassEight);\n\n"
    "for (const [blockId, text] of Object.entries(yeseninPartOneEditorialPhysicalEditionsPassEight)) {\n"
    "  if (!(blockId in yeseninPartOneEditorialPassSeven)) {",
    "const passSevenBlockIds = new Set(Object.keys(yeseninPartOneEditorialPassSeven));\n\n"
    "for (const [blockId, text] of Object.entries(yeseninPartOneEditorialPhysicalEditionsPassEight)) {\n"
    "  if (!passSevenBlockIds.has(blockId)) {",
)

builder = "scripts/lib/yesenin-part-one-unpublished-article.ts"
replace_exact(
    builder,
    "import { yeseninPartOneEditorialPassEightEarlyB } from '../../src/data/essays/yeseninPartOneEditorialPassEightEarlyB';\n",
    "import { yeseninPartOneEditorialPassEightEarlyB } from '../../src/data/essays/yeseninPartOneEditorialPassEightEarlyB';\n"
    "import { yeseninPartOneEditorialPhysicalEditionsPassEight } from '../../src/data/essays/yeseninPartOneEditorialPhysicalEditionsPassEight';\n"
    "import { yeseninDuncanMainArticleSplit } from '../../src/data/essays/yeseninDuncanMainArticleSplit';\n",
)
replace_exact(
    builder,
    "  editorialPassSevenApplied: boolean;\n"
    "  editorialPassEightApplied: boolean;\n"
    "  publicationAuthorized: false;",
    "  editorialPassSevenApplied: boolean;\n"
    "  editorialPassEightApplied: boolean;\n"
    "  readerFacingInPartOne: boolean;\n"
    "  transferredToCompanionArticleId?: 'essay-yesenin-duncan-first-meeting-unpublished';\n"
    "  publicationAuthorized: false;",
)
replace_exact(
    builder,
    "  wholeArticleSentenceEditComplete: true;\n"
    "  essay: Essay;",
    "  wholeArticleSentenceEditComplete: true;\n"
    "  evidenceNodeCount: 146;\n"
    "  readerFacingTextBlocks: 140;\n"
    "  duncanCompactionApplied: true;\n"
    "  companionArticleId: 'essay-yesenin-duncan-first-meeting-unpublished';\n"
    "  companionTransferredBlockIds: readonly string[];\n"
    "  essay: Essay;",
)
replace_exact(
    builder,
    "const editorialPassSeven = {\n"
    "  ...yeseninPartOneEditorialPassSeven,\n"
    "  ...yeseninPartOneEditorialPassSevenPass6,\n"
    "} as const satisfies Readonly<Record<string, string>>;",
    "const editorialPassSeven = {\n"
    "  ...yeseninPartOneEditorialPassSeven,\n"
    "  ...yeseninPartOneEditorialPassSevenPass6,\n"
    "  ...yeseninPartOneEditorialPhysicalEditionsPassEight,\n"
    "} as const satisfies Readonly<Record<string, string>>;",
)
replace_exact(
    builder,
    "const editorialPassEight = {\n"
    "  ...yeseninPartOneEditorialPassEightEarlyA,\n"
    "  ...yeseninPartOneEditorialPassEightEarlyB,\n"
    "} as const satisfies Readonly<Record<string, string>>;\n",
    "const editorialPassEight = {\n"
    "  ...yeseninPartOneEditorialPassEightEarlyA,\n"
    "  ...yeseninPartOneEditorialPassEightEarlyB,\n"
    "} as const satisfies Readonly<Record<string, string>>;\n\n"
    "const companionTransferredBlockIds = yeseninDuncanMainArticleSplit\n"
    "  .filter((record) => record.destination === 'companion-investigation')\n"
    "  .map((record) => record.blockId);\n"
    "const companionTransferredBlockIdSet = new Set<string>(companionTransferredBlockIds);\n",
)
replace_exact(
    builder,
    "    const passSevenText = editorialPassSeven[node.blockId as keyof typeof editorialPassSeven];\n"
    "    const passEightText = editorialPassEight[node.blockId as keyof typeof editorialPassEight];\n"
    "    const renderText = passEightText ?? passSevenText ?? node.text;\n"
    "    renderTexts.push(renderText);\n\n"
    "    let authoredBlock: EssayBlock;\n"
    "    if (node.origin === 'editorial-override') {\n"
    "      authoredBlock = {\n"
    "        id: node.blockId,\n"
    "        type: 'note',\n"
    "        text: renderText,\n"
    "      };\n"
    "    } else if (node.sectionNumber === 0 && !leadRendered) {\n"
    "      leadRendered = true;\n"
    "      authoredBlock = {\n"
    "        id: node.blockId,\n"
    "        type: 'lead',\n"
    "        text: renderText,\n"
    "      };\n"
    "    } else {\n"
    "      authoredBlock = {\n"
    "        id: node.blockId,\n"
    "        type: 'paragraph',\n"
    "        text: renderText,\n"
    "      };\n"
    "    }\n\n"
    "    blocks.push(withRenderSources(authoredBlock, node.canonicalSourceIds));",
    "    const passSevenText = editorialPassSeven[node.blockId as keyof typeof editorialPassSeven];\n"
    "    const passEightText = editorialPassEight[node.blockId as keyof typeof editorialPassEight];\n"
    "    const renderText = passEightText ?? passSevenText ?? node.text;\n"
    "    const readerFacingInPartOne = !companionTransferredBlockIdSet.has(node.blockId);\n\n"
    "    if (readerFacingInPartOne) {\n"
    "      renderTexts.push(renderText);\n"
    "      let authoredBlock: EssayBlock;\n"
    "      if (node.origin === 'editorial-override') {\n"
    "        authoredBlock = {\n"
    "          id: node.blockId,\n"
    "          type: 'note',\n"
    "          text: renderText,\n"
    "        };\n"
    "      } else if (node.sectionNumber === 0 && !leadRendered) {\n"
    "        leadRendered = true;\n"
    "        authoredBlock = {\n"
    "          id: node.blockId,\n"
    "          type: 'lead',\n"
    "          text: renderText,\n"
    "        };\n"
    "      } else {\n"
    "        authoredBlock = {\n"
    "          id: node.blockId,\n"
    "          type: 'paragraph',\n"
    "          text: renderText,\n"
    "        };\n"
    "      }\n\n"
    "      blocks.push(withRenderSources(authoredBlock, node.canonicalSourceIds));\n"
    "    }",
)
replace_exact(
    builder,
    "        editorialPassSevenApplied: Boolean(passSevenText),\n"
    "        editorialPassEightApplied: Boolean(passEightText),\n"
    "        publicationAuthorized: false,",
    "        editorialPassSevenApplied: Boolean(passSevenText),\n"
    "        editorialPassEightApplied: Boolean(passEightText),\n"
    "        readerFacingInPartOne,\n"
    "        ...(readerFacingInPartOne\n"
    "          ? {}\n"
    "          : { transferredToCompanionArticleId: 'essay-yesenin-duncan-first-meeting-unpublished' as const }),\n"
    "        publicationAuthorized: false,",
)
replace_exact(
    builder,
    "    wholeArticleSentenceEditComplete: true,\n"
    "    essay,",
    "    wholeArticleSentenceEditComplete: true,\n"
    "    evidenceNodeCount: 146,\n"
    "    readerFacingTextBlocks: 140,\n"
    "    duncanCompactionApplied: true,\n"
    "    companionArticleId: 'essay-yesenin-duncan-first-meeting-unpublished',\n"
    "    companionTransferredBlockIds: [...companionTransferredBlockIds],\n"
    "    essay,",
)

validator = "scripts/validate-yesenin-part-one-unpublished-article.ts"
replace_exact(
    validator,
    "import { yeseninPartOneRealVisualsPassSix } from '../src/data/essays/yeseninPartOneRealVisualsPassSix';\n",
    "import { yeseninPartOneRealVisualsPassSix } from '../src/data/essays/yeseninPartOneRealVisualsPassSix';\n"
    "import { yeseninPartOneEditorialPhysicalEditionsPassEight } from '../src/data/essays/yeseninPartOneEditorialPhysicalEditionsPassEight';\n"
    "import { yeseninDuncanMainArticleSplit, yeseninDuncanSplitApplied } from '../src/data/essays/yeseninDuncanMainArticleSplit';\n",
)
replace_exact(
    validator,
    "const evidenceIds = new Set(evidenceEntries.map((entry) => entry.blockId));\n"
    "if (evidenceIds.size !== 146) fail('evidence map contains duplicate stable block IDs');\n"
    "for (const node of topology.nodes) {",
    "const evidenceIds = new Set(evidenceEntries.map((entry) => entry.blockId));\n"
    "if (evidenceIds.size !== 146) fail('evidence map contains duplicate stable block IDs');\n"
    "const companionTransferredBlockIds = yeseninDuncanMainArticleSplit\n"
    "  .filter((record) => record.destination === 'companion-investigation')\n"
    "  .map((record) => record.blockId);\n"
    "const companionTransferredIdSet = new Set<string>(companionTransferredBlockIds);\n"
    "if (yeseninDuncanSplitApplied !== true || companionTransferredIdSet.size !== 6) {\n"
    "  fail('Duncan companion split must be applied with exactly six transferred IDs');\n"
    "}\n"
    "if (\n"
    "  articlePackage.evidenceNodeCount !== 146 ||\n"
    "  articlePackage.readerFacingTextBlocks !== 140 ||\n"
    "  articlePackage.duncanCompactionApplied !== true ||\n"
    "  articlePackage.companionArticleId !== 'essay-yesenin-duncan-first-meeting-unpublished' ||\n"
    "  JSON.stringify([...articlePackage.companionTransferredBlockIds].sort()) !==\n"
    "    JSON.stringify([...companionTransferredBlockIds].sort())\n"
    ") {\n"
    "  fail('Duncan compaction package metadata is inconsistent');\n"
    "}\n"
    "for (const node of topology.nodes) {",
)
replace_exact(
    validator,
    "  if (evidence.publicationAuthorized !== false) {\n"
    "    fail(`${node.blockId} silently authorizes publication`);\n"
    "  }",
    "  if (evidence.publicationAuthorized !== false) {\n"
    "    fail(`${node.blockId} silently authorizes publication`);\n"
    "  }\n"
    "  const expectedReaderFacing = !companionTransferredIdSet.has(node.blockId);\n"
    "  if (evidence.readerFacingInPartOne !== expectedReaderFacing) {\n"
    "    fail(`${node.blockId} has an incorrect reader-facing disposition`);\n"
    "  }\n"
    "  if (\n"
    "    expectedReaderFacing\n"
    "      ? evidence.transferredToCompanionArticleId !== undefined\n"
    "      : evidence.transferredToCompanionArticleId !== 'essay-yesenin-duncan-first-meeting-unpublished'\n"
    "  ) {\n"
    "    fail(`${node.blockId} has an incorrect companion transfer link`);\n"
    "  }",
)
replace_exact(
    validator,
    "if (authoredBlocks.length !== 146) fail(`expected 146 authored render blocks, found ${authoredBlocks.length}`);\n"
    "if (essay.blocks.length !== 158) fail(`expected 158 total render blocks, found ${essay.blocks.length}`);",
    "if (authoredBlocks.length !== 140) fail(`expected 140 reader-facing render blocks, found ${authoredBlocks.length}`);\n"
    "if (essay.blocks.length !== 152) fail(`expected 152 total render blocks, found ${essay.blocks.length}`);",
)
replace_exact(
    validator,
    "if (new Set(authoredBlockIds).size !== 146) fail('authored render block IDs are not unique');\n"
    "const expectedOrder = topology.nodes.map((node) => node.blockId);",
    "if (new Set(authoredBlockIds).size !== 140) fail('reader-facing render block IDs are not unique');\n"
    "const expectedOrder = topology.nodes\n"
    "  .map((node) => node.blockId)\n"
    "  .filter((blockId) => !companionTransferredIdSet.has(blockId));",
)
replace_exact(
    validator,
    "const baseEditorialEntries = Object.entries(yeseninPartOneEditorialPassSeven);",
    "const baseEditorialEntries = Object.entries({\n"
    "  ...yeseninPartOneEditorialPassSeven,\n"
    "  ...yeseninPartOneEditorialPhysicalEditionsPassEight,\n"
    "});",
)
replace_exact(
    validator,
    "  if (renderedTextById.get(blockId) !== text) {\n"
    "    fail(`${blockId} does not render the reviewed pass-seven text`);\n"
    "  }",
    "  if (companionTransferredIdSet.has(blockId)) {\n"
    "    if (renderedTextById.has(blockId)) {\n"
    "      fail(`${blockId} should be preserved only in evidence and the companion article`);\n"
    "    }\n"
    "  } else if (renderedTextById.get(blockId) !== text) {\n"
    "    fail(`${blockId} does not render the reviewed pass-seven text`);\n"
    "  }",
)

print("Applied deterministic Yesenin Duncan compaction patches.")

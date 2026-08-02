import type { EssayBlock, EssayMythVerdict } from '../../types/essay';

type MythBlock = Extract<EssayBlock, { type: 'note'; variant: 'myth' }>;

export interface EssayMythRule {
  /** Stable text fragment in the documentary paragraph after which the card belongs. */
  afterTextIncludes: string;
  claim: string;
  verdict: EssayMythVerdict;
  origin: string;
  text: string;
  sourceIds: string[];
}

function toMythBlock(rule: EssayMythRule): MythBlock {
  return {
    type: 'note',
    variant: 'myth',
    claim: rule.claim,
    verdict: rule.verdict,
    origin: rule.origin,
    text: rule.text,
    sourceIds: rule.sourceIds,
  };
}

/**
 * Inserts verified myth cards after their documentary setup paragraphs.
 *
 * Rules are intentionally exact and idempotent. A missing anchor paragraph is
 * not silently repaired here: publication validators should catch the missing
 * required card when the surrounding article is substantively rewritten.
 */
export function applyEssayMythChecks(
  blocks: EssayBlock[],
  rules: EssayMythRule[],
): EssayBlock[] {
  const existingClaims = new Set(
    blocks
      .filter((block): block is MythBlock => block.type === 'note' && block.variant === 'myth')
      .map((block) => block.claim),
  );

  return blocks.flatMap<EssayBlock>((block) => {
    if (block.type !== 'paragraph') return [block];

    const matchedRules = rules.filter(
      (rule) =>
        block.text.includes(rule.afterTextIncludes) &&
        !existingClaims.has(rule.claim),
    );

    return matchedRules.length > 0
      ? [block, ...matchedRules.map(toMythBlock)]
      : [block];
  });
}

export const mayakovskyPartOneMythRules: EssayMythRule[] = [
  {
    afterTextIncludes: 'Осип вскоре издал «Облако в штанах»',
    claim: '«Облако в штанах» Маяковский написал для Лили Брик',
    verdict: 'partly-true',
    origin: 'популярные пересказы, которые соединяют посвящение «Тебе, Лиля» с историей создания всей поэмы',
    text: 'Работа над поэмой началась в первой половине **1914 года** и была закончена в июле 1915-го. С Лилей и Осипом Бриками Маяковский познакомился лишь в конце июля; в одну из первых встреч он читал уже законченное произведение. Лиля действительно стала адресатом посвящения отдельного издания, а Осип — издателем. Поэтому она вошла в историю публикации и последующего чтения поэмы, но не была первоначальной причиной её замысла и написания.',
    sourceIds: ['self-autobiography', 'early-chronicle-1915', 'cloud'],
  },
];

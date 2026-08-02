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

export const yeseninPartOneMythRules: EssayMythRule[] = [
  {
    afterTextIncludes: 'Полное название здесь существенно',
    claim: 'Есенин учился в Спас-Клепиковской церковно-учительской школе',
    verdict: 'false',
    origin: 'поздние автобиографии, популярные биографии и справочные пересказы, где два разных уровня духовно-учебной системы названы одним привычным выражением',
    text: 'Осенью 1909 года Есенин поступил во **второклассную учительскую школу духовного ведомства**. «Церковно-учительская школа» была другой, следующей ступенью этой образовательной системы. Академическая «Летопись» разводит наименования по документам, поэтому поздняя память — даже авторская — не должна заменять официальное название учреждения.',
    sourceIds: ['ye1-feb-chronicle-1909', 'ye1-feb-chronicle-1912'],
  },
];

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

export const mayakovskyPartTwoMythRules: EssayMythRule[] = [
  {
    afterTextIncludes: 'И выставка «20 лет работы» не пустовала',
    claim: 'На выставку «20 лет работы» никто не пришёл, и Маяковский увидел совершенно пустой зал',
    verdict: 'partly-true',
    origin: 'поздние драматические пересказы последних месяцев поэта, в которых отсутствие поддержки литературных организаций превращается в полное отсутствие публики',
    text: 'Хроника открытия 1 февраля 1930 года сообщает о представителях заводов, учащихся и рабочих; небольшой зал был **переполнен молодёжью**. При этом литературные организации действительно не пришли поздравить автора. Позднее сам Маяковский говорил, что выставка посещалась плохо, и связывал это также с недостаточной рекламой. Поэтому здесь нельзя выбирать между двумя удобными крайностями: открытие не было пустым, но профессиональная изоляция и слабая последующая посещаемость были реальны.',
    sourceIds: ['chronicle-1930', 'red-presnya-speech', 'museum-invited-list'],
  },
  {
    afterTextIncludes: 'Перелом произошёл в 1935 году',
    claim: 'Сталин объявил Маяковского главным советским поэтом сразу после его смерти',
    verdict: 'false',
    origin: 'сжатые рассказы о посмертной канонизации, которые соединяют смерть 1930 года и сталинскую резолюцию в одно событие',
    text: 'Маяковский умер в апреле **1930 года**. Знаменитая сталинская формула появилась только в конце **1935 года**, после обращения Лили Брик с жалобой на плохое издание и сохранение наследия. Между смертью и резолюцией прошло более пяти лет. Массовые похороны были немедленным общественным событием, но официальный государственный культ оформился позднее; смешивать эти этапы значит стирать реальную историю посмертной репутации.',
    sourceIds: ['museum-stalin-brik-1935', 'rgali-brik-stalin-letter-1935'],
  },
];

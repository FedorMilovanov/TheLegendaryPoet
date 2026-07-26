import type { Essay, EssayBlock } from '../../types/essay';
import { yeseninDuncanFirstMeeting as editorialDraft } from './yeseninDuncanFirstMeeting';

const mistakenPredestinationClause = 'а его трагический финал — предрешён';
const correctedOpenHorizonClause = 'а его трагический финал ещё не был предрешён';

const blocks: EssayBlock[] = editorialDraft.blocks.map((block) => {
  if (!('text' in block) || !block.text.includes(mistakenPredestinationClause)) return block;
  return {
    ...block,
    text: block.text.replace(mistakenPredestinationClause, correctedOpenHorizonClause),
  } as EssayBlock;
});

export const yeseninDuncanFirstMeetingPublished: Essay = {
  ...editorialDraft,
  blocks,
};

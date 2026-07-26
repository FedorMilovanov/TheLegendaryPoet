import type { Essay, EssaySource } from '../../types/essay';
import { yeseninPartOnePublic } from './yeseninPartOnePublic';

const sources: EssaySource[] = (yeseninPartOnePublic.sources ?? []).map((source) =>
  source.kind === 'institutional'
    ? {
        ...source,
        kind: 'context',
      }
    : source,
);

export const yeseninPartOnePublished: Essay = {
  ...yeseninPartOnePublic,
  sources,
};

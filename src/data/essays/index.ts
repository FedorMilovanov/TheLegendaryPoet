import { Essay } from '../../types/essay';
import { yeseninKutezhi } from './yeseninKutezhi';
import { mayakovskyGromovoy } from './mayakovskyGromovoy';
import { brikCase } from './brikCase';
import { applyEditorialReview } from './editorialReview';
import { applySourceDeepening } from './sourceDeepening';
import { applySourceVerificationRound2 } from './sourceVerificationRound2';

export const essays: Essay[] = [yeseninKutezhi, mayakovskyGromovoy, brikCase]
  .map(applyEditorialReview)
  .map(applySourceDeepening)
  .map(applySourceVerificationRound2);

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((e) => e.slug === slug);
}

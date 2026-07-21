import { Essay } from '../../types/essay';
import { yeseninKutezhi } from './yeseninKutezhi';
import { mayakovskyGromovoy } from './mayakovskyGromovoy';
import { brikCase } from './brikCase';
import { applyEditorialReview } from './editorialReview';
import { applySourceDeepening } from './sourceDeepening';
import { applySourceVerificationRound2 } from './sourceVerificationRound2';
import { applySourceVerificationRound3 } from './sourceVerificationRound3';
import { applySourceVerificationRound4 } from './sourceVerificationRound4';
import { applySourceVerificationRound5 } from './sourceVerificationRound5';
import { applySourceVerificationRound6 } from './sourceVerificationRound6';

export const essays: Essay[] = [yeseninKutezhi, mayakovskyGromovoy, brikCase]
  .map(applyEditorialReview)
  .map(applySourceDeepening)
  .map(applySourceVerificationRound2)
  .map(applySourceVerificationRound3)
  .map(applySourceVerificationRound4)
  .map(applySourceVerificationRound5)
  .map(applySourceVerificationRound6);

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((e) => e.slug === slug);
}

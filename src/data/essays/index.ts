import type { Essay } from '../../types/essay';
import { yeseninKutezhi } from './yeseninKutezhi';
import { mayakovskyGromovoy } from './mayakovskyGromovoy';
import { brikCase } from './brikCase';

export const essays: Essay[] = [yeseninKutezhi, mayakovskyGromovoy, brikCase];

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((essay) => essay.slug === slug);
}

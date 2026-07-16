import { Essay } from '../../types/essay';
import { yeseninKutezhi } from './yeseninKutezhi';
import { mayakovskyGromovoy } from './mayakovskyGromovoy';

export const essays: Essay[] = [yeseninKutezhi, mayakovskyGromovoy];

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((e) => e.slug === slug);
}

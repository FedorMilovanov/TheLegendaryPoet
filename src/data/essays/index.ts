import { Essay } from '../../types/essay';
import { yeseninKutezhi } from './yeseninKutezhi';

export const essays: Essay[] = [yeseninKutezhi];

export function getAllEssays(): Essay[] {
  return essays;
}

export function getEssayBySlug(slug: string): Essay | undefined {
  return essays.find((e) => e.slug === slug);
}

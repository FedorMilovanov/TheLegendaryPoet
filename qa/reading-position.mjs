import { expect } from '@playwright/test';

// Check a point inside a specific passage, not merely that the long article is
// somewhere in view or that a fixed chip still says the name of its chapter.
export async function readAt(block, fraction = 0.42) {
  await block.evaluate((n, part) => {
    const r = n.getBoundingClientRect();
    scrollBy({ top: r.top + r.height * part - innerHeight * 0.34, behavior: 'instant' });
  }, fraction);
  await expectReadingAt(block, fraction);
}
export const portion = block => block.evaluate(n => {
  const r = n.getBoundingClientRect();
  return (innerHeight * 0.34 - r.top) / r.height;
});
export async function expectReadingAt(block, part) {
  await expect.poll(() => block.evaluate((n, fraction) => {
    const r = n.getBoundingClientRect();
    return Math.abs(r.top + r.height * fraction - innerHeight * 0.34);
  }, part), { message: 'same point in the same reading block, within two CSS pixels' }).toBeLessThan(2);
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const reveal = read('src/components/Reveal.tsx');
const home = read('src/pages/HomePage.tsx');
const safariSpec = read('qa/mobile-webkit-isolated.spec.mjs');
const helpers = read('qa/mobile-webkit-isolated.helpers.mjs');
const packageJson = read('package.json');

assert.match(reveal, /export function useReliableInView/);
assert.match(reveal, /new IntersectionObserver/);
assert.match(reveal, /element\.getBoundingClientRect\(\)/);
assert.match(reveal, /window\.visualViewport/);
assert.match(reveal, /intersectionWidth \* intersectionHeight/);
assert.match(reveal, /intersectionRatio >= boundedThreshold/);
assert.match(reveal, /window\.requestAnimationFrame\(checkGeometry\)/);
assert.match(reveal, /new ResizeObserver\(scheduleGeometryCheck\)/);
assert.match(reveal, /window\.addEventListener\('scroll', scheduleGeometryCheck/);
assert.match(reveal, /document\.addEventListener\('scroll', scheduleGeometryCheck, \{ capture: true, passive: true \}\)/);
assert.match(reveal, /window\.addEventListener\('pageshow', scheduleGeometryCheck\)/);
assert.match(reveal, /document\.addEventListener\('visibilitychange', scheduleGeometryCheck\)/);
assert.match(reveal, /window\.visualViewport\?\.addEventListener\('scroll', scheduleGeometryCheck/);
assert.match(reveal, /window\.visualViewport\?\.addEventListener\('resize', scheduleGeometryCheck/);
assert.match(reveal, /BOOTSTRAP_CHECK_DELAYS_MS = \[0, 80, 240, 600, 1_200, 2_200\]/);
assert.match(reveal, /window\.setTimeout\(scheduleGeometryCheck, delay\)/);
assert.match(reveal, /window\.clearTimeout\(timer\)/);
assert.match(reveal, /document\.removeEventListener\('scroll', scheduleGeometryCheck, true\)/);
assert.match(reveal, /observer\.disconnect\(\)/);
assert.match(reveal, /resizeObserver\?\.disconnect\(\)/);
assert.doesNotMatch(reveal, /setInterval|classList\.(?:add|remove)|style\.opacity\s*=|setAttribute\(['"]style/);

assert.match(home, /import Reveal, \{ useReliableInView \} from '\.\.\/components\/Reveal'/);
assert.doesNotMatch(home, /\buseInView\b/);
assert.match(home, /useReliableInView<HTMLDivElement>\(\{ once: true, threshold: 0\.1 \}\)/);
assert.match(home, /<Reveal[\s\S]*key=\{stat\.label\}[\s\S]*distance=\{20\}[\s\S]*blur=\{false\}/);
assert.doesNotMatch(home, /whileInView=/);

assert.match(safariSpec, /expect\(visual\.effectiveOpacity[\s\S]*toBeGreaterThan\(0\.9\)/);
assert.match(safariSpec, /expect\(visual\.blurPx[\s\S]*toBeLessThanOrEqual\(0\.05\)/);
assert.match(helpers, /document\.scrollingElement/);
assert.doesNotMatch(helpers, /classList\.(?:add|remove)|style\.opacity\s*=/);
assert.match(packageJson, /"validate:reliable-reveal": "tsx scripts\/validate-reliable-reveal\.ts"/);
assert.match(packageJson, /validate:brand-v20 && npm run validate:reliable-reveal && npm run validate:brand-browser-workflow/);

console.log('reliable reveal validation: IntersectionObserver is backed by real viewport geometry, document/window/visualViewport signals, bounded hydration checks, strict opacity evidence and no forced visual-state mutation');

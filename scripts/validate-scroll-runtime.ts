import { readFileSync } from 'node:fs';

const failures: string[] = [];
const assertContract = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

type CapturedScroll = ScrollToOptions & { top?: number };
const nativeScrolls: CapturedScroll[] = [];
let reduceMotion = false;
const anchor = {
  getBoundingClientRect: () => ({ top: 250 }),
} as unknown as HTMLElement;

const testWindow = {
  scrollY: 400,
  matchMedia: () => ({ matches: reduceMotion }),
  scrollTo: (options: CapturedScroll) => nativeScrolls.push(options),
};
const testDocument = {
  getElementById: (id: string) => (id === 'target' ? anchor : null),
};

Object.defineProperty(globalThis, 'window', { configurable: true, value: testWindow });
Object.defineProperty(globalThis, 'document', { configurable: true, value: testDocument });

const smoothScroll = await import('../src/utils/smoothScroll');

smoothScroll.scrollToId('missing');
assertContract(nativeScrolls.length === 0, 'missing anchors must not trigger native scrolling');

smoothScroll.scrollToId('target');
assertContract(nativeScrolls.length === 1, 'anchor navigation must issue one native scroll operation');
assertContract(nativeScrolls[0]?.top === 554, 'anchor navigation must subtract the fixed 96px header offset');
assertContract(nativeScrolls[0]?.behavior === 'smooth', 'anchor navigation should remain smooth by default');

reduceMotion = true;
smoothScroll.scrollToId('target');
assertContract(nativeScrolls[1]?.top === 554, 'reduced-motion navigation must preserve the same anchor geometry');
assertContract(nativeScrolls[1]?.behavior === 'auto', 'reduced motion must disable animated anchor scrolling');

const releaseFirst = smoothScroll.pauseSmoothScroll('first-overlay');
const releaseSecond = smoothScroll.pauseSmoothScroll('second-overlay');
assertContract(smoothScroll.isSmoothScrollPaused(), 'nested overlays must register a paused state');
releaseFirst(400);
assertContract(smoothScroll.isSmoothScrollPaused(), 'closing one overlay must not release another overlay token');
releaseSecond(400);
assertContract(!smoothScroll.isSmoothScrollPaused(), 'closing the final overlay must clear the paused state');
releaseSecond(400);
assertContract(!smoothScroll.isSmoothScrollPaused(), 'overlay release functions must remain idempotent');

const coordinatorSource = readFileSync(new URL('../src/components/SmoothScroll.tsx', import.meta.url), 'utf8');
const poetryBackdropSource = readFileSync(new URL('../src/components/PoetryBackdrop.tsx', import.meta.url), 'utf8');
const scrollTopSource = readFileSync(new URL('../src/components/ScrollToTop.tsx', import.meta.url), 'utf8');

assertContract(!coordinatorSource.includes("import('lenis')"), 'the document scroll coordinator must not load a global JavaScript scroller');
assertContract(!coordinatorSource.includes('smoothWheel'), 'ordinary wheel movement must remain browser-native');
assertContract(!coordinatorSource.includes('.raf('), 'document scrolling must not depend on a perpetual JavaScript animation loop');
assertContract(!coordinatorSource.includes("addEventListener('wheel'"), 'the app shell must not intercept wheel input');
assertContract(!coordinatorSource.includes('preventDefault()'), 'the app shell must not cancel native document scrolling');
assertContract(coordinatorSource.includes("window.addEventListener('tlp-scroll-top'"), 'the native scroll coordinator must retain the scroll-to-top command');
assertContract(!poetryBackdropSource.includes('useScroll'), 'decorative poetry must not subscribe to scroll frames');
assertContract(!poetryBackdropSource.includes('useTransform'), 'decorative poetry must not derive motion values from document scrolling');
assertContract(!scrollTopSource.includes('useMotionValueEvent'), 'scroll-top visibility must not create a Framer document-scroll subscription');
assertContract(scrollTopSource.includes("addEventListener('scroll', onScroll, { passive: true })"), 'scroll-top visibility must use one passive native listener');

if (failures.length > 0) {
  throw new Error(`Scroll runtime validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.log('Scroll runtime validation passed: native wheel continuity, anchor geometry, reduced motion, nested overlays and lightweight chrome observers are enforced.');

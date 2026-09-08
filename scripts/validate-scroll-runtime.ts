import { readFileSync } from 'node:fs';
import { inspectSource } from './lib/source-contract-ast';

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
const smoothScrollSource = readFileSync(new URL('../src/utils/smoothScroll.ts', import.meta.url), 'utf8');
const poetryBackdropSource = readFileSync(new URL('../src/components/PoetryBackdrop.tsx', import.meta.url), 'utf8');
const scrollTopSource = readFileSync(new URL('../src/components/ScrollToTop.tsx', import.meta.url), 'utf8');
const readingProgressSource = readFileSync(new URL('../src/components/articles/ReadingProgress.tsx', import.meta.url), 'utf8');
const essayPageSource = readFileSync(new URL('../src/pages/EssayPage.tsx', import.meta.url), 'utf8');

const coordinatorAst = inspectSource(coordinatorSource, 'SmoothScroll.tsx');
const scrollTopAst = inspectSource(scrollTopSource, 'ScrollToTop.tsx');
const readingProgressAst = inspectSource(readingProgressSource, 'ReadingProgress.tsx');

assertContract(!coordinatorAst.hasModuleImport('lenis'), 'the document scroll coordinator must not load a global JavaScript scroller');
assertContract(!coordinatorSource.includes('smoothWheel'), 'ordinary wheel movement must remain browser-native');
assertContract(!coordinatorAst.hasMethodCall('raf'), 'document scrolling must not depend on a perpetual JavaScript animation loop');
assertContract(!coordinatorAst.hasEventListener('wheel'), 'the app shell must not intercept wheel input');
assertContract(!coordinatorAst.hasMethodCall('preventDefault'), 'the app shell must not cancel native document scrolling');
assertContract(coordinatorAst.hasEventListener('tlp-scroll-top'), 'the native scroll coordinator must retain the scroll-to-top command');
assertContract(coordinatorSource.includes('new MutationObserver'), 'delayed hash targets must use DOM readiness observation instead of short fixed polling');
assertContract(coordinatorSource.includes('HASH_OBSERVER_TIMEOUT_MS = 15_000'), 'hash observation must have a bounded 15-second lifetime for slow lazy routes');
const observerRegistration = "observer.observe(document.body ?? document.documentElement, { childList: true, subtree: true })";
const observerIndex = coordinatorSource.indexOf(observerRegistration);
const postRegistrationLookupIndex = coordinatorSource.indexOf('if (findAndScrollToHash()) {', observerIndex + observerRegistration.length);
const observerTimeoutIndex = coordinatorSource.indexOf('window.setTimeout(stopHashObserver, HASH_OBSERVER_TIMEOUT_MS)', observerIndex + observerRegistration.length);
assertContract(observerIndex >= 0, 'hash observation must watch bounded DOM insertions for the requested anchor');
assertContract(
  postRegistrationLookupIndex > observerIndex && observerTimeoutIndex > postRegistrationLookupIndex,
  'hash restoration must re-check synchronously after observer registration to close the lookup/observe race before arming timeout cleanup',
);
assertContract(coordinatorSource.includes('observer?.disconnect()'), 'hash observation must disconnect deterministically');
assertContract(observerTimeoutIndex >= 0, 'hash observation must retain a bounded timeout cleanup');
assertContract(!coordinatorSource.includes('HASH_RETRY_LIMIT'), 'fixed-count hash retry windows must remain removed');
assertContract(!coordinatorSource.includes('setTimeout(restore, 60)'), 'hash restoration must not regress to repeated polling');
assertContract(!smoothScrollSource.includes('setActiveLenis'), 'the native scroll utility must not retain a legacy Lenis registration API');
assertContract(!poetryBackdropSource.includes('useScroll'), 'decorative poetry must not subscribe to scroll frames');
assertContract(!poetryBackdropSource.includes('useTransform'), 'decorative poetry must not derive motion values from document scrolling');
assertContract(!scrollTopSource.includes('useMotionValueEvent'), 'scroll-top visibility must not create a Framer document-scroll subscription');
assertContract(scrollTopAst.hasEventListener('scroll', { options: { passive: true } }), 'scroll-top visibility must use a passive native listener');

// Reading progress is one article-bounded authority. The explicit EssayPage ref
// owns its semantic start/end; post-article community/footer geometry must never
// re-enter through document/root scroll height or a second CSS scroll timeline.
assertContract(essayPageSource.includes('<ReadingProgress articleRef={articleRef} />'), 'EssayPage must pass its explicit semantic article ref to ReadingProgress');
assertContract(readingProgressSource.includes('articleRef.current'), 'reading progress must resolve geometry from the explicit article ref');
assertContract(readingProgressSource.includes('article.getBoundingClientRect()'), 'reading progress must derive its boundaries from article geometry');
assertContract(readingProgressSource.includes('articleBottom - viewportHeight'), 'reading progress must complete when the article bottom reaches the viewport bottom');
assertContract(!readingProgressSource.includes('document.documentElement.scrollHeight'), 'reading progress must not use document height as its denominator');
assertContract(!readingProgressSource.includes('supportsScrollTimeline'), 'reading progress must not split authority between JS geometry and a root CSS timeline');
assertContract(!readingProgressSource.includes('reading-progress-fill'), 'reading progress must not reactivate the legacy root scroll-timeline class');
assertContract(readingProgressSource.includes('new ResizeObserver(scheduleUpdate)'), 'article height changes must schedule the same progress calculation through ResizeObserver');
assertContract(readingProgressSource.includes('resizeObserver?.disconnect()'), 'reading progress must disconnect its ResizeObserver on unmount');
assertContract(readingProgressAst.hasEventListener('scroll', { options: { passive: true } }), 'reading progress must use a passive native scroll observer');
assertContract(readingProgressAst.hasEventListener('resize', { options: { passive: true } }), 'reading progress must use a passive resize observer');
assertContract(readingProgressAst.hasMethodCall('requestAnimationFrame'), 'reading progress must coalesce geometry updates through requestAnimationFrame');
assertContract(readingProgressAst.hasMethodCall('cancelAnimationFrame'), 'reading progress must cancel its pending frame when unmounted');
assertContract(!readingProgressAst.hasEventListener('scroll', { handlerName: 'update' }), 'reading progress must not set React state directly on every scroll event');
assertContract(readingProgressSource.includes('role="progressbar"'), 'reading progress must expose its semantic progress role');
assertContract(readingProgressSource.includes('aria-valuenow={semanticProgress}'), 'reading progress must expose the same computed value to assistive technology and browser QA');

// Mutation-style harness checks: equivalent syntax must pass, forbidden behavior must not.
const passiveFixture = inspectSource(`
  const EVENT = 'scroll';
  const passive = true;
  const listenerOptions = { passive };
  window['addEventListener'](EVENT, onScroll, listenerOptions);
`);
assertContract(
  passiveFixture.hasEventListener('scroll', { options: { passive: true } }),
  'semantic listener inspection must accept equivalent passive-option syntax',
);

const nonPassiveFixture = inspectSource(`
  const listenerOptions = { passive: false };
  window.addEventListener('scroll', onScroll, listenerOptions);
`);
assertContract(
  !nonPassiveFixture.hasEventListener('scroll', { options: { passive: true } }),
  'semantic listener inspection must reject a non-passive scroll observer',
);

const unsafeSpreadFixture = inspectSource(`
  const unsafeOptions = { passive: false };
  const listenerOptions = { passive: true, ...unsafeOptions };
  window.addEventListener('scroll', onScroll, listenerOptions);
`);
assertContract(
  !unsafeSpreadFixture.hasEventListener('scroll', { options: { passive: true } }),
  'semantic listener inspection must honor a later spread that overrides passive to false',
);

const safeSpreadFixture = inspectSource(`
  const unsafeOptions = { passive: false };
  const listenerOptions = { ...unsafeOptions, passive: true };
  window.addEventListener('scroll', onScroll, listenerOptions);
`);
assertContract(
  safeSpreadFixture.hasEventListener('scroll', { options: { passive: true } }),
  'semantic listener inspection must honor a later explicit passive true override',
);

const lexicalScopeFixture = inspectSource(`
  function attachObserver() {
    const passive = true;
    const listenerOptions = { passive };
    window.addEventListener('scroll', onScroll, listenerOptions);
  }
  function unrelatedScope() {
    const passive = false;
    void passive;
  }
`);
assertContract(
  lexicalScopeFixture.hasEventListener('scroll', { options: { passive: true } }),
  'semantic listener inspection must resolve shorthand options from the nearest lexical scope',
);

const wheelFixture = inspectSource(`
  const EVENT = 'wheel';
  window.addEventListener(EVENT, onWheel);
  function onWheel(event: WheelEvent) { event['preventDefault'](); }
`);
assertContract(wheelFixture.hasEventListener('wheel'), 'semantic listener inspection must detect wheel interception through an event-name binding');
assertContract(wheelFixture.hasMethodCall('preventDefault'), 'semantic call inspection must detect alternate preventDefault syntax');

const scrollerFixture = inspectSource(`
  const SCROLLER_MODULE = 'lenis';
  async function boot() { await import(SCROLLER_MODULE); }
`);
assertContract(scrollerFixture.hasModuleImport('lenis'), 'semantic import inspection must detect a global scroller loaded through a const module binding');

if (failures.length > 0) {
  throw new Error(`Scroll runtime validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.log('Scroll runtime validation passed: native wheel continuity, bounded race-safe delayed-anchor observation, anchor geometry, reduced motion, nested overlays and article-bounded semantic RAF/passive-observer progress contracts are enforced.');

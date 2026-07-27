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
assertContract(nativeScrolls.length === 1, 'native anchor navigation must issue one scroll operation');
assertContract(nativeScrolls[0]?.top === 554, 'native anchor navigation must subtract the fixed 96px header offset');
assertContract(nativeScrolls[0]?.behavior === 'smooth', 'native anchor navigation should remain smooth by default');

reduceMotion = true;
smoothScroll.scrollToId('target');
assertContract(nativeScrolls[1]?.top === 554, 'reduced-motion native navigation must preserve the same anchor geometry');
assertContract(nativeScrolls[1]?.behavior === 'auto', 'reduced motion must disable animated native scrolling');

const enhancedScrolls: Array<{ target: unknown; options: { offset?: number; duration?: number } }> = [];
const testLenis = {
  scrollTo: (target: unknown, options: { offset?: number; duration?: number }) => {
    enhancedScrolls.push({ target, options });
  },
  stop: () => undefined,
  start: () => undefined,
} as never;
smoothScroll.setActiveLenis(testLenis);
smoothScroll.scrollToId('target');
assertContract(enhancedScrolls.length === 1, 'Lenis anchor navigation must remain active when the enhancement exists');
assertContract(enhancedScrolls[0]?.target === anchor, 'Lenis must receive the concrete anchor element');
assertContract(enhancedScrolls[0]?.options.offset === -96, 'Lenis and native scrolling must share the fixed header offset');
assertContract(enhancedScrolls[0]?.options.duration === 0, 'reduced motion must disable Lenis anchor animation');
smoothScroll.setActiveLenis(null);

if (failures.length > 0) {
  throw new Error(`Scroll runtime validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.log('Scroll runtime validation passed: native and Lenis anchors preserve header geometry and reduced-motion behavior.');

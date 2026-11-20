import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getEventListeners } from 'node:events';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the real provider, route request, history, bookmark and two-frame focus handoff.
// Model address-bar navigation separately from committing the destination DOM.
const files = ['components/SmoothScroll.tsx', ...['pendingRouteScroll', 'sharedPassage', 'passageStamp', 'browserNavigation', 'scrollHistory', 'readingBookmark', 'smoothScroll', 'focusRuntime'].map(s => `utils/${s}.ts`)];
const compiled = new Map(files.map(path => [path.split('/').pop().split('.')[0], ts.transpileModule(
  readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } },
).outputText]));
const first = { key: 'first', pathname: '/essay', hash: '', search: '' };
const other = { ...first, key: 'second', pathname: '/music' };
const fragment = { ...first, key: 'chapter', hash: '#target' };

function coordinator() {
  const effects = [], frames = new Map(), timers = new Map(), calls = [], events = [];
  let index, state, context, serial = 0, location = first, navigation = 'POP';
  let overlay = null, depth = 0, activeObserver, claimArrival;
  const browser = Object.assign(new EventTarget(), { currentEntry: { key: first.key } });
  const window = Object.assign(new EventTarget(), {
    navigation: browser, location: new URL('https://example.test/essay'), history: { scrollRestoration: 'auto' }, scrollY: 0, scrollX: 0, innerHeight: 650,
    requestAnimationFrame(fn) { frames.set(++serial, fn); return serial; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn, ms) { timers.set(++serial, { fn, ms }); return serial; },
    clearTimeout(id) { timers.delete(id); }, matchMedia: () => ({ matches: true }),
    scrollTo(options, topArg) {
      const top = typeof options === 'number' ? topArg : options.top;
      calls.push(top); this.scrollY = top;
    },
  });
  window.addEventListener('tlp-reveal-chrome', e => events.push(e.type));
  // Node EventTarget has no DOM propagation. Deliver browser input at the
  // capture listener with the original target, including focus-only changes.
  function input(type, props = {}, target = window, trusted = true) {
    const event = Object.assign(new Event(type, { cancelable: true }), props);
    Object.defineProperties(event, { isTrusted: { value: trusted }, target: { value: target } });
    window.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false, 'the coordinator cannot consume native input');
  }
  class Element extends EventTarget {
    constructor(id) { super(); this.id = id; this.isConnected = true; this.attrs = new Map(); }
    getBoundingClientRect() { return { top: 300 - window.scrollY, height: 40 }; }
    matches() { return false; }
    hasAttribute(name) { return this.attrs.has(name); }
    getAttribute(name) { return this.attrs.get(name); }
    setAttribute(name, value) { this.attrs.set(name, value); }
    removeAttribute(name) { this.attrs.delete(name); }
    focus() {
      if (!this.isConnected || this === document.activeElement) return;
      document.activeElement.dispatchEvent(new Event('blur'));
      document.activeElement = this;
      input('focusin', {}, this);
    }
  }
  const body = new Element(''), main = new Element('main-content'), target = new Element('target'), field = new Element('draft');
  const document = Object.assign(new EventTarget(), {
    body, activeElement: body, getElementById: id => [main, target].find(el => el.id === id) ?? null,
    querySelector: () => null, querySelectorAll: () => [],
  });
  function effect(fn, deps) {
    const previous = effects[index];
    if (!previous || deps.some((v, i) => !Object.is(v, previous.deps[i]))) {
      previous?.cleanup?.(); effects[index] = { fn, deps, pending: true };
    }
    ++index;
  }
  const react = {
    createContext: () => ({ Provider: 'history' }), useContext: () => context,
    useState: init => [state ??= init()], useLayoutEffect: effect, useEffect: effect,
  };
  const modules = new Map(Object.entries({
    react, 'react-router': { useHref: l => l.pathname + l.search + l.hash, useLocation: () => location, useNavigationType: () => navigation },
    'react/jsx-runtime': { jsx: (_, props) => { context = props.value; return props.children; } },
    overlayRuntime: {
      captureUnlockedPosition: () => overlay ?? { x: 0, y: window.scrollY },
      registerOverlayArrival(fn) { claimArrival = fn; return () => { claimArrival = undefined; }; },
      hasOpenOverlay: () => !!overlay, OVERLAY_SCROLL_RESTORED: 'unlocked',
    },
  }));
  function load(name) {
    if (modules.has(name)) return modules.get(name);
    const exports = {};
    vm.runInNewContext(compiled.get(name), {
      exports, require: spec => load(spec.startsWith('.') ? spec.split('/').pop() : spec),
      document, window, Event, URL, AbortController, Element, HTMLElement: Element, getComputedStyle: () => ({ scrollMarginTop: '112px' }), Node: { DOCUMENT_POSITION_FOLLOWING: 4 },
      requestAnimationFrame: window.requestAnimationFrame, cancelAnimationFrame: window.cancelAnimationFrame,
      MutationObserver: class {
        constructor(fn) { this.notify = fn; }
        observe() { activeObserver = this; document.onObserve?.(); }
        disconnect() { if (activeObserver === this) activeObserver = undefined; }
      },
    });
    modules.set(name, exports); return exports;
  }
  const shell = load('SmoothScroll');
  function address(next) {
    browser.currentEntry = { key: next.key };
    window.location.href = `https://example.test${next.pathname}${next.search}${next.hash}`;
  }
  function render(next = first, action = 'POP', paintedPath = next.pathname) {
    location = next; navigation = action; address(next);
    index = 0; shell.default({ children: null }); shell.useRestoreRouteScroll(paintedPath);
    for (const e of effects) if (e.pending) { e.pending = false; e.cleanup = e.fn(); }
  }
  return {
    window, document, target, field, calls, events, timers, address, render, load, input,
    holdLayout() {
      document.querySelectorAll = selector => selector === '[data-reader-layout-pending]' ? [{ compareDocumentPosition: () => 4 }] : [];
      return () => { document.querySelectorAll = () => []; activeObserver?.notify(); };
    },
    repeatFragment() {
      const link = Object.assign(new Element(''), { hash: '#target', closest() { return this; } });
      const click = Object.assign(new Event('click'), { button: 0 });
      Object.defineProperty(click, 'target', { value: link });
      document.dispatchEvent(click);
    },
    get readerListeners() { return ['wheel', 'keydown', 'pointerdown', 'focusin'].flatMap(type => getEventListeners(window, type)).length; },
    get observer() { return activeObserver; },
    depart: (path = '/next') => browser.dispatchEvent(Object.assign(new Event('navigate'), { destination: { url: new URL(path, window.location).href } })),
    frame() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); },
    lock() {
      const painted = claimArrival();
      if (depth++ > 0) return;
      overlay = painted ? load('readingBookmark').capturePagePosition() : { x: 0, y: window.scrollY };
      window.scrollY = 0;
    },
    unlock() {
      if (--depth > 0) return;
      window.scrollY = overlay.y; overlay = null; window.dispatchEvent(new Event('unlocked'));
    },
    get observing() { return !!activeObserver; },
  };
}

test('late initial POP restoration must not erase the first reader scroll', () => {
  const app = coordinator(); app.render();
  app.window.scrollTo({ top: 957 }); app.frame();
  assert.equal(app.window.history.scrollRestoration, 'manual');
  assert.deepEqual(app.calls, [957]); assert.equal(app.readerListeners, 0);
});

test('PUSH resets on the settled route; POP uses departure, not the new short DOM or the fixed body', () => {
  const app = coordinator(); app.render(); app.frame();
  app.window.scrollY = 18000; app.lock(); app.depart();
  app.render(other, 'PUSH', first.pathname); app.frame();
  assert.deepEqual(app.calls, []);
  app.render(other, 'PUSH'); app.frame(); // still locked
  assert.deepEqual(app.calls, []);
  app.input('keydown', { key: 'ArrowDown' }); // the overlay, not the underlying page
  app.unlock(); app.window.scrollY = 4500; app.frame();
  assert.deepEqual(app.calls, [0]);
  app.window.scrollY = 610; app.depart(); app.render(first, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 18000);
  app.depart(); app.render(other, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 610);
});

test('initial hash scrolls with header clearance and transfers focus only after the target paints', () => {
  const app = coordinator(); app.render(fragment); app.frame();
  assert.deepEqual(app.calls, [204]); app.frame();
  assert.equal(app.document.activeElement, app.document.body); app.frame();
  assert.equal(app.document.activeElement, app.target); assert.equal(app.readerListeners, 0);
});

test('same-path hash reveals chrome; Forward to the old hash restores later reading instead of jumping again', () => {
  const app = coordinator(); app.render(); app.frame(); app.window.scrollY = 80;
  app.depart(); app.render(fragment, 'PUSH'); app.frame();
  assert.deepEqual(app.events, ['tlp-reveal-chrome', 'tlp-reveal-chrome']);
  app.window.scrollY = 980; app.depart(); app.render(first); app.frame();
  app.depart(); app.render(fragment); app.frame();
  assert.deepEqual(app.calls, [204, 80, 980]);
});

test('query-only PUSH/POP do not scroll or reveal chrome over the focused filter', () => {
  const app = coordinator(); app.render(); app.frame(); app.window.scrollY = 435;
  app.depart(); app.render({ ...first, key: 'filter', search: '?q=text' }, 'PUSH'); app.frame();
  app.depart(); app.render(first); app.frame();
  assert.deepEqual(app.calls, []); assert.equal(app.events.length, 1);
});

test('Back to the still-painted entry resumes without a render, same-URL native replace does not', () => {
  const app = coordinator(); app.render(); app.frame();
  app.window.scrollY = 840; app.depart('/music');
  // The browser has moved but Router never committed the suspended route.
  app.window.scrollY = 400; app.window.dispatchEvent(new Event('popstate')); app.frame();
  assert.deepEqual(app.calls, [840]);
  app.depart('/essay'); app.window.dispatchEvent(new Event('popstate')); app.frame();
  assert.deepEqual(app.calls, [840]);
});

test('Forward after canceling an unpainted PUSH owns its own landmark even if its layout effect is replayed', () => {
  const app = coordinator(); app.render(); app.frame();
  app.window.scrollY = 840; app.depart('/music');
  app.window.dispatchEvent(new Event('popstate')); app.frame(); app.frame(); app.frame();
  assert.equal(app.window.scrollY, 840);
  app.document.body.focus(); app.depart('/music'); app.render(other, 'POP');
  // Hide/reveal the same destination before its first frame, as Suspense can.
  app.render(other, 'POP', first.pathname); app.render(other, 'POP'); app.frame();
  assert.deepEqual(app.calls, [840, 0]); assert.equal(app.document.activeElement.id, 'main-content');
});

test('target inserted in the lookup/observe gap resolves without another mutation or a timer', () => {
  const app = coordinator(), get = app.document.getElementById;
  app.document.getElementById = () => null;
  app.document.onObserve = () => { app.document.getElementById = get; };
  app.render(fragment); app.frame();
  assert.deepEqual(app.calls, [204]); assert.equal(app.observing, false); assert.equal(app.timers.size, 0);
});

test('a slow partial layout has a bounded fallback; a stale/malformed fragment cancels on departure', () => {
  const app = coordinator(); app.document.querySelectorAll = s => s === '[data-reader-layout-pending]' ? [{ compareDocumentPosition: () => 4 }] : [];
  app.render(fragment); app.frame();
  assert.deepEqual(app.calls, []); assert.ok(app.observing);
  const [timer] = app.timers.values(); assert.equal(timer.ms, 15000); timer.fn();
  assert.deepEqual(app.calls, [204]); assert.equal(app.observing, false);
  app.document.querySelectorAll = () => [];
  app.depart(); app.render({ ...first, key: 'missing', hash: '#%E0%A4%A' }, 'PUSH'); app.frame();
  assert.ok(app.observing); app.depart(); app.render(other, 'PUSH'); app.frame();
  assert.equal(app.observing, false); assert.equal(app.timers.size, 0); assert.deepEqual(app.calls, [204, 0]);
});

test('hover, resize, native placement, zoom and a modifier alone leave the pending jump intact', () => {
  const app = coordinator(), release = app.holdLayout();
  app.render(fragment); app.frame();
  app.input('wheel', { deltaY: 90 }, app.window, false); // DOM-dispatched event, not input
  app.input('wheel', { deltaY: 90, ctrlKey: true }); app.input('wheel', { deltaY: 0, deltaX: 0 });
  app.input('pointermove'); app.input('resize'); app.input('keydown', { key: 'Shift' });
  app.window.scrollY = 70; app.input('scroll'); app.input('focusin', {}, app.target);
  assert.ok(app.observing); assert.deepEqual(app.calls, []);
  release(); app.frame(); app.frame();
  assert.deepEqual(app.calls, [204]); assert.equal(app.document.activeElement, app.target);
  assert.equal(app.readerListeners, 0); assert.equal(app.timers.size, 0);
});

test('reader input retires the observer, timeout and unlock work; POP then uses the actual departure', () => {
  const app = coordinator(), release = app.holdLayout();
  app.render(fragment); app.frame();
  const staleMutation = app.observer.notify, staleTimeout = [...app.timers.values()][0].fn;
  app.input('wheel', { deltaY: 490 }); app.window.scrollY = 490;
  assert.equal(app.observing, false); assert.equal(app.timers.size, 0); assert.equal(app.readerListeners, 0);
  release(); staleTimeout(); staleMutation(); app.window.dispatchEvent(new Event('unlocked')); app.frame();
  assert.deepEqual(app.calls, []);
  app.depart('/music'); app.render(other, 'PUSH'); app.frame();
  app.depart('/essay#target'); app.render(fragment); app.frame(); app.frame(); app.frame();
  assert.deepEqual(app.calls, [0, 490]); assert.notEqual(app.document.activeElement, app.target);
});

test('focus chosen before the first placement frame wins over both the main landmark and late fragment', () => {
  const app = coordinator(), release = app.holdLayout();
  app.render(other); app.frame(); app.depart('/essay#target'); app.render(fragment, 'PUSH');
  app.field.focus(); app.frame(); release(); app.frame(); app.frame();
  assert.deepEqual(app.calls, []); assert.equal(app.document.activeElement, app.field); assert.equal(app.readerListeners, 0);
});

test('an explicit repeat starts a fresh request even before the canceled fragment finishes loading', () => {
  const app = coordinator(), release = app.holdLayout();
  app.render(fragment); app.frame(); app.input('keydown', { key: 'Tab' }); app.field.focus();
  app.repeatFragment(); app.frame();
  assert.ok(app.observing); assert.equal(app.document.activeElement, app.field);
  release(); app.frame(); app.frame();
  assert.deepEqual(app.calls, [204]); assert.equal(app.document.activeElement, app.target); assert.equal(app.readerListeners, 0);
});

test('after scrolling, pointer input, a new focus owner or stale geometry can still cancel the second focus frame', () => {
  for (const interrupt of [app => app.input('pointerdown'), app => app.field.focus(), app => { app.target.isConnected = false; },
    app => { app.window.location.hash = '#new'; }, app => app.lock()]) {
    const app = coordinator(); app.render(fragment); app.frame(); app.frame();
    assert.deepEqual(app.calls, [204]); assert.notEqual(app.document.activeElement, app.target);
    interrupt(app); app.frame(); app.frame();
    assert.notEqual(app.document.activeElement, app.target); assert.equal(app.readerListeners, 0);
    assert.equal(app.target.hasAttribute('tabindex'), false, 'a stale handoff cannot even prepare the destination');
  }
});

test('a modal opened at an unpainted address owns that arrival but never borrows an outgoing passage', () => {
  const app = coordinator(); app.render(other); app.window.scrollY = 610;
  app.depart('/essay#target'); app.address(fragment);
  app.document.querySelectorAll = selector => {
    assert.notEqual(selector, '[data-reading-flow]', 'the old outlet is not a passage on the arriving entry');
    return [];
  };
  app.lock(); app.field.focus(); app.render(fragment, 'PUSH'); app.frame();
  app.unlock(); app.frame(); app.frame();
  assert.equal(app.document.activeElement, app.field); assert.equal(app.window.scrollY, 610);
  assert.deepEqual(app.calls, []); assert.equal(app.readerListeners, 0);
  // A different entry with the identical URL is not the claimed visit.
  app.render({ ...fragment, key: 'distinct' }, 'PUSH'); app.frame(); app.frame(); app.frame();
  assert.equal(app.window.scrollY, 204); assert.equal(app.document.activeElement, app.target);
});

test('a new search during a departing viewer’s exit takes over without recapturing the fixed body', () => {
  for (const alreadyPainted of [false, true]) {
    const app = coordinator(); app.render(other); app.window.scrollY = 811; app.lock();
    app.depart('/essay#target'); app.address(fragment);
    if (alreadyPainted) { app.render(fragment, 'PUSH'); app.frame(); }
    app.lock(); app.field.focus(); app.unlock(); // viewer detached; search still owns the page
    if (!alreadyPainted) app.render(fragment, 'PUSH');
    app.frame(); app.unlock(); app.frame(); app.frame(); app.frame();
    assert.deepEqual(app.calls, []); assert.equal(app.window.scrollY, 811);
    assert.equal(app.document.activeElement, app.field);
  }
});

test('explicit same-URL REPLACE supersedes a cold modal claim, even if the native entry key stays the same', () => {
  const app = coordinator(); app.render(other); app.depart('/essay#target'); app.address(fragment);
  app.lock(); app.field.focus(); app.depart('/essay#target'); app.render(fragment, 'REPLACE'); app.frame();
  assert.deepEqual(app.calls, []); // the selecting dialog must still unlock first
  app.unlock(); app.frame(); app.frame(); app.frame();
  assert.deepEqual(app.calls, [204]); assert.equal(app.document.activeElement, app.target);
});

test('Back under a second dialog resumes after unlock; Forward to the never-painted poem is a fresh arrival', () => {
  const app = coordinator(); app.render(other); app.window.scrollY = 610;
  app.depart('/essay#target'); app.address(fragment); app.lock(); app.field.focus();
  app.depart('/music'); app.address(other); app.window.dispatchEvent(new Event('popstate')); app.frame();
  assert.deepEqual(app.calls, []);
  app.document.body.focus(); app.unlock(); app.frame(); app.frame(); app.frame();
  assert.deepEqual(app.calls, [610]); assert.equal(app.document.activeElement.id, 'main-content');
  app.depart('/essay#target'); app.render(fragment); app.frame(); app.frame(); app.frame();
  assert.deepEqual(app.calls, [610, 204]); assert.equal(app.document.activeElement, app.target);
});

test('a failed entry cannot supply a bookmark to a now-readable chapter at the same URL', () => {
  const history = new (coordinator().load('scrollHistory').ScrollHistory)();
  const visit = { id: 'first', url: '/essay#chapter', applied: true, unavailable: true };
  history.current = visit; history.remember(() => ({ x: 0, y: 151 }), true);
  assert.equal(history.position(visit).y, 151);
  assert.equal(history.position({ ...visit, unavailable: false }), undefined);
});

test('history keeps at most 80 departures and never serves a replacement URL the old position', () => {
  const history = new (coordinator().load('scrollHistory').ScrollHistory)();
  const visit = n => ({ id: String(n), url: '/essay', applied: true });
  for (let n = 0; n <= 80; ++n) { history.current = visit(n); history.remember(() => ({ x: 1, y: n }), true); }
  assert.equal(history.position(visit(0)), undefined);
  assert.equal(history.position(visit(1)).y, 1);
  assert.equal(history.position(visit(80)).y, 80);
  assert.equal(history.position({ ...visit(80), url: '/replaced' }), undefined);
});

test('mixed fragments use only the ordinary anchor; a text-only or stale quote does not claim a native scroll', () => {
  const app = coordinator(), decode = app.load('smoothScroll').decodeHash;
  assert.equal(decode('#x%3A~%3Ay:~:text=%zz'), 'x:~:y');
  assert.equal(decode('#%bad:~:text=word'), '%bad');
  app.render({ ...fragment, hash: '#target:~:text=some%20words' }); app.frame(); app.frame(); app.frame();
  assert.equal(app.window.scrollY, 204); assert.equal(app.document.activeElement, app.target);
  for (const hash of ['#:~:text=words', '#read.essay.3.nohit.0.1', '#read.invalid[selector]']) {
    const fresh = coordinator(); fresh.window.scrollY = 411; fresh.render({ ...first, hash });
    fresh.frame(); fresh.frame(); fresh.frame(); assert.equal(fresh.window.scrollY, 411);
    assert.equal(fresh.observing, false); assert.equal(fresh.readerListeners, 0);
  }
});

test('font settlement without a DOM mutation places the final glyph; a reader choice still cancels it', () => {
  for (const interrupt of [false, true]) {
    const app = coordinator();
    const fonts = app.document.fonts = Object.assign(new EventTarget(), { status: 'loading' });
    app.render(fragment); app.frame();
    assert.deepEqual(app.calls, []);
    if (interrupt) app.input('keydown', { key: 'Tab' });
    app.target.getBoundingClientRect = () => ({ top: 480 - app.window.scrollY, height: 48 });
    fonts.status = 'loaded'; fonts.dispatchEvent(new Event('loadingdone'));
    app.frame(); app.frame();
    assert.deepEqual(app.calls, interrupt ? [] : [384]);
    assert.equal(app.document.activeElement === app.target, !interrupt);
    assert.equal(getEventListeners(fonts, 'loadingdone').length, 0);
  }
});

test('the popstate of a newly pushed native fragment cannot overwrite its pre-jump bookmark', () => {
  const app = coordinator(); app.window.navigation = undefined;
  const history = new (app.load('scrollHistory').ScrollHistory)();
  const visit = history.current = { id: 'first', url: app.window.location.href, applied: true };
  app.window.history.state = { tlpScrollEntry: 'first' }; app.window.scrollY = 840;
  const stop = app.load('scrollHistory').observeDepartures(history, () => ({ x: 0, y: app.window.scrollY }));
  app.load('browserNavigation').noteAppDeparture(); // TOC activation, before assigning location.hash
  app.window.location.hash = '#target'; app.window.history.state = null;
  app.window.scrollY = 2400; // UA placed the target *before* notifying listeners
  app.window.dispatchEvent(new Event('popstate'));
  assert.equal(history.position(visit).y, 840);
  stop();
});

test('Back can expose the retained URL before the Navigation API updates its current entry', () => {
  const app = coordinator(); app.render(); app.frame();
  app.window.scrollY = 840; app.depart('/music'); app.address(other);
  app.window.scrollY = 0; app.window.location.pathname = '/essay';
  app.window.dispatchEvent(new Event('popstate')); app.frame();
  assert.deepEqual(app.calls, []);
  app.address(first); app.window.navigation.dispatchEvent(new Event('currententrychange')); app.frame();
  assert.deepEqual(app.calls, [840]);
});

test('a stamped native traversal keeps the last settled outgoing passage only if the UA already placed the arriving anchor', () => {
  for (const jumped of [false, true]) {
    const app = coordinator(); app.window.navigation = undefined;
    const history = new (app.load('scrollHistory').ScrollHistory)();
    app.window.location.hash = '#previous';
    const visit = history.current = { id: 'first', url: app.window.location.href, applied: true };
    app.window.history.state = { tlpScrollEntry: 'first' }; app.window.scrollY = 840;
    const stop = app.load('scrollHistory').observeDepartures(history, () => ({ x: 0, y: app.window.scrollY }));
    app.document.dispatchEvent(new Event('scrollend'));
    app.window.location.hash = '#target'; app.window.history.state = { tlpScrollEntry: 'other' };
    app.window.scrollY = jumped ? 204 : 861; // only 204 puts #target at the reading edge
    app.window.dispatchEvent(new Event('popstate'));
    assert.equal(history.position(visit).y, jumped ? 840 : 861);
    stop(); assert.equal(getEventListeners(app.document, 'scrollend').length, 0);
  }
});

test('a native quote keeps its placed line when the engine scrolls the focused block afterwards', () => {
  const app = coordinator(); let applied = 0, yielded = 0;
  app.load('pendingRouteScroll').requestRouteScroll({ current: () => true, fragmentId: 'read.essay.8.abc.0.1',
    nativeQuote: true, apply() { applied++; app.window.scrollTo({ top: 204 }); return app.target; }, yieldToReader() { yielded++; } });
  app.frame(); app.frame(); app.frame();
  assert.equal(applied, 1); assert.equal(yielded, 0);
  app.window.scrollTo({ top: 222 }); // the engine re-scrolls the block it just focused
  app.document.dispatchEvent(new Event('scrollend'));
  assert.deepEqual(app.calls, [204, 222, 204]); assert.equal(applied, 2); assert.equal(yielded, 0);
  assert.equal(getEventListeners(app.document, 'scrollend').length, 0);
});

test('a takeover keeps the reader position when the engine finishes its text match later', () => {
  const app = coordinator(); let applied = 0, yielded = 0;
  app.load('pendingRouteScroll').requestRouteScroll({ current: () => true, fragmentId: 'read.poem-blok-1.5.1.0.0',
    nativeQuote: true, apply() { applied++; app.window.scrollTo({ top: 204 }); return app.target; }, yieldToReader() { yielded++; } });
  app.frame(); app.frame(); app.frame();
  app.input('keydown', { key: 'Tab' }); app.target.focus(); // keyboard skips to its own control
  assert.equal(yielded, 1); assert.equal(app.window.scrollY, 204);
  app.window.scrollTo({ top: 1056 }); // UA centres its delayed native text match
  app.document.dispatchEvent(new Event('scrollend'));
  assert.equal(app.window.scrollY, 204); assert.equal(applied, 1);
  assert.equal(getEventListeners(app.document, 'scrollend').length, 0);
});

test('the reader position is restored only while that control stays readable; reader scroll wins', () => {
  const app = coordinator(); let yielded = 0;
  app.load('pendingRouteScroll').requestRouteScroll({ current: () => true, fragmentId: 'read.essay.9.abc.0.1',
    nativeQuote: true, apply() { app.window.scrollTo({ top: 204 }); return app.target; }, yieldToReader() { yielded++; } });
  app.frame(); app.frame(); app.frame();
  app.input('keydown', { key: 'Tab' });
  app.input('wheel', { deltaY: 120 }); app.window.scrollTo({ top: 320 });
  app.document.dispatchEvent(new Event('scrollend'));
  assert.equal(app.window.scrollY, 320); assert.equal(yielded, 1);

  const focus = coordinator();
  focus.load('pendingRouteScroll').requestRouteScroll({ current: () => true, fragmentId: 'read.essay.10.abc.0.1',
    nativeQuote: true, apply() { focus.window.scrollTo({ top: 204 }); return focus.target; }, yieldToReader() { yielded++; } });
  focus.frame(); focus.frame(); focus.frame();
  // The control the browser focused lives below the placed line: its own
  // scroll into view is not the app's to undo.
  focus.target.getBoundingClientRect = () => ({ top: 900 - focus.window.scrollY, height: 40 });
  focus.window.scrollTo({ top: 1290 }); focus.document.dispatchEvent(new Event('scrollend'));
  assert.equal(focus.window.scrollY, 1290);
});

test('a late native text match gets one correction; keyboard takeover can stop a maintained native scroll, never replay the jump', () => {
  for (const takeOver of [false, true]) {
    const app = coordinator(); let applied = 0, yielded = 0, native = false;
    app.document.querySelector = s => s === ':target' && native ? app.target : null;
    app.load('pendingRouteScroll').requestRouteScroll({ current: () => true, fragmentId: 'read.essay.8.abc.0.1',
      nativeQuote: true, apply() { applied++; app.window.scrollTo({ top: 204 }); return app.target; }, yieldToReader() { yielded++; } });
    app.frame(); app.frame(); app.frame(); assert.equal(app.document.activeElement, app.target);
    native = true; app.window.scrollY = 290; // UA centred the range after focusing its paragraph
    if (takeOver) app.input('keydown', {key: 'Tab'});
    app.document.dispatchEvent(new Event('scrollend')); app.document.dispatchEvent(new Event('scrollend'));
    assert.equal(applied, takeOver ? 1 : 2); assert.equal(yielded, takeOver ? 1 : 0);
    assert.deepEqual(app.calls, takeOver ? [204, 290] : [204, 204]);
    assert.equal(getEventListeners(app.document, 'scrollend').length, 0); assert.equal(app.readerListeners, 0);
  }
});

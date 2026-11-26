import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/components/SmoothScroll.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;

// Execute the actual coordinator, retaining hook refs/effect cleanup and an
// explicitly delayed animation frame. No browser timing or source-string check.
function coordinator() {
  const refs = [], effects = [], frames = new Map(), calls = [], events = [], listeners = new Map();
  let anchorDocumentY = 300, anchorAvailable = true, activeObserver = null;
  let maxY = Infinity, paused = false;
  let focusRequests = 0, focusCancels = 0;
  let refIndex = 0, effectIndex = 0, nextFrame = 0, nextTimer = 0;
  const timers = new Map();
  let location = { key: 'first', pathname: '/essay', hash: '' }, navigation = 'POP';
  const window = {
    history: { scrollRestoration: 'auto' }, scrollY: 0,
    matchMedia: () => ({ matches: true }),
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    emit(type, detail) { for (const callback of listeners.get(type) ?? []) callback({ type, detail, ...detail }); },
    setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    dispatchEvent(event) { events.push(event.type); this.emit(event.type); return true; },
    scrollTo(options) { calls.push(options.top); this.scrollY = Math.min(options.top, maxY); this.emit('scroll'); },
  };
  const document = {
    documentElement: { classList: { remove() {} } },
    getElementById: (id) => id === 'target' && anchorAvailable ? { isConnected: true, getBoundingClientRect: () => ({ top: anchorDocumentY - window.scrollY }) } : null,
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, window, document,
    Event: class { constructor(type) { this.type = type; } },
    MutationObserver: class { constructor(callback) { this.callback = callback; } observe() { activeObserver = this; } disconnect() { if (activeObserver === this) activeObserver = null; } },
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
    require: (name) => {
      if (name === 'react') return {
        useRef(value) { return refs[refIndex++] ??= { current: value }; },
        useEffect: registerEffect,
        useLayoutEffect: registerEffect,
      };
      if (name.endsWith('/smoothScroll')) return { isSmoothScrollPaused: () => paused };
      if (name === 'react-router') return { useLocation: () => location, useNavigationType: () => navigation };
      if (name === 'react/jsx-runtime') return { Fragment: 'fragment', jsx: (_type, props) => props.children };
      if (name.endsWith('/focusRuntime')) return { scheduleProgrammaticFocus: () => { focusRequests++; return () => { focusCancels++; }; } };
      throw new Error(`Unexpected coordinator import: ${name}`);
    },
  });
  function registerEffect(callback, deps) {
          const index = effectIndex++, previous = effects[index];
          if (previous && deps.every((dep, i) => Object.is(dep, previous.deps[i]))) return;
          previous?.cleanup?.();
          effects[index] = { callback, deps, pending: true };
  }
  return {
    window, calls, events, setMaxY(value) { maxY = value; }, setPaused(value) { paused = value; }, setAnchorDocumentY(value) { anchorDocumentY = value; },
    setAnchorAvailable(value) { anchorAvailable = value; }, mutate() { activeObserver?.callback(); },
    focusStats() { return { focusRequests, focusCancels }; }, hasObserver() { return Boolean(activeObserver); },
    render(nextLocation = location, nextNavigation = navigation) {
      location = nextLocation; navigation = nextNavigation; refIndex = effectIndex = 0;
      exports.default({ children: null });
      for (const effect of effects) if (effect.pending) {
        effect.pending = false; effect.cleanup = effect.callback();
      }
    },
    frame() { const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback(); },
    expireTimers() { const pending = [...timers.values()]; timers.clear(); for (const callback of pending) callback(); },
  };
}

test('late initial POP restoration must not erase the first reader scroll', () => {
  const app = coordinator();
  app.render();
  app.window.scrollTo({ top: 957 });
  app.frame();
  assert.equal(app.window.scrollY, 957);
  assert.deepEqual(app.calls, [957]);
});

test('later PUSH resets and POP restores the saved position', () => {
  const app = coordinator();
  app.render(); app.frame();
  app.window.scrollTo({ top: 957 });
  app.render({ key: 'second', pathname: '/poets', hash: '' }, 'PUSH'); app.frame();
  assert.equal(app.window.scrollY, 0);
  app.window.scrollTo({ top: 400 });
  app.render({ key: 'first', pathname: '/essay', hash: '' }, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 957);
});

test('initial hash still scrolls to its target with header clearance', () => {
  const app = coordinator();
  app.render({ key: 'first', pathname: '/essay', hash: '#target' }, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 204);
});

test('same-path hash transition requests the universal chrome reveal event', () => {
  const app = coordinator();
  app.render(); app.frame();
  app.render({ key: 'poem', pathname: '/essay', hash: '#target' }, 'PUSH');
  app.frame();
  assert.equal(app.events.at(-1), 'tlp-reveal-chrome');
});

test('late full-corpus hydration corrects a hash without overriding reader scroll', () => {
  const app = coordinator();
  app.render({ key: 'poet', pathname: '/poets/sergei-yesenin', hash: '#target' }, 'POP');
  app.frame();
  assert.equal(app.window.scrollY, 204);
  // Full JSON inserts content above the existing fallback anchor. The
  // browser may scroll automatically to preserve visual position. That must
  // not count as a user gesture (the old scrollY-delta guard failed here).
  app.setAnchorDocumentY(364);
  app.window.scrollTo({ top: 244 });
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'sergei-yesenin' });
  app.frame();
  assert.equal(app.window.scrollY, 268);
  // A different route must not re-anchor this page.
  app.setAnchorDocumentY(400);
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'alexander-pushkin' });
  app.frame();
  assert.equal(app.window.scrollY, 268);
  // The reader takes ownership of scrolling only on actual user input.
  app.window.emit('wheel');
  app.window.scrollTo({ top: 320 });
  app.setAnchorDocumentY(440);
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'sergei-yesenin' });
  app.frame();
  assert.equal(app.window.scrollY, 320);
});

test('touch input blocks post-hydration auto-scroll correction', () => {
  const app = coordinator();
  app.render({ key: 'touch-poet', pathname: '/poets/sergei-yesenin', hash: '#target' }, 'POP');
  app.frame();
  assert.equal(app.window.scrollY, 204);
  app.window.emit('touchstart');
  app.setAnchorDocumentY(500);
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'sergei-yesenin' });
  app.frame();
  assert.equal(app.window.scrollY, 204);
});

test('reader pointer gesture before first hash frame cancels pending placement and focus', () => {
  const app = coordinator();
  app.render({ key: 'gesture', pathname: '/poets/a', hash: '#target' }, 'POP');
  app.window.emit('pointerdown'); app.frame();
  assert.deepEqual(app.calls, []);
  assert.deepEqual(app.focusStats(), { focusRequests: 0, focusCancels: 0 });
});
test('Tab after hash placement cancels the queued focus and yields layout ownership', () => {
  const app = coordinator();
  app.render({ key: 'gesture', pathname: '/poets/a', hash: '#target' }, 'POP'); app.frame();
  assert.equal(app.focusStats().focusRequests, 1);
  app.window.emit('keydown', { key: 'Tab' });
  assert.equal(app.focusStats().focusCancels, 1);
  app.setAnchorDocumentY(500);
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'a' }); app.frame();
  assert.deepEqual(app.calls, [204]);
});
test('a reader wheel before lazy target arrives retires the observer and pending focus', () => {
  const app = coordinator();
  app.setAnchorAvailable(false);
  app.render({ key: 'late', pathname: '/poets/a', hash: '#target' }, 'POP'); app.frame();
  assert.equal(app.hasObserver(), true);
  app.window.emit('wheel');
  assert.equal(app.hasObserver(), false);
  app.setAnchorAvailable(true); app.mutate(); app.frame();
  assert.deepEqual(app.calls, []);
  assert.equal(app.focusStats().focusRequests, 0);
});

test('departing entry survives scroll clamping before effect cleanup', () => {
  const app = coordinator();
  app.render(); app.frame(); app.window.scrollTo({ top: 957 });
  // New shorter outlet committed before old passive cleanup; no old-page scroll event.
  app.window.scrollY = 80;
  app.render({ key: 'short', pathname: '/poets', hash: '' }, 'PUSH'); app.frame();
  app.render({ key: 'first', pathname: '/essay', hash: '' }, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 957);
});
test('visited hash entry restores later reading position instead of original anchor', () => {
  const app = coordinator();
  app.render({ key: 'hash', pathname: '/essay', hash: '#target' }, 'POP'); app.frame();
  app.window.emit('wheel'); app.window.scrollTo({ top: 957 });
  app.render({ key: 'other', pathname: '/poets', hash: '' }, 'PUSH'); app.frame();
  app.render({ key: 'hash', pathname: '/essay', hash: '#target' }, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 957);
  assert.equal(app.focusStats().focusRequests, 1);
});
test('same route history entries retain independent reading offsets', () => {
  const app = coordinator();
  app.render(); app.frame(); app.window.scrollTo({ top: 500 });
  app.render({ key: 'same', pathname: '/essay', hash: '' }, 'PUSH'); app.frame();
  app.window.scrollTo({ top: 900 });
  app.render({ key: 'first', pathname: '/essay', hash: '' }, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 500);
});
test('short loading outlet retries saved position on actual content mutation', () => {
  const app = coordinator();
  app.render(); app.frame(); app.window.scrollTo({ top: 957 });
  app.render({ key: 'other', pathname: '/poets', hash: '' }, 'PUSH'); app.frame();
  app.setMaxY(100);
  app.render({ key: 'first', pathname: '/essay', hash: '' }, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 100);
  assert.equal(app.hasObserver(), true);
  app.setMaxY(1500); app.mutate(); app.frame();
  assert.equal(app.window.scrollY, 957);
  assert.equal(app.hasObserver(), false);
});
test('reader input cancels deferred history restoration', () => {
  const app = coordinator();
  app.render(); app.frame(); app.window.scrollTo({ top: 957 });
  app.render({ key: 'other', pathname: '/poets', hash: '' }, 'PUSH'); app.frame();
  app.setMaxY(100);
  app.render({ key: 'first', pathname: '/essay', hash: '' }, 'POP'); app.frame();
  app.window.emit('wheel'); app.setMaxY(1500); app.window.scrollTo({ top: 75 });
  app.mutate(); app.frame();
  assert.equal(app.window.scrollY, 75);
});
test('fixed-body overlay scroll cannot replace saved reading offset', () => {
  const app = coordinator();
  app.render(); app.frame(); app.window.scrollTo({ top: 957 });
  app.setPaused(true); app.window.scrollTo({ top: 0 });
  app.render({ key: 'other', pathname: '/poets', hash: '' }, 'PUSH'); app.frame();
  app.setPaused(false);
  app.render({ key: 'first', pathname: '/essay', hash: '' }, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 957);
});

test('completed history restore cannot be replayed by a later corpus event', () => {
  const app = coordinator();
  const poet = { key: 'poet', pathname: '/poets/sergei-yesenin/', hash: '' };
  app.render(poet, 'POP'); app.frame(); app.window.scrollTo({ top: 957 });
  app.render({ key: 'other', pathname: '/essays', hash: '' }, 'PUSH'); app.frame();
  app.render(poet, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 957);
  app.window.scrollTo({ top: 1200 });
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'sergei-yesenin' }); app.frame();
  assert.equal(app.window.scrollY, 1200);
});
test('expired history restore cannot be replayed by a late corpus event', () => {
  const app = coordinator();
  const poet = { key: 'poet', pathname: '/poets/sergei-yesenin/', hash: '' };
  app.render(poet, 'POP'); app.frame(); app.window.scrollTo({ top: 957 });
  app.render({ key: 'other', pathname: '/essays', hash: '' }, 'PUSH'); app.frame();
  app.setMaxY(100); app.render(poet, 'POP'); app.frame();
  app.expireTimers(); app.setMaxY(1500);
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'sergei-yesenin' }); app.frame();
  assert.equal(app.window.scrollY, 100);
  assert.equal(app.hasObserver(), false);
});

test('pending POP restoration resumes on final overlay release without any DOM mutation', () => {
  const app = coordinator();
  app.render(); app.frame(); app.window.scrollTo({ top: 957 });
  app.render({ key: 'other', pathname: '/poets', hash: '' }, 'PUSH'); app.frame();
  app.setPaused(true);
  app.render({ key: 'first', pathname: '/essay', hash: '' }, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 0);
  assert.equal(app.hasObserver(), true);
  // A nested modal's user gesture is not a gesture in the covered reader.
  app.window.emit('pointerdown');
  app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.equal(app.window.scrollY, 0);
  app.setPaused(false);
  app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.equal(app.window.scrollY, 957);
  assert.equal(app.hasObserver(), false);
  app.window.scrollTo({ top: 1200 });
  app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.equal(app.window.scrollY, 1200);
});

test('expired POP cannot be restored by a late overlay release', () => {
  const app = coordinator();
  app.render(); app.frame(); app.window.scrollTo({ top: 957 });
  app.render({ key: 'other', pathname: '/poets', hash: '' }, 'PUSH'); app.frame();
  app.setPaused(true);
  app.render({ key: 'first', pathname: '/essay', hash: '' }, 'POP'); app.frame();
  app.expireTimers();
  app.setPaused(false);
  app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.equal(app.window.scrollY, 0);
  assert.equal(app.hasObserver(), false);
});

test('only the last nested pause owner emits a resume event; release is idempotent', () => {
  const pauseSource = readFileSync(new URL('../../src/utils/smoothScroll.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(pauseSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {}, events = [];
  vm.runInNewContext(code, {
    exports, Event: class { constructor(type) { this.type = type; } },
    window: { dispatchEvent(event) { events.push(event.type); } },
  });
  const releaseA = exports.pauseSmoothScroll('a');
  const releaseB = exports.pauseSmoothScroll('b');
  assert.equal(exports.isSmoothScrollPaused(), true);
  releaseA(); releaseA();
  assert.deepEqual(events, []);
  releaseB(); releaseB();
  assert.equal(exports.isSmoothScrollPaused(), false);
  assert.deepEqual(events, ['tlp-scroll-resumed']);
});


test('ordinary anchor defers behind a modal and resumes only on final release', () => {
  const app = coordinator();
  app.setPaused(true);
  app.render({ key: 'hash', pathname: '/essay', hash: '#target' }, 'POP'); app.frame();
  assert.deepEqual(app.calls, []);
  assert.equal(app.focusStats().focusRequests, 0);
  app.window.emit('pointerdown'); app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.deepEqual(app.calls, []);
  app.setPaused(false); app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.equal(app.window.scrollY, 204);
  assert.equal(app.focusStats().focusRequests, 1);
  assert.equal(app.hasObserver(), false);
  app.window.scrollTo({ top: 500 }); app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.equal(app.window.scrollY, 500);
});
test('anchor layout correction waits for modal release instead of moving a locked reader', () => {
  const app = coordinator();
  app.render({ key: 'poet', pathname: '/poets/a', hash: '#target' }, 'POP'); app.frame();
  app.setPaused(true); app.setAnchorDocumentY(500);
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'a' }); app.frame();
  assert.deepEqual(app.calls, [204]);
  app.setPaused(false); app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.equal(app.window.scrollY, 404);
});
test('expired locked anchor cannot move the reader after late release', () => {
  const app = coordinator(); app.setPaused(true);
  app.render({ key: 'hash', pathname: '/essay', hash: '#target' }, 'POP'); app.frame();
  app.expireTimers(); app.setPaused(false); app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.deepEqual(app.calls, []);
  assert.equal(app.hasObserver(), false);
});


test('already placed anchor expires even without ResizeObserver', () => {
  const app = coordinator();
  app.render({ key: 'poet', pathname: '/poets/a', hash: '#target' }, 'POP'); app.frame();
  assert.equal(app.window.scrollY, 204);
  app.expireTimers();
  app.window.scrollTo({ top: 700 }); app.setAnchorDocumentY(500);
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'a' }); app.frame();
  assert.equal(app.window.scrollY, 700);
});
test('deferred layout correction cannot outlive deadline without ResizeObserver', () => {
  const app = coordinator();
  app.render({ key: 'poet', pathname: '/poets/a', hash: '#target' }, 'POP'); app.frame();
  app.setPaused(true); app.setAnchorDocumentY(500);
  app.window.emit('tlp-poet-corpus-hydrated', { poetId: 'a' }); app.frame();
  assert.equal(app.window.scrollY, 204);
  app.expireTimers(); app.setPaused(false);
  app.window.emit('tlp-scroll-resumed'); app.frame();
  assert.equal(app.window.scrollY, 204);
});

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
  let focusRequests = 0, focusCancels = 0;
  let refIndex = 0, effectIndex = 0, nextFrame = 0;
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
    setTimeout() { return 1; }, clearTimeout() {},
    dispatchEvent(event) { events.push(event.type); return true; },
    scrollTo(options) { calls.push(options.top); this.scrollY = options.top; },
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
        useEffect(callback, deps) {
          const index = effectIndex++, previous = effects[index];
          if (previous && deps.every((dep, i) => Object.is(dep, previous.deps[i]))) return;
          previous?.cleanup?.();
          effects[index] = { callback, deps, pending: true };
        },
      };
      if (name === 'react-router') return { useLocation: () => location, useNavigationType: () => navigation };
      if (name === 'react/jsx-runtime') return { Fragment: 'fragment', jsx: (_type, props) => props.children };
      if (name.endsWith('/focusRuntime')) return { scheduleProgrammaticFocus: () => { focusRequests++; return () => { focusCancels++; }; } };
      throw new Error(`Unexpected coordinator import: ${name}`);
    },
  });
  return {
    window, calls, events, setAnchorDocumentY(value) { anchorDocumentY = value; },
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

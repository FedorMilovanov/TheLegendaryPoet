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
  const refs = [], effects = [], frames = new Map(), calls = [];
  let refIndex = 0, effectIndex = 0, nextFrame = 0;
  let location = { key: 'first', pathname: '/essay', hash: '' }, navigation = 'POP';
  const window = {
    history: { scrollRestoration: 'auto' }, scrollY: 0,
    matchMedia: () => ({ matches: true }),
    addEventListener() {}, removeEventListener() {},
    scrollTo(options) { calls.push(options.top); this.scrollY = options.top; },
  };
  const document = {
    documentElement: { classList: { remove() {} } },
    getElementById: (id) => id === 'target' ? { isConnected: true, getBoundingClientRect: () => ({ top: 300 }) } : null,
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, window, document,
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
      if (name.endsWith('/focusRuntime')) return { scheduleProgrammaticFocus: () => () => {} };
      throw new Error(`Unexpected coordinator import: ${name}`);
    },
  });
  return {
    window, calls,
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

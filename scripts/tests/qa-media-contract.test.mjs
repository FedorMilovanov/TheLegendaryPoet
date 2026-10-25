import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';
import { assertRequestedMedia, registerMediaContract } from '../../qa/media-contract.mjs';

const pageWith = (reduce, forced) => ({ evaluate: async () => ({ reduce, forced }) });

test('unspecified media does not constrain browser defaults or later explicit emulation', async () => {
  await assertRequestedMedia({ evaluate: () => assert.fail('unrequested media was evaluated') }, {});
});

test('effective reduce/active and no-preference/none are accepted', async () => {
  await assertRequestedMedia(pageWith(true, true), { reducedMotion: 'reduce', forcedColors: 'active' });
  await assertRequestedMedia(pageWith(false, false), { reducedMotion: 'no-preference', forcedColors: 'none' });
});

test('ignored reduced-motion declarations cannot look certified', async () => {
  await assert.rejects(assertRequestedMedia(pageWith(false, false), { reducedMotion: 'reduce' }), /requested reduced-motion/);
  await assert.rejects(assertRequestedMedia(pageWith(true, false), { reducedMotion: 'no-preference' }), /requested reduced-motion/);
});

test('ignored forced-color declarations cannot look certified', async () => {
  await assert.rejects(assertRequestedMedia(pageWith(false, false), { forcedColors: 'active' }), /requested forced-colors/);
  await assert.rejects(assertRequestedMedia(pageWith(false, true), { forcedColors: 'none' }), /requested forced-colors/);
});

test('registration installs the same guard as a beforeEach hook', async () => {
  let hook;
  registerMediaContract({ beforeEach: callback => { hook = callback; } });
  assert.equal(typeof hook, 'function');
  await assert.rejects(hook({ page: pageWith(false, false), contextOptions: { reducedMotion: 'reduce' } }), /requested reduced-motion/);
});

function unsupportedMedia(source, fileName) {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const violations = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
      && node.expression.expression.getText(file) === 'test' && node.expression.name.text === 'use') {
      const options = node.arguments[0];
      if (options && ts.isObjectLiteralExpression(options)) for (const property of options.properties) {
        const name = property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : '';
        if (['reducedMotion', 'forcedColors'].includes(name)) {
          violations.push(`${fileName}:${file.getLineAndCharacterOfPosition(property.getStart(file)).line + 1}: ${name} belongs in contextOptions`);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return violations;
}

test('media declaration scanner distinguishes fixture keys from valid browser APIs', () => {
  assert.equal(unsupportedMedia("test.use({ reducedMotion, 'forcedColors': 'active' });", 'fixture.mjs').length, 2);
  assert.deepEqual(unsupportedMedia("test.use({ contextOptions: { reducedMotion: 'reduce' } }); page.emulateMedia({ forcedColors: 'active' }); browser.newContext({ reducedMotion });", 'valid.mjs'), []);
});

test('QA modules never declare media as ignored standalone test.use fixtures', () => {
  const files = fs.readdirSync('qa', { recursive: true }).filter(name => name.endsWith('.mjs'));
  const violations = files.flatMap(name => {
    const file = path.join('qa', name);
    return unsupportedMedia(fs.readFileSync(file, 'utf8'), file);
  });
  assert.deepEqual(violations, []);
});

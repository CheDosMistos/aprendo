import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/login.astro', import.meta.url), 'utf8');

test('login stays buttonless and submits explicitly from password Enter', () => {
  assert.doesNotMatch(source, /<button\b/i);
  assert.match(source, /password\.addEventListener\('keydown'/);
  assert.match(source, /event\.key !== 'Enter'/);
  assert.match(source, /form\.requestSubmit\(\)/);
});

test('login submits on password blur only when both credentials are filled', () => {
  assert.match(source, /password\.addEventListener\('blur'/);
  assert.match(source, /username\.value\.trim\(\) === '' \|\| password\.value === ''/);
});

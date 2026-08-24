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

test('login shows the Aprendo mark centered at about 100px with a 20rpm center rotation', () => {
  assert.match(source, /class="login-mark"/);
  assert.match(source, /width:\s*6\.25rem/);
  assert.match(source, /height:\s*6\.25rem/);
  assert.match(source, /class="login-mark-center"/);
  assert.match(source, /animation:\s*login-mark-spin 3s linear infinite/);
  assert.match(source, /from \{ transform: rotate\(45deg\); \}/);
  assert.match(source, /to \{ transform: rotate\(405deg\); \}/);
});

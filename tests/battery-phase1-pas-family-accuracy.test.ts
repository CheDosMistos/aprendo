import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const lesson = readFileSync(
  'src/courses/bateria/content/pages/u2-l3-paradiddle-diddle-five-stroke.md',
  'utf8',
);

test('U2 keeps Five Stroke Roll in the roll branch, not the drag branch', () => {
  assert.match(lesson, /Five Stroke Roll \/ doubles y resolución/);
  assert.doesNotMatch(lesson, /Five Stroke Roll \/ drags/);
  assert.match(lesson, /Localiza \*\*7\. Five Stroke Roll\*\*/);
});

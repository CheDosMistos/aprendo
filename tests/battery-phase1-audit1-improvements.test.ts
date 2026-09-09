import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');
const frontmatter = (source: string) => source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';

test('U5 retoma Single Paradiddle como prerrequisito y no como PAS nuevo', () => {
  const u1 = read('src/courses/bateria/content/pages/u1-l2-doubles-paradiddle.md');
  const overview = read('src/courses/bateria/content/pages/u5-overview.md');
  const lesson = read('src/courses/bateria/content/pages/u5-l3-dragadiddle-paradiddle1.md');

  assert.match(frontmatter(u1), /\bSingle Paradiddle\b/);
  assert.doesNotMatch(frontmatter(overview), /\bSingle Paradiddle\b/);
  assert.doesNotMatch(frontmatter(lesson), /\bSingle Paradiddle\b/);

  assert.match(overview, /Single Paradiddle no es uno de los cinco PAS nuevos de U5/i);
  assert.match(overview, /prerrequisito ya introducido en U1/i);
  assert.match(overview, /estado PAS previo no se reinicia/i);

  assert.match(lesson, /Single Paradiddle se retoma únicamente como prerrequisito de recuperación/i);
  assert.match(lesson, /no se presenta de nuevo ni reinicia su estado PAS/i);
});

test('U1 L4 mantiene la lectura nueva dentro del alcance de pad y alfabetización inicial', () => {
  const lesson = read('src/courses/bateria/content/pages/u1-l4-recuperacion-lectura-aplicacion.md');
  const score = read('public/bateria/notation/u1/lectura-transferencia-a7-a8.musicxml');

  assert.match(lesson, /Lectura nueva — negras y corcheas en 4\/4/);
  assert.doesNotMatch(lesson, /Moeller|adaptación técnica entre superficies y kit/i);
  assert.match(score, /<work-title>U1 - Lectura nueva - negras y corcheas en 4\/4<\/work-title>/);
  assert.doesNotMatch(score, /A7-A8|Moeller|kit/i);
  assert.match(score, /<part-name>Pad<\/part-name>/);
  assert.match(score, /<type>quarter<\/type>/);
  assert.match(score, /<type>eighth<\/type>/);
});

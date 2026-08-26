import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u1-overview.md');
const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u1-l1-punto-real-entrada.md');
const scorePath = path.resolve('public/bateria/notation/f2/u1/f2-u1-lectura-entrada-a.musicxml');
const scoreUrl = '/bateria/notation/f2/u1/f2-u1-lectura-entrada-a.musicxml';

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 Unit 1 uses the phase-safe route contract', async () => {
  const overview = await readFile(overviewPath, 'utf8');
  const lesson = await readFile(lessonPath, 'utf8');
  for (const source of [overview, lesson]) {
    const data = frontmatter(source);
    assert.match(data, /^phase:\s*2$/m);
    assert.match(data, /^unit:\s*1$/m);
    assert.match(data, /^unitSlug:\s*fase-2-unidad-1$/m);
  }
  assert.match(frontmatter(overview), /^kind:\s*unit$/m);
  assert.match(frontmatter(lesson), /^kind:\s*lesson$/m);
  assert.match(frontmatter(lesson), /^slug:\s*punto-real-de-entrada$/m);
});

test('20.U1.L1 keeps reading and time dominant and introduces no PAS rudiment', async () => {
  const lesson = await readFile(lessonPath, 'utf8');
  const data = frontmatter(lesson);
  for (const competency of ['C1', 'C2', 'D1', 'F1', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`));
  }
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);
  assert.match(lesson, /material nuevo/i);
  assert.match(lesson, /silencio[^\n]*no detiene el tiempo/i);
  assert.match(lesson, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(lesson, /CONTINUAR \+ CORRECTIVO/);
  assert.match(lesson, /REDUCIR NOVEDAD/);
});

test('20.U1.L1 protects first sight and exposes its MusicXML source', async () => {
  const lesson = await readFile(lessonPath, 'utf8');
  await access(scorePath);
  const scoreTag = lesson.match(/<div\b[^>]*data-notation-score[^>]*>/)?.[0] ?? '';
  assert.ok(scoreTag);
  assert.ok(scoreTag.includes(`data-score-src="${scoreUrl}"`));
  assert.ok(scoreTag.includes('data-score-first-sight="true"'));
  assert.ok(scoreTag.includes('data-score-badge="EJERCICIO ORIGINAL CREADO PARA ESTE CURSO"'));
  assert.ok(scoreTag.includes(`data-score-source-url="${scoreUrl}"`));
  assert.ok(scoreTag.includes('data-score-source-label="MusicXML — fuente del ejercicio"'));
});

test('20.U1.L1 uses the approved 25–30 minute block structure', async () => {
  const lesson = await readFile(lessonPath, 'utf8');
  assert.match(lesson, /^## 1\. Reentrada — 2–3 min$/m);
  assert.match(lesson, /^## 2\. Recuperación de un PAS conocido — 4–5 min$/m);
  assert.match(lesson, /^## 3\. Lectura real de entrada — 10–12 min$/m);
  assert.match(lesson, /^## 4\. Una sola variación — 4–5 min$/m);
  assert.match(lesson, /^## 5\. Evidencia y decisión — 2–3 min$/m);
});

import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u4-l4-leer-seguir-recuperarse.md');
const scorePath = path.resolve('public/bateria/notation/f2/u4/f2-u4-l4-lectura-nueva.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function noteBodies(xml: string): string[] {
  return [...xml.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((match) => match[1]);
}

test('Phase 2 U4 L4 keeps new reading subordinate to continuity and recovery instead of making D5 central', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u4-l4\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*4\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-4\s*$/m);
  assert.match(data, /^slug:\s*leer-seguir-y-recuperarse\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*4\s*$/m);
  assert.doesNotMatch(data, /\bD5\b/, 'D5 must remain reserved for U9 as a central competency');

  for (const competency of ['C1', 'C2', 'C3', 'D2', 'D6', 'F1', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U4 L4`);
  }

  assert.match(markdown, /UN ERROR LOCAL NO OBLIGA A PERDER EL COMPÁS/);
  assert.match(markdown, /No convierte todavía \*\*D5 — primera vista\*\* en competencia dominante/);
  assert.match(markdown, /U9 reservará el protocolo sistemático de primera vista/);
  assert.match(markdown, /precisión ≠ continuidad ≠ recuperación/i);
});

test('Phase 2 U4 L4 uses one exclusive protected score and never reuses it as checkpoint evidence', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  await access(scorePath);

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 0);
  assert.match(markdown, /f2-u4-l4-lectura-nueva\.musicxml/);
  assert.match(markdown, /Cualquier repetición posterior es \*\*relectura\/práctica\*\*, no una segunda muestra independiente de primera vista/);
  assert.match(markdown, /El checkpoint de U4 utilizará \*\*otra muestra exclusiva\*\*/);
  assert.match(markdown, /Esta partitura no se reutilizará como evidencia principal/);
});

test('Phase 2 U4 L4 MusicXML is exact 4/4 syncopation with no extra expressive, sticking or tuplet layer', async () => {
  const xml = await readFile(scorePath, 'utf8');

  assert.match(xml, /<score-partwise version="4\.0">/);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /Asset exclusivo de 20\.U4\.L4/);
  assert.match(xml, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(xml, /<divisions>4<\/divisions>/);
  assert.match(xml, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(xml, /<sound tempo="120"\/>/);

  const measures = [...xml.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const total = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(total, 16, `Measure ${number} must fill exactly 4/4 at divisions=4`);
  }

  assert.equal((xml.match(/<tie type="start"\/>/g) ?? []).length, 3);
  assert.equal((xml.match(/<tie type="stop"\/>/g) ?? []).length, 3);
  assert.equal((xml.match(/<tied type="start"\/>/g) ?? []).length, 3);
  assert.equal((xml.match(/<tied type="stop"\/>/g) ?? []).length, 3);

  assert.doesNotMatch(xml, /<accent\b|<strong-accent\b|<dynamics\b/);
  assert.doesNotMatch(xml, /<lyric>|<time-modification>|<tuplet\b/);

  const sounded = noteBodies(xml).filter((body) => !body.includes('<rest/>'));
  assert.ok(sounded.length > 0);
  for (const body of sounded) assert.match(body, /<notehead>normal<\/notehead>/);
});

test('Phase 2 U4 L4 preserves progression semantics and stops before U5 content', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Preparar condiciones — 3 min',
    '## 2. Primera toma: leer y continuar — 5–6 min',
    '## 3. Diagnóstico: precisión ≠ continuidad ≠ recuperación — 4–5 min',
    '## 4. Relectura con recuperación planificada — 7–8 min',
    '## 5. Transferencia: misma línea, una capa expresiva — 4–5 min',
    '## 6. Registro y decisión — 2 min',
  ]) assert.ok(markdown.includes(heading), `Missing U4 L4 block: ${heading}`);

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR AL CHECKPOINT DE U4/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /no actualiza automáticamente competencias/i);
  assert.match(markdown, /No se exige:[\s\S]*D5 funcional global;[\s\S]*tresillos, 6\/8 o vocabulario de U5–U6/i);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0);
});

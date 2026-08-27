import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u4-l1-sincopa-ii.md');
const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u4-overview.md');
const scorePath = path.resolve('public/bateria/notation/f2/u4/f2-u4-l1-sincopa-ii.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U4 overview preserves the approved unit architecture and later-unit boundaries', async () => {
  const overview = await readFile(overviewPath, 'utf8');
  const data = frontmatter(overview);

  assert.match(data, /^contentId:\s*bat-f2-u4-overview\s*$/m);
  assert.match(data, /^unit:\s*4\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-4\s*$/m);
  assert.match(data, /^kind:\s*unit\s*$/m);
  assert.match(data, /^order:\s*0\s*$/m);
  assert.match(data, /B7/);
  assert.match(overview, /LA LÍNEA RÍTMICA MANDA; EL RUDIMENTO SIRVE A LA LECTURA, NO AL REVÉS/);
  assert.match(overview, /4 lecciones \+ checkpoint/);
  assert.match(overview, /Síncopa II: más combinaciones, mismo marco/);
  assert.match(overview, /La misma línea, otro acento/);
  assert.match(overview, /La línea manda: aplicación B7 sobre lectura conocida/);
  assert.match(overview, /Leer, seguir y recuperarse/);
  assert.match(overview, /tresillos ni cambios 2↔3↔4 — U5/);
  assert.match(overview, /6\/8 — U6/);
  assert.match(overview, /primera vista como competencia central D5 — U9/);
  assert.match(overview, /click reducido\/gaps como reto central — U10/);
});

test('Phase 2 U4 L1 makes syncopation variety the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u4-l1\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*4\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-4\s*$/m);
  assert.match(data, /^slug:\s*sincopa-ii-mas-combinaciones-mismo-marco\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*1\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);
  assert.doesNotMatch(data, /\bB7\b/);

  for (const competency of ['C1', 'C2', 'C3', 'D2', 'D6', 'F1', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U4 L1`);
  }

  assert.match(markdown, /más combinaciones de posiciones débiles y duraciones/i);
  assert.match(markdown, /Más variedad no significa más capas/i);
  assert.match(markdown, /no llamamos “síncopa” automáticamente a cualquier offbeat aislado/i);
  assert.match(markdown, /decodificación.*pérdida temporal/is);
  assert.match(markdown, /No transformes todavía el acento ni el sticking/i);
  assert.match(markdown, /L2 y L3 necesitan conservar esas capas como novedades identificables/i);
});

test('Phase 2 U4 L1 MusicXML closes every 4/4 measure and increases positional variety without adding accents or tuplets', async () => {
  const score = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.equal((score.match(/<tie type="start"\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<tie type="stop"\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<tied type="start"\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<tied type="stop"\/>/g) ?? []).length, 4);
  assert.ok((score.match(/<type>16th<\/type>/g) ?? []).length >= 6, 'U4 L1 should use known sixteenth positions to vary syncopation placement');
  assert.doesNotMatch(score, /<accent\b|<strong-accent\b|<dynamics\b/);
  assert.doesNotMatch(score, /<time-modification>|<tuplet\b/);

  const sounded = [...score.matchAll(/<note>([\s\S]*?)<\/note>/g)].filter(([, body]) => !body.includes('<rest/>'));
  assert.ok(sounded.length > 0);
  for (const [, body] of sounded) {
    assert.match(body, /<notehead>normal<\/notehead>/);
  }

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const total = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(total, 16, `Measure ${number} must fill exactly 4/4 at divisions=4`);
  }
});

test('Phase 2 U4 L1 preserves the five-block lesson shape, feedback gate and advancement semantics', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación U3 — 3 min',
    '## 2. NÚCLEO — 10–12 min',
    '## 3. Continuidad y recuperación — 5–6 min',
    '## 4. Contraste y transferencia — 3–4 min',
    '## 5. Registro — 2 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.match(markdown, /GUIADO[\s\S]*CON PISTAS[\s\S]*SIN PISTAS/);
  assert.match(markdown, /SIN PISTAS` no significa tocar de memoria/i);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 2);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige cero errores, un BPM concreto/i);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /la misma línea, otro acento/i);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u2-l2-cambio-2-a-4.md');
const scorePath = path.resolve('public/bateria/notation/f2/u2/f2-u2-cambio-2-a-4-silencios.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U2 L2 opens C3 only through simple binary 2-to-4 changes', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u2-l2\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*2\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-2\s*$/m);
  assert.match(data, /^slug:\s*silencios-y-cambio-2-a-4-sin-perder-el-pulso\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*2\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  for (const competency of ['C1', 'C2', 'C3', 'C4', 'D1', 'F1', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in the U2 L2 contract`);
  }
  assert.doesNotMatch(data, /\bB7\b/, 'Rudimental application belongs to U2 L4, not L2');

  assert.match(markdown, /Pasar de 2 a 4 no acelera la negra/i);
  assert.match(markdown, /C3 queda \*\*INICIADO\*\*, no FUNCIONAL/i);
  assert.match(markdown, /sólo trabajamos cambios binarios sencillos `2 ↔ 4`/i);
  assert.match(markdown, /no equivale a declarar C3 FUNCIONAL de forma global/i);
  assert.match(markdown, /no se exigen cambios `2 ↔ 3 ↔ 4 ↔ 6`/i);
});

test('Phase 2 U2 L2 keeps U3 concepts and auditory-writing work outside the dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /U3 seguirá reservando como novedad estructurada ligaduras, puntillos/i);
  assert.match(markdown, /distinción explícita `ataque ≠ duración`/i);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0, 'Formal hearing/writing transfer belongs to L3');
  assert.match(markdown, /La siguiente lección cambia de dirección/i);
  assert.match(markdown, /OÍR → IMITAR → ESCRIBIR/);
  assert.doesNotMatch(markdown, /data-score-first-sight="true"/);
});

test('Phase 2 U2 L2 uses protected L1 retrieval plus one original 2-to-4 score', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /f2-u2-rejilla-cuatro-posiciones\.musicxml/);
  assert.match(markdown, /data-score-feedback="after-attempt"/);
  assert.match(markdown, /f2-u2-cambio-2-a-4-silencios\.musicxml/);
  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 2);
  assert.match(markdown, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(markdown, /120 BPM.*sólo una referencia técnica de playback/i);
});

test('Phase 2 U2 L2 MusicXML alternates eighth and sixteenth density with valid 4/4 measures', async () => {
  const score = await readFile(scorePath, 'utf8');

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(score, /<duration>2<\/duration><type>eighth<\/type>/, 'The score must contain density-2 eighth notes');
  assert.match(score, /<duration>1<\/duration><type>16th<\/type>/, 'The score must contain density-4 sixteenth notes');
  assert.match(score, /<note><rest\/><duration>1<\/duration><type>16th<\/type><\/note>/, 'Dense-grid sixteenth rests are required');
  assert.doesNotMatch(score, /<tie\b|<tied\b|<dot\/>/, 'Ties and dots remain U3 material');

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 8, 'L2 needs an eight-measure bank for varied 2-to-4 transfer');
  for (const [, number, body] of measures) {
    const totalDuration = [...body.matchAll(/<duration>(\d+)<\/duration>/g)]
      .reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(totalDuration, 16, `Measure ${number} must fill exactly 4/4 at divisions=4`);
    assert.match(body, /<duration>1<\/duration>/, `Measure ${number} must include density 4`);
    assert.match(body, /<duration>2<\/duration>/, `Measure ${number} must include density 2`);
  }
});

test('Phase 2 U2 L2 preserves the approved five-block shape and evidence-based advancement', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación — 3 min',
    '## 2. NÚCLEO — 10–12 min',
    '## 3. Continuidad — 5–6 min',
    '## 4. Transferencia — 3–4 min',
    '## 5. Registro — 2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing approved block: ${heading}`);
  }

  assert.match(markdown, /INFERENCIA:[\s\S]*EVIDENCIA:[\s\S]*TAREA:[\s\S]*CONDICIONES:[\s\S]*DECISIÓN:/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige un BPM concreto/i);
  assert.match(markdown, /no actualiza automáticamente C3/i);
  assert.match(markdown, /Opción A — mano líder/);
  assert.match(markdown, /Opción B — acento sencillo/);
  assert.match(markdown, /No conviertas un fallo de segunda capa en evidencia automática de que C3 ha fallado/i);
});

import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u5-l4-oir-escribir-transferir.md');
const scorePath = path.resolve('public/bateria/notation/f2/u5/f2-u5-l4-transferencia.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U5 L4 makes representation transfer the dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u5-l4\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*5\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-5\s*$/m);
  assert.match(data, /^slug:\s*oir-escribir-y-transferir-2-3-4\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*4\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'C3', 'D1', 'D2', 'D3', 'E1', 'E2', 'E3', 'E4', 'F1', 'F2']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U5 L4`);
  }
  assert.doesNotMatch(competencies, /\bD5\b/);

  assert.match(markdown, /ESCUCHAR, IMITAR, ESCRIBIR Y LEER SON VÍAS DISTINTAS HACIA UNA MISMA ORGANIZACIÓN TEMPORAL/);
  assert.match(markdown, /La novedad dominante es \*\*cambiar de representación\*\*/);
  assert.match(markdown, /escucha, memoria, notación, ejecución o pulso/i);
  assert.match(markdown, /ESCUCHA → REPRESENTACIÓN → NOTACIÓN → EJECUCIÓN → COMPARACIÓN/);
  assert.match(markdown, /Transformación A — 2 → 3/);
  assert.match(markdown, /Transformación B — 3 → 4/);
  assert.match(markdown, /No afirmes equivalencia de ataques/i);
});

test('Phase 2 U5 L4 provides real ear imitation writing reading and self-created transfer tasks', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Oír e identificar — 5 min',
    '## 2. Escuchar → imitar — 5 min',
    '## 3. Escuchar → escribir — 6 min',
    '## 4. Leer una variante y transferir — 7–8 min',
    '## 5. Crear y verificar una célula — 3–4 min',
    '## 6. Registro — 2 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.match(markdown, /Graba 3–6 muestras breves/i);
  assert.match(markdown, /E1 — PULSO/);
  assert.match(markdown, /E2 — SUBDIVISIÓN/);
  assert.match(markdown, /escucha una vez sin tocar/i);
  assert.match(markdown, /imita en el pad sin volver a escuchar/i);
  assert.match(markdown, /escribe `4\/4`/i);
  assert.match(markdown, /tresillo real/i);
  assert.match(markdown, /Escribe una célula propia de un compás en 4\/4/i);
  assert.match(markdown, /Esto es material propio del alumno, no una partitura normativa ni un ejercicio PAS/i);
});

test('Phase 2 U5 L4 score encodes 2 3 and 4 as equal-duration pulses and closes every 4/4 measure', async () => {
  const score = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<divisions>12<\/divisions>/);
  assert.match(score, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.doesNotMatch(score, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /<midi-channel>10<\/midi-channel>/);
  assert.match(score, /<midi-unpitched>39<\/midi-unpitched>/);

  assert.equal((score.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 12);
  assert.equal((score.match(/<duration>4<\/duration><type>eighth<\/type>/g) ?? []).length, 15);
  assert.equal((score.match(/<duration>3<\/duration><type>16th<\/type>/g) ?? []).length, 20);
  assert.equal((score.match(/<time-modification><actual-notes>3<\/actual-notes><normal-notes>2<\/normal-notes><\/time-modification>/g) ?? []).length, 15);
  assert.equal((score.match(/<tuplet type="start"\/>/g) ?? []).length, 5);
  assert.equal((score.match(/<tuplet type="stop"\/>/g) ?? []).length, 5);
  assert.doesNotMatch(score, /<actual-notes>6<\/actual-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b|<lyric\b/);

  const sounded = [...score.matchAll(/<note>([\s\S]*?)<\/note>/g)].filter(([, body]) => !body.includes('<rest/>'));
  assert.equal(sounded.length, 47);
  for (const [, body] of sounded) {
    assert.match(body, /<instrument id="P1-I1"\/>/);
    assert.match(body, /<notehead>normal<\/notehead>/);
  }

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const total = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(total, 48, `Measure ${number} must fill exactly 4/4 at divisions=12`);
  }
});

test('Phase 2 U5 L4 preserves feedback-first reading, D5 boundary and U6 boundary', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 1);
  assert.match(markdown, /nueva para esta tarea.*no se registra como evidencia formal de primera vista D5/is);
  assert.match(markdown, /U9 reservará condiciones específicas para medir primera vista realmente nueva/i);
  assert.match(markdown, /Esto no convierte 4\/4 en 6\/8/i);
  assert.match(markdown, /U6 cambiará explícitamente la organización métrica/i);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR AL CHECKPOINT DE U5/);
  assert.match(markdown, /No se exige:[\s\S]*un BPM concreto o alto/);
  assert.match(markdown, /primera vista formal D5/i);
  assert.match(markdown, /no actualiza.*automáticamente|pasen automáticamente a `FUNCIONAL`/i);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
});

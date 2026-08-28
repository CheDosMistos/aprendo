import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u7-overview.md');
const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u7-l1-9-8-tres-pulsos-compuestos.md');
const scorePath = path.resolve('public/bateria/notation/f2/u7/f2-u7-l1-9-8-tres-pulsos-compuestos.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U7 L1 derives 9/8 from the approved compound-meter generalization', async () => {
  const overview = await readFile(overviewPath, 'utf8');
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(overview, /6\/8 = 2×3, 9\/8 = 3×3 Y 12\/8 = 4×3/);
  assert.match(overview, /9\/8: tres pulsos compuestos/);

  assert.match(data, /^contentId:\s*bat-f2-u7-l1\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*7\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-7\s*$/m);
  assert.match(data, /^slug:\s*9-8-tres-pulsos-compuestos\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*1\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D1', 'D4', 'F1', 'F2']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U7 L1`);
  }
  assert.doesNotMatch(competencies, /\bD5\b/);
  assert.doesNotMatch(competencies, /\bE5\b/);

  assert.match(markdown, /9\/8 PROTOTÍPICO = 3 PULSOS PRINCIPALES × 3 SUBDIVISIONES/);
  assert.match(markdown, /6\/8 = 2×3 → 9\/8 = 3×3/);
  assert.match(markdown, /COMPÁS 9\/8 → 3 PULSOS PRINCIPALES → 3 CORCHEAS POR PULSO/);
  assert.match(markdown, /1-la-li \| 2-la-li \| 3-la-li/);
  assert.match(markdown, /3\/4 = 3×2/);
  assert.match(markdown, /9\/8 = 3×3/);
  assert.match(markdown, /12\/8 queda para L2/);
  assert.match(markdown, /contraste sistemático simple\/compuesto queda para L3/);
  assert.match(markdown, /clasificación auditiva y E5 inicial se desarrollarán después dentro de U7/);
});

test('Phase 2 U7 L1 MusicXML encodes real 9/8 as three compound beats with exact measure closure', async () => {
  const score = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<divisions>12<\/divisions>/);
  assert.match(score, /<time><beats>9<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.doesNotMatch(score, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.doesNotMatch(score, /<time><beats>3<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score, /<metronome><beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute><\/metronome>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /<midi-channel>10<\/midi-channel>/);
  assert.match(score, /<midi-unpitched>39<\/midi-unpitched>/);

  assert.equal((score.match(/<duration>18<\/duration><type>quarter<\/type><dot\/>/g) ?? []).length, 6);
  assert.equal((score.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 18);
  assert.equal((score.match(/<beam number="1">begin<\/beam>/g) ?? []).length, 6);
  assert.equal((score.match(/<beam number="1">continue<\/beam>/g) ?? []).length, 6);
  assert.equal((score.match(/<beam number="1">end<\/beam>/g) ?? []).length, 6);
  assert.doesNotMatch(score, /<time-modification>|<tuplet\b|<actual-notes>|<normal-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b/);

  const sounded = [...score.matchAll(/<note>([\s\S]*?)<\/note>/g)].filter(([, body]) => !body.includes('<rest/>'));
  assert.equal(sounded.length, 24);
  for (const [, body] of sounded) {
    assert.match(body, /<instrument id="P1-I1"\/>/);
    assert.match(body, /<notehead>normal<\/notehead>/);
  }

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const total = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(total, 54, `Measure ${number} must fill exactly 9/8 at divisions=12`);
  }
});

test('Phase 2 U7 L1 embeds notation with feedback-gated playback and explicit source', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 1);
  assert.match(markdown, /data-score-src="\/bateria\/notation\/f2\/u7\/f2-u7-l1-9-8-tres-pulsos-compuestos\.musicxml"/);
  assert.match(markdown, /data-score-source-url="\/bateria\/notation\/f2\/u7\/f2-u7-l1-9-8-tres-pulsos-compuestos\.musicxml"/);
  assert.match(markdown, /VER → CONTAR\/CANTAR → TOCAR → ESCUCHAR/);
  assert.match(markdown, /Después del intento propio, pulsa \*\*Habilitar audio\*\*/);
  assert.match(markdown, /♩\. = 80/);
  assert.match(markdown, /<sound tempo="120"\/>/);
  assert.match(markdown, /condición de la muestra/);
});

test('Phase 2 U7 L1 keeps progression multidimensional and protects later U7/U8-U10 novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperar 6/8 y añadir un pulso — 4 min',
    '## 2. Qué significa 9/8 aquí — 5 min',
    '## 3. Leer la jerarquía 3×3 — 10–12 min',
    '## 4. Tres pulsos principales sin apoyo continuo — 4–5 min',
    '## 5. Metrónomo: especifica siempre la unidad — 3 min',
    '## 6. Registro — 2 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR \/ CONTINUAR \+ CORRECTIVO \/ REDUCIR NOVEDAD \/ DETENER CARGA/);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR A L2/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige:[\s\S]*un BPM fijo o alto/);
  assert.match(markdown, /12\/8 antes de L2/);
  assert.match(markdown, /clasificación sistemática simple\/compuesto antes de L3/);
  assert.match(markdown, /reconocimiento auditivo E5 general/);
  assert.match(markdown, /sextillos u ornamentación de U8/);
  assert.match(markdown, /primera vista formal D5 de U9/);
  assert.match(markdown, /click reducido o gaps de U10/);
  assert.match(markdown, /actualizar automáticamente D4, F2 o E5/);
  assert.doesNotMatch(markdown, /data-rhythm-dictation/);
});

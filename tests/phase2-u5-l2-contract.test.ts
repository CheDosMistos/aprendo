import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u5-l2-binario-ternario.md');
const scorePath = path.resolve('public/bateria/notation/f2/u5/f2-u5-l2-binario-ternario.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U5 L2 makes 2↔3 over a constant pulse the dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u5-l2\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*5\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-5\s*$/m);
  assert.match(data, /^slug:\s*binario-ternario-el-pulso-no-se-mueve\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*2\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);
  assert.doesNotMatch(data.match(/^competencies:.*$/m)?.[0] ?? '', /\bD5\b/);

  for (const competency of ['C1', 'C2', 'C3', 'D1', 'D2', 'D3', 'F1', 'F2']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U5 L2`);
  }

  assert.match(markdown, /EL PULSO CONTINÚA\. CAMBIA 2 ↔ 3; NO CAMBIA EL TEMPO/);
  assert.match(markdown, /dos partes iguales dentro de cada pulso/i);
  assert.match(markdown, /tres partes iguales dentro de ese mismo pulso/i);
  assert.match(markdown, /CAMBIO DE SUBDIVISIÓN ≠ CAMBIO DE TEMPO/);
  assert.match(markdown, /PULSO:[\s\S]*SUBDIVISIÓN:/);
  assert.match(markdown, /2 ↔ 3 ↔ 4 pertenece a L3/i);
  assert.match(markdown, /U6 trabaja el compás compuesto/i);
});

test('Phase 2 U5 L2 MusicXML maps binary and ternary subdivisions to the same quarter duration', async () => {
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

  const relation = /<time-modification><actual-notes>3<\/actual-notes><normal-notes>2<\/normal-notes><\/time-modification>/g;
  assert.equal((score.match(relation) ?? []).length, 24);
  assert.equal((score.match(/<tuplet type="start"\/>/g) ?? []).length, 8);
  assert.equal((score.match(/<tuplet type="stop"\/>/g) ?? []).length, 8);
  assert.equal((score.match(/<duration>4<\/duration><type>eighth<\/type>/g) ?? []).length, 24);
  assert.equal((score.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 16);
  assert.doesNotMatch(score, /<actual-notes>6<\/actual-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b|<lyric\b/);

  const sounded = [...score.matchAll(/<note>([\s\S]*?)<\/note>/g)].filter(([, body]) => !body.includes('<rest/>'));
  assert.equal(sounded.length, 40);
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

test('Phase 2 U5 L2 keeps playback as feedback and adds a bounded hearing contrast', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperar una referencia común — 3 min',
    '## 2. Dos organizaciones, un mismo pulso — 5–6 min',
    '## 3. Leer el cambio 2 ↔ 3 — 10–11 min',
    '## 4. Oír cuál organización está sonando — 4–5 min',
    '## 5. Retirar ayudas y registrar — 3–4 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 1);

  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-bpm="60"/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-subdivision="2"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-subdivision="3"/g) ?? []).length, 1);
  assert.match(markdown, /BINARIA — dos ataques equidistantes por pulso/);
  assert.match(markdown, /TERNARIA — tres ataques equidistantes por pulso/);
  assert.match(markdown, /antes.*mostrar la solución/is);
  assert.match(markdown, /después de revelar.*práctica.*no como nueva evidencia auditiva/is);
});

test('Phase 2 U5 L2 preserves multidimensional evaluation and later-layer boundaries', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /BPM no es competencia/i);
  assert.match(markdown, /no actualiza automáticamente C2, C3, D3/i);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR A L3/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige:[\s\S]*un BPM concreto o alto/);
  assert.match(markdown, /encadenar todavía `2 ↔ 3 ↔ 4` como tarea central/);
  assert.match(markdown, /primera vista formal D5/);
  assert.match(markdown, /6\/8/);
  assert.match(markdown, /sextillos/);
});

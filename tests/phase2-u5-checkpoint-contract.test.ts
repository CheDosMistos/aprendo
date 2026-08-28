import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const checkpointPath = path.resolve('src/courses/bateria/content/pages/f2-u5-checkpoint-puerta-reorganizacion-pulso.md');
const scorePath = path.resolve('public/bateria/notation/f2/u5/f2-u5-checkpoint-reorganizacion.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U5 checkpoint asks the approved pulse-reorganization inference without promoting D5', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u5-check\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*5\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-5\s*$/m);
  assert.match(data, /^slug:\s*puerta-de-reorganizacion-del-pulso\s*$/m);
  assert.match(data, /^kind:\s*checkpoint\s*$/m);
  assert.match(data, /^order:\s*5\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'C3', 'D1', 'D3', 'E1', 'E2', 'E4', 'F1', 'F2']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U5 checkpoint`);
  }
  assert.doesNotMatch(competencies, /\bD4\b|\bD5\b/);

  assert.match(markdown, /¿C1–C3 y D3 permiten abrir U6 sin confundir “tres por pulso” con “seis pulsos iguales” ni perder sistemáticamente la referencia al cambiar 2↔3↔4\?/);
  assert.match(markdown, /El BPM describe la \*\*condición\*\* de la muestra; no define el nivel/);
  assert.match(markdown, /no se registra como evidencia formal de primera vista D5/i);
  assert.match(markdown, /U9 reservará condiciones específicas para medir primera vista realmente nueva/i);
});

test('Phase 2 U5 checkpoint uses one exclusive feedback-gated score and one real ternary auditory microtask', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.match(markdown, /data-score-src="\/bateria\/notation\/f2\/u5\/f2-u5-checkpoint-reorganizacion\.musicxml"/);
  assert.match(markdown, /data-score-source-label="MusicXML — fuente del ejercicio"/);
  assert.match(markdown, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);

  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 1);
  assert.match(markdown, /data-subdivision="3"/);
  assert.match(markdown, /data-pattern="101011"/);
  assert.match(markdown, /X · X \| · X X — dos pulsos ternarios/);
  assert.match(markdown, /E1 — PULSO/);
  assert.match(markdown, /E2 — SUBDIVISIÓN/);
  assert.match(markdown, /E4 — REPRESENTACIÓN/);
});

test('Phase 2 U5 checkpoint score closes every 4/4 measure and encodes 2 3 4 without 6/8 or sextuplets', async () => {
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

  assert.equal((score.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 8);
  assert.equal((score.match(/<duration>4<\/duration><type>eighth<\/type>/g) ?? []).length, 27);
  assert.equal((score.match(/<duration>3<\/duration><type>16th<\/type>/g) ?? []).length, 12);
  assert.equal((score.match(/<time-modification><actual-notes>3<\/actual-notes><normal-notes>2<\/normal-notes><\/time-modification>/g) ?? []).length, 27);
  assert.equal((score.match(/<tuplet type="start"\/>/g) ?? []).length, 9);
  assert.equal((score.match(/<tuplet type="stop"\/>/g) ?? []).length, 9);
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

test('Phase 2 U5 checkpoint keeps evaluation multidimensional and opens only the U6 metric novelty', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /### CONTINUAR\n/);
  assert.match(markdown, /### CONTINUAR \+ CORRECTIVO\n/);
  assert.match(markdown, /### REDUCIR NOVEDAD\n/);
  assert.match(markdown, /### DETENER CARGA\n/);
  assert.match(markdown, /## MÍNIMO PARA ABRIR U6/);
  assert.match(markdown, /No se exige:[\s\S]*un BPM fijo, universal o alto/);
  assert.match(markdown, /cambios rápidos `2↔3↔4`/);
  assert.match(markdown, /sextillos/);
  assert.match(markdown, /6\/8 dominado/);
  assert.match(markdown, /primera vista formal D5/);
  assert.match(markdown, /no actualiza automáticamente/i);

  assert.match(markdown, /tres por pulso no convierte automáticamente el compás en 6\/8/i);
  assert.match(markdown, /no enseña todavía 6\/8/i);
  assert.match(markdown, /U6 puede introducir su salto conceptual reservado: \*\*compás compuesto I — 6\/8 como organización métrica prototípica de dos pulsos principales con subdivisión ternaria\*\*/);
  assert.doesNotMatch(markdown, /9\/8 o 12\/8[^;\n]*como (objetivo|tarea|ejercicio)/i);
});

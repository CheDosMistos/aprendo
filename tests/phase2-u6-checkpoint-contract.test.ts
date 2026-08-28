import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const checkpointPath = path.resolve('src/courses/bateria/content/pages/f2-u6-checkpoint-puerta-dos-pulsos-compuestos.md');
const scorePath = path.resolve('public/bateria/notation/f2/u6/f2-u6-checkpoint-dos-pulsos.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U6 checkpoint asks the approved 6/8 gate inference without promoting D5 or E5', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u6-check\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*6\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-6\s*$/m);
  assert.match(data, /^slug:\s*puerta-de-dos-pulsos-compuestos\s*$/m);
  assert.match(data, /^kind:\s*checkpoint\s*$/m);
  assert.match(data, /^order:\s*5\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D4', 'E1', 'E2', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U6 checkpoint`);
  }
  assert.doesNotMatch(competencies, /\bD5\b|\bE5\b/);

  assert.match(markdown, /¿D4\/F2 y C1\/C2 permiten abrir la siguiente ampliación del compás compuesto conservando 6\/8 como dos pulsos principales subdivididos en tres/);
  assert.match(markdown, /no demuestra E5 general/i);
  assert.match(markdown, /no se registra esta tarea como primera vista formal D5/i);
  assert.match(markdown, /El BPM describe la \*\*condición\*\* de la muestra; no define el nivel/);
});

test('Phase 2 U6 checkpoint uses one exclusive feedback-gated score and no extra auditory widget', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0);
  assert.match(markdown, /data-score-src="\/bateria\/notation\/f2\/u6\/f2-u6-checkpoint-dos-pulsos\.musicxml"/);
  assert.match(markdown, /data-score-source-url="\/bateria\/notation\/f2\/u6\/f2-u6-checkpoint-dos-pulsos\.musicxml"/);
  assert.match(markdown, /data-score-source-label="MusicXML — fuente del ejercicio"/);
  assert.match(markdown, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(markdown, /playback sólo \*\*después del intento propio\*\*/i);
  assert.match(markdown, /marca únicamente \*\*dos apoyos grandes por compás\*\*/i);
  assert.match(markdown, /evidencia secundaria de \*\*E1\/E2 en el contexto ya delimitado\*\*/i);
});

test('Phase 2 U6 checkpoint score is a validated 4-bar 6/8 sample with correct compound playback', async () => {
  const score = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<divisions>12<\/divisions>/);
  assert.match(score, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.match(score, /<metronome><beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>72<\/per-minute><\/metronome>/);
  assert.match(score, /<sound tempo="108"\/>/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /<midi-channel>10<\/midi-channel>/);
  assert.match(score, /<midi-unpitched>39<\/midi-unpitched>/);

  assert.equal((score.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 24);
  assert.equal((score.match(/<rest\/>/g) ?? []).length, 8);
  assert.doesNotMatch(score, /<time-modification>|<actual-notes>|<tuplet\b|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b|<lyric\b/);

  const sounded = [...score.matchAll(/<note>([\s\S]*?)<\/note>/g)].filter(([, body]) => !body.includes('<rest/>'));
  assert.equal(sounded.length, 16);
  for (const [, body] of sounded) {
    assert.match(body, /<instrument id="P1-I1"\/>/);
    assert.match(body, /<notehead>normal<\/notehead>/);
  }

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const total = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(total, 36, `Measure ${number} must fill exactly 6/8 at divisions=12`);
  }
});

test('Phase 2 U6 checkpoint separates meter, grouping and tuplets and opens U7 without teaching it', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.match(markdown, /seis corcheas no bastan para definir la métrica/i);
  assert.match(markdown, /`6\/8` prototípico: \*\*dos pulsos principales × tres corcheas\*\* — `2×3`/);
  assert.match(markdown, /`3\/4` prototípico del contraste: \*\*tres pulsos principales × dos corcheas\*\* — `3×2`/);
  assert.match(markdown, /Un tresillo dentro de otro marco simple expresa una relación de \*tuplet\*, como `3:2`/);
  assert.match(markdown, /\*\*AGRUPACIÓN ≠ COMPÁS\.\*\*/);
  assert.match(markdown, /reagrupación interna \/ agrupación/i);

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /### CONTINUAR\n/);
  assert.match(markdown, /### CONTINUAR \+ CORRECTIVO\n/);
  assert.match(markdown, /### REDUCIR NOVEDAD\n/);
  assert.match(markdown, /### DETENER CARGA\n/);
  assert.match(markdown, /## MÍNIMO PARA ABRIR U7/);
  assert.match(markdown, /primera vista formal D5/);
  assert.match(markdown, /reconocimiento métrico general E5/);
  assert.match(markdown, /9\/8 o 12\/8 — pertenecen a U7 y \*\*no se enseñan en esta puerta\*\*/);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /la siguiente unidad puede \*\*ampliar el modelo de compás compuesto\*\*/i);

  assert.doesNotMatch(markdown, /(?:practica|toca|lee|escribe|escucha)[^\n]{0,80}(?:9\/8|12\/8)/i);
});

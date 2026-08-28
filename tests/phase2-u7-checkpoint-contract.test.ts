import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const checkpointPath = path.resolve('src/courses/bateria/content/pages/f2-u7-checkpoint-puerta-generalizacion-compuesta.md');
const scorePath = path.resolve('public/bateria/notation/f2/u7/f2-u7-checkpoint-generalizacion-compuesta.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function measureTotals(xml: string): number[] {
  return [...xml.matchAll(/<measure number="\d+">([\s\S]*?)<\/measure>/g)].map(([, body]) =>
    [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0),
  );
}

test('Phase 2 U7 checkpoint gates compound generalization without auto-promoting competencies', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u7-check\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*7\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-7\s*$/m);
  assert.match(data, /^slug:\s*puerta-generalizacion-compuesta\s*$/m);
  assert.match(data, /^kind:\s*checkpoint\s*$/m);
  assert.match(data, /^order:\s*5\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D4', 'E1', 'E2', 'E5', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U7 checkpoint`);
  }
  assert.doesNotMatch(competencies, /\bD5\b/);

  assert.match(markdown, /¿D4\/F2 y C1\/C2 permiten conservar el modelo compuesto `2×3 → 3×3 → 4×3`/);
  assert.match(markdown, /dos muestras independientes/i);
  assert.match(markdown, /no convierte completar U7 en una promoción automática de competencias/i);
  assert.match(markdown, /Un BPM describe la \*\*condición de la muestra\*\*, nunca el nivel por sí solo/);
});

test('Phase 2 U7 checkpoint MusicXML closes 6/8, 9/8 and 12/8 exactly with attacks and rests', async () => {
  const xml = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(xml, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.match(xml, /<time><beats>9<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.match(xml, /<time><beats>12<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.deepEqual(measureTotals(xml), [36, 54, 72]);
  assert.equal((xml.match(/<note>/g) ?? []).length, 27);
  assert.equal((xml.match(/<rest\/>/g) ?? []).length, 7);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 20);
  assert.equal((xml.match(/<notehead>normal<\/notehead>/g) ?? []).length, 20);
  assert.equal((xml.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 27);
  assert.equal((xml.match(/<beam number="1">begin<\/beam>/g) ?? []).length, 9);
  assert.equal((xml.match(/<beam number="1">continue<\/beam>/g) ?? []).length, 2);
  assert.equal((xml.match(/<beam number="1">end<\/beam>/g) ?? []).length, 9);
  assert.match(xml, /<metronome><beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute><\/metronome>/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.doesNotMatch(xml, /<time-modification>|<tuplet\b|<actual-notes>|<normal-notes>|<tie\b|<tied\b/);
});

test('Phase 2 U7 checkpoint exposes four exclusive auditory stimuli with a simple-meter distractor', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 4);
  assert.equal((markdown.match(/data-bpm="72"/g) ?? []).length, 4);
  assert.equal((markdown.match(/data-subdivision="3"/g) ?? []).length, 3);
  assert.equal((markdown.match(/data-subdivision="2"/g) ?? []).length, 1);

  for (const snippet of [
    'data-subdivision="3" data-pattern="101110" data-answer="6/8 prototípico — 2 pulsos principales × 3 subdivisiones: compuesto."',
    'data-subdivision="2" data-pattern="101110" data-answer="3/4 prototípico — 3 pulsos principales × 2 subdivisiones: simple."',
    'data-subdivision="3" data-pattern="110101011" data-answer="9/8 prototípico — 3 pulsos principales × 3 subdivisiones: compuesto."',
    'data-subdivision="3" data-pattern="101110011101" data-answer="12/8 prototípico — 4 pulsos principales × 3 subdivisiones: compuesto."',
  ]) assert.ok(markdown.includes(snippet), `Missing checkpoint stimulus: ${snippet}`);

  assert.match(markdown, /A y B vuelven a usar \*\*el mismo patrón de seis posiciones\*\*/);
  assert.match(markdown, /`2×3` frente a `3×2`/);
  assert.match(markdown, /Una respuesta aislada incorrecta \*\*no bloquea automáticamente\*\* el avance/);
});

test('Phase 2 U7 checkpoint preserves feedback, decision system, and U8 boundary', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.match(markdown, /MusicXML — fuente de la muestra escrita del checkpoint/);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /### CONTINUAR/);
  assert.match(markdown, /### CONTINUAR \+ CORRECTIVO/);
  assert.match(markdown, /### REDUCIR NOVEDAD/);
  assert.match(markdown, /### DETENER CARGA/);
  assert.match(markdown, /## MÍNIMO PARA ABRIR U8/);
  assert.match(markdown, /reconocimiento métrico general en repertorio ambiguo/);
  assert.match(markdown, /primera vista formal D5 — U9/);
  assert.match(markdown, /sextillos u ornamentación escrita — \*\*son la novedad de U8, no un requisito de esta puerta\*\*/);
  assert.match(markdown, /click reducido, half-time o gaps — U10/);
  assert.match(markdown, /no actualiza automáticamente/);
  assert.match(markdown, /Eso no equivale a declarar D4, F2, E5 ni ninguna competencia globalmente `FUNCIONAL`/);
});

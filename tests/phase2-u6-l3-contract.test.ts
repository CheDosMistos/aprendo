import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u6-l3-3-4-y-6-8.md');
const score34Path = path.resolve('public/bateria/notation/f2/u6/f2-u6-l3-seis-corcheas-3-4.musicxml');
const score68Path = path.resolve('public/bateria/notation/f2/u6/f2-u6-l3-seis-corcheas-6-8.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function soundedDurations(xml: string): number[] {
  return [...xml.matchAll(/<note>([\s\S]*?)<\/note>/g)]
    .filter(([, body]) => !body.includes('<rest/>'))
    .map(([, body]) => Number(body.match(/<duration>(\d+)<\/duration>/)?.[1] ?? NaN));
}

function measureTotals(xml: string): number[] {
  return [...xml.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)].map(([, , body]) =>
    [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0),
  );
}

test('Phase 2 U6 L3 makes 3/4 versus 6/8 metric hierarchy the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u6-l3\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*6\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-6\s*$/m);
  assert.match(data, /^slug:\s*3-4-y-6-8-misma-cantidad-escrita-distinta-metrica\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*3\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D1', 'D3', 'D4', 'E1', 'E2', 'F1', 'F2']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U6 L3`);
  }
  assert.doesNotMatch(competencies, /\bD5\b/);

  assert.match(markdown, /MISMAS SEIS CORCHEAS ≠ MISMA MÉTRICA/);
  assert.match(markdown, /3\/4 = 3 pulsos principales × 2 corcheas por pulso/);
  assert.match(markdown, /6\/8 = 2 pulsos principales × 3 corcheas por pulso/);
  assert.match(markdown, /AGRUPACIÓN ≠ COMPÁS/);
  assert.match(markdown, /no estamos comparando dos velocidades distintas/i);
  assert.match(markdown, /beaming[^\n]*no conviertas el beaming en la definición del compás/is);
  assert.match(markdown, /Un patrón de acentos puede sugerir o reforzar una agrupación, pero no cambia por sí mismo/i);
  assert.match(markdown, /no tendrías evidencia suficiente para decidir cuál de las dos métricas se pretendía/i);
});

test('Phase 2 U6 L3 paired MusicXML keeps the attack stream identical while meter and beaming differ', async () => {
  const [score34, score68] = await Promise.all([readFile(score34Path, 'utf8'), readFile(score68Path, 'utf8')]);
  await Promise.all([access(score34Path), access(score68Path)]);

  assert.match(score34, /<time><beats>3<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.doesNotMatch(score34, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.match(score68, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.doesNotMatch(score68, /<time><beats>3<\/beats><beat-type>4<\/beat-type><\/time>/);

  assert.match(score34, /<metronome><beat-unit>quarter<\/beat-unit><per-minute>120<\/per-minute><\/metronome>/);
  assert.match(score68, /<metronome><beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute><\/metronome>/);
  for (const score of [score34, score68]) {
    assert.match(score, /<sound tempo="120"\/>/);
    assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.doesNotMatch(score, /<rest\/>|<time-modification>|<tuplet\b|<actual-notes>|<normal-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b/);
    assert.equal((score.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 24);
    assert.equal((score.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 24);
    assert.equal((score.match(/<notehead>normal<\/notehead>/g) ?? []).length, 24);
    assert.deepEqual(measureTotals(score), [36, 36, 36, 36]);
  }

  assert.deepEqual(soundedDurations(score34), soundedDurations(score68));
  assert.deepEqual(soundedDurations(score34), Array(24).fill(6));

  assert.equal((score34.match(/<beam number="1">begin<\/beam>/g) ?? []).length, 12);
  assert.equal((score34.match(/<beam number="1">continue<\/beam>/g) ?? []).length, 0);
  assert.equal((score34.match(/<beam number="1">end<\/beam>/g) ?? []).length, 12);

  assert.equal((score68.match(/<beam number="1">begin<\/beam>/g) ?? []).length, 8);
  assert.equal((score68.match(/<beam number="1">continue<\/beam>/g) ?? []).length, 8);
  assert.equal((score68.match(/<beam number="1">end<\/beam>/g) ?? []).length, 8);
});

test('Phase 2 U6 L3 preserves feedback-first comparison and later-unit boundaries', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Seis corcheas, dos mapas — 4 min',
    '## 2. Qué cambia y qué no — 4–5 min',
    '## 3. Leer la versión en 3/4 — 6–7 min',
    '## 4. Leer la versión en 6/8 — 6–7 min',
    '## 5. Comparación A/B: cambiar el mapa, no los golpes — 4–5 min',
    '## 6. Diagnóstico y registro — 2–3 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio 3\/4"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio 6\/8"/g) ?? []).length, 1);
  assert.match(markdown, /VER → CONTAR → CANTAR → TOCAR → ESCUCHAR/);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR A L4/);
  assert.match(markdown, /No se exige:[\s\S]*un BPM fijo o alto/);
  assert.match(markdown, /9\/8 o 12\/8 — U7/);
  assert.match(markdown, /sextillos — U8/);
  assert.match(markdown, /primera vista formal D5 — U9/);
  assert.match(markdown, /gaps de metrónomo — U10/);
  assert.match(markdown, /actualizar automáticamente D4 o F2/i);
  assert.doesNotMatch(markdown, /data-rhythm-dictation/);
});

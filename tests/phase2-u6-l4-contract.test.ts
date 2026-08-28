import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u6-l4-leer-escuchar-reinterpretar.md');
const scorePath = path.resolve('public/bateria/notation/f2/u6/f2-u6-l4-transferencia-6-8.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function measureTotals(xml: string): number[] {
  return [...xml.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)].map(([, , body]) =>
    [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0),
  );
}

test('Phase 2 U6 L4 makes transfer of representation the dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u6-l4\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*6\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-6\s*$/m);
  assert.match(data, /^slug:\s*leer-escuchar-y-reinterpretar-sin-confundir-metrica\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*4\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D1', 'D4', 'E1', 'E2', 'F1', 'F2', 'G1', 'G2', 'K2', 'K4', 'K6']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U6 L4`);
  }
  assert.doesNotMatch(competencies, /\bD5\b|\bE5\b/);

  assert.match(markdown, /LA ESTRUCTURA DEBE SOBREVIVIR AL CAMBIO DE REPRESENTACIÓN/);
  assert.match(markdown, /La novedad dominante es pasar de \*\*ver\*\* a \*\*escuchar\*\*/i);
  assert.match(markdown, /Una reproducción correcta de este ejemplo no demuestra por sí sola reconocimiento métrico general ni E5 funcional/);
  assert.match(markdown, /TRANSFORMAR LOS ATAQUES NO EQUIVALE A CAMBIAR LA MÉTRICA/);
  assert.match(markdown, /AGRUPACIÓN ≠ COMPÁS/);
});

test('Phase 2 U6 L4 MusicXML is a closed 6/8 transfer line with controlled known vocabulary', async () => {
  await access(scorePath);
  const xml = await readFile(scorePath, 'utf8');

  assert.match(xml, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.doesNotMatch(xml, /<time><beats>(?:3|9|12)<\/beats>|<time-modification>|<tuplet\b|<actual-notes>|<normal-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b/);
  assert.match(xml, /<metronome><beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute><\/metronome>/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);

  assert.equal((xml.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 24);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 18);
  assert.equal((xml.match(/<notehead>normal<\/notehead>/g) ?? []).length, 18);
  assert.equal((xml.match(/<rest\/>/g) ?? []).length, 6);
  assert.deepEqual(measureTotals(xml), [36, 36, 36, 36]);
});

test('Phase 2 U6 L4 preserves feedback-first transfer and later-unit boundaries', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación: explica 6/8 sin tocar — 3 min',
    '## 2. Leer una línea nueva accesible — 8–9 min',
    '## 3. Escuchar sin seguir cada símbolo — 4–5 min',
    '## 4. Transformar sin cambiar el compás — 5 min',
    '## 5. AMPLIACIÓN — reagrupación interna sin cambio métrico — 3 min',
    '## 6. Diagnóstico y registro — 3 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 1);
  assert.match(markdown, /VER → CONTAR → CANTAR → TOCAR → ESCUCHAR/);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR \/ CONTINUAR \+ CORRECTIVO \/ REDUCIR NOVEDAD \/ DETENER CARGA/);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR A U6\.CP/);
  assert.match(markdown, /No se exige:[\s\S]*un BPM fijo o alto/);
  assert.match(markdown, /reconocimiento métrico general E5/);
  assert.match(markdown, /primera vista formal D5 — U9/);
  assert.match(markdown, /9\/8 o 12\/8 — U7/);
  assert.match(markdown, /sextillos — U8/);
  assert.match(markdown, /gaps de metrónomo — U10/);
  assert.match(markdown, /actualizar automáticamente D4, F2, E1, E2, G1 o G2/i);
  assert.doesNotMatch(markdown, /data-rhythm-dictation/);
});

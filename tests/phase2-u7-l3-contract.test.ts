import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u7-l3-simple-o-compuesto-justificar-la-jerarquia.md');
const score39Path = path.resolve('public/bateria/notation/f2/u7/f2-u7-l3-3-4-vs-9-8.musicxml');
const score412Path = path.resolve('public/bateria/notation/f2/u7/f2-u7-l3-4-4-vs-12-8.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function measureTotals(xml: string): number[] {
  return [...xml.matchAll(/<measure number="\d+">([\s\S]*?)<\/measure>/g)].map(([, body]) =>
    [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0),
  );
}

function noteCount(xml: string): number {
  return (xml.match(/<note>/g) ?? []).length;
}

test('Phase 2 U7 L3 keeps written simple-versus-compound hierarchy as the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u7-l3\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*7\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-7\s*$/m);
  assert.match(data, /^slug:\s*simple-o-compuesto-justificar-la-jerarquia\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*3\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D4', 'E1', 'E2', 'F2']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U7 L3`);
  }
  assert.doesNotMatch(competencies, /\bE5\b/);
  assert.doesNotMatch(competencies, /\bD5\b/);

  assert.match(markdown, /3\/4 = 3 pulsos × 2 subdivisiones/);
  assert.match(markdown, /9\/8 = 3 pulsos × 3 subdivisiones/);
  assert.match(markdown, /4\/4 = 4 pulsos × 2 subdivisiones/);
  assert.match(markdown, /12\/8 = 4 pulsos × 3 subdivisiones/);
  assert.match(markdown, /AGRUPACIÓN \/ REAGRUPACIÓN ≠ CAMBIO DE COMPÁS/);
  assert.match(markdown, /clasificación auditiva E5 se reserva deliberadamente para L4/i);
  assert.match(markdown, /LA PREGUNTA CENTRAL NO ES/);
  assert.match(markdown, /pulso principal \+ subdivisión/i);
});

test('Phase 2 U7 L3 MusicXML contrasts 3/4→9/8 and 4/4→12/8 with exact closure and ordinary eighths', async () => {
  const [score39, score412] = await Promise.all([readFile(score39Path, 'utf8'), readFile(score412Path, 'utf8')]);
  await Promise.all([access(score39Path), access(score412Path)]);

  assert.match(score39, /<time><beats>3<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score39, /<time><beats>9<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.deepEqual(measureTotals(score39), [36, 54]);
  assert.equal(noteCount(score39), 15);

  assert.match(score412, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score412, /<time><beats>12<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.deepEqual(measureTotals(score412), [48, 72]);
  assert.equal(noteCount(score412), 20);

  for (const score of [score39, score412]) {
    assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.equal((score.match(/<sound tempo="120"\/>/g) ?? []).length, 2);
    assert.match(score, /<metronome><beat-unit>quarter<\/beat-unit><per-minute>120<\/per-minute><\/metronome>/);
    assert.match(score, /<metronome><beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute><\/metronome>/);
    assert.doesNotMatch(score, /<rest\/>|<time-modification>|<tuplet\b|<actual-notes>|<normal-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b/);
    assert.equal((score.match(/<instrument id="P1-I1"\/>/g) ?? []).length, noteCount(score));
    assert.equal((score.match(/<notehead>normal<\/notehead>/g) ?? []).length, noteCount(score));
  }

  assert.equal((score39.match(/<beam number="1">begin<\/beam>/g) ?? []).length, 6);
  assert.equal((score39.match(/<beam number="1">continue<\/beam>/g) ?? []).length, 3);
  assert.equal((score39.match(/<beam number="1">end<\/beam>/g) ?? []).length, 6);

  assert.equal((score412.match(/<beam number="1">begin<\/beam>/g) ?? []).length, 8);
  assert.equal((score412.match(/<beam number="1">continue<\/beam>/g) ?? []).length, 4);
  assert.equal((score412.match(/<beam number="1">end<\/beam>/g) ?? []).length, 8);
});

test('Phase 2 U7 L3 preserves feedback gating, evaluation chain, and later-unit boundaries', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.match(markdown, /MusicXML — fuente del contraste 3\/4–9\/8/);
  assert.match(markdown, /MusicXML — fuente del contraste 4\/4–12\/8/);
  assert.match(markdown, /VER → CONTAR → CANTAR → TOCAR → EXPLICAR → ESCUCHAR/);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR[\s\S]*CONTINUAR \+ CORRECTIVO[\s\S]*REDUCIR NOVEDAD[\s\S]*DETENER CARGA/);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR A L4/);
  assert.match(markdown, /reconocimiento auditivo E5 general — empieza de forma controlada en L4/);
  assert.match(markdown, /primera vista formal D5 — U9/);
  assert.match(markdown, /sextillos — U8/);
  assert.match(markdown, /click reducido, half-time o gaps — U10/);
  assert.match(markdown, /un BPM fijo o alto/);
  assert.match(markdown, /actualizar automáticamente D4 o F2 a `FUNCIONAL`/);
});

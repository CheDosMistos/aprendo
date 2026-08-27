import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u5-l3-reorganizar-densidad.md');
const scorePath = path.resolve('public/bateria/notation/f2/u5/f2-u5-l3-2-3-4.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U5 L3 makes slow 2↔3↔4 reorganization the dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u5-l3\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*5\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-5\s*$/m);
  assert.match(data, /^slug:\s*2-3-4-reorganizar-densidad\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*3\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);
  assert.doesNotMatch(data.match(/^competencies:.*$/m)?.[0] ?? '', /\bD5\b/);

  for (const competency of ['C1', 'C2', 'C3', 'D1', 'D2', 'D3', 'F1', 'F2']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U5 L3`);
  }

  assert.match(markdown, /MÁS ATAQUES DENTRO DEL PULSO NO SIGNIFICA MÁS TEMPO/);
  assert.match(markdown, /encadenar `2 ↔ 3 ↔ 4` de forma lenta y consciente/i);
  assert.match(markdown, /2, 3 y 4 cambian el reparto interior; las tres opciones ocupan exactamente el mismo pulso/i);
  assert.match(markdown, /2 → 3 → 4 → 3/);
  assert.match(markdown, /reduce longitud o densidad antes de subir tempo/i);
  assert.match(markdown, /De bloques previsibles a cambios menos predecibles/);
});

test('Phase 2 U5 L3 MusicXML encodes 2, 3 and 4 subdivisions as equal quarter durations', async () => {
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
  assert.equal((score.match(relation) ?? []).length, 18);
  assert.equal((score.match(/<tuplet type="start"\/>/g) ?? []).length, 6);
  assert.equal((score.match(/<tuplet type="stop"\/>/g) ?? []).length, 6);
  assert.equal((score.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 10);
  assert.equal((score.match(/<duration>4<\/duration><type>eighth<\/type>/g) ?? []).length, 18);
  assert.equal((score.match(/<duration>3<\/duration><type>16th<\/type>/g) ?? []).length, 20);
  assert.doesNotMatch(score, /<actual-notes>6<\/actual-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b|<lyric\b/);

  const sounded = [...score.matchAll(/<note>([\s\S]*?)<\/note>/g)].filter(([, body]) => !body.includes('<rest/>'));
  assert.equal(sounded.length, 48);
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

test('Phase 2 U5 L3 preserves feedback-first practice, bilateral control and variable isolation', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperar 2 ↔ 3 — 3 min',
    '## 2. Añadir cuatro partes sin mover la negra — 5–6 min',
    '## 3. Leer 2 ↔ 3 ↔ 4 — 10–11 min',
    '## 4. De bloques previsibles a cambios menos predecibles — 5–6 min',
    '## 5. Registro y decisión — 2–3 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0);
  assert.match(markdown, /iniciando con derecha; después repite iniciando con izquierda/i);
  assert.match(markdown, /Subir el BPM simultáneamente impediría saber si el fallo proviene de la nueva densidad o del cambio de tempo/i);
  assert.match(markdown, /modifica una variable principal cada vez/i);
});

test('Phase 2 U5 L3 keeps progression multidimensional and later-unit boundaries explicit', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /BPM es condición, no competencia/i);
  assert.match(markdown, /no actualiza automáticamente C1, C2, C3, D3/i);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR A L4/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige:[\s\S]*un BPM concreto o alto/);
  assert.match(markdown, /sextillos[\s\S]*U8/i);
  assert.match(markdown, /6\/8[\s\S]*U6/i);
  assert.match(markdown, /click reducido ni gaps:[\s\S]*U10/i);
  assert.match(markdown, /primera vista formal D5/);
  assert.match(markdown, /OÍR → ESCRIBIR → LEER → TRANSFORMAR/);
});

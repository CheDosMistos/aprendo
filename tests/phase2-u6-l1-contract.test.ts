import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u6-overview.md');
const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u6-l1-dos-pulsos-tres-subdivisiones.md');
const scorePath = path.resolve('public/bateria/notation/f2/u6/f2-u6-l1-dos-pulsos-tres-subdivisiones.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U6 overview preserves the approved compound-meter architecture and boundaries', async () => {
  const overview = await readFile(overviewPath, 'utf8');
  const data = frontmatter(overview);

  assert.match(data, /^contentId:\s*bat-f2-u6-overview\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*6\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-6\s*$/m);
  assert.match(data, /^slug:\s*fase-2-unidad-6-introduccion\s*$/m);
  assert.match(data, /^kind:\s*unit\s*$/m);
  assert.match(data, /^order:\s*0\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D3', 'D4', 'F1', 'F2']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U6 overview`);
  }
  assert.doesNotMatch(competencies, /\bD5\b/);

  assert.match(overview, /6\/8, EN EL CASO PROTOTÍPICO DE ESTA UNIDAD, SE SIENTE COMO 2 PULSOS PRINCIPALES × 3 SUBDIVISIONES/);
  assert.match(overview, /6\/8 ≠ TRESILLO EN 4\/4/);
  assert.match(overview, /6\/8 ≠ 3\/4/);
  assert.match(overview, /AGRUPACIÓN ≠ COMPÁS/);
  assert.match(overview, /Dos pulsos, tres subdivisiones cada uno/);
  assert.match(overview, /Ataques y silencios dentro de 6\/8/);
  assert.match(overview, /3\/4 y 6\/8: misma cantidad escrita, distinta métrica/);
  assert.match(overview, /Leer, escuchar y reinterpretar sin confundir métrica/);
  assert.match(overview, /Puerta de 6\/8/);
  assert.match(overview, /9\/8 y 12\/8 — U7/);
  assert.match(overview, /sextillos y ornamentación escrita como vocabulario central — U8/);
  assert.match(overview, /primera vista formal D5 — U9/);
  assert.match(overview, /click reducido y gaps — U10/);
  assert.match(overview, /SENTIR 2×3 → LEER → SILENCIAR SIN PERDER → COMPARAR 3\/4↔6\/8 → ESCUCHAR\/EXPLICAR/);
});

test('Phase 2 U6 L1 makes real 6/8 as two compound beats the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u6-l1\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*6\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-6\s*$/m);
  assert.match(data, /^slug:\s*dos-pulsos-tres-subdivisiones-cada-uno\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*1\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D1', 'D3', 'D4', 'F1', 'F2']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U6 L1`);
  }
  assert.doesNotMatch(competencies, /\bD5\b/);

  assert.match(markdown, /6\/8 PROTOTÍPICO = 2 PULSOS PRINCIPALES × 3 SUBDIVISIONES/);
  assert.match(markdown, /1-la-li \| 2-la-li/);
  assert.match(markdown, /U5 — tresillo en 4\/4:[\s\S]*relación `3:2`/);
  assert.match(markdown, /U6 — corcheas en 6\/8:[\s\S]*no necesitan relación `3:2`/);
  assert.match(markdown, /COMPÁS 6\/8 → 2 PULSOS PRINCIPALES → 3 CORCHEAS POR PULSO/);
  assert.match(markdown, /Los silencios internos serán L2/);
  assert.match(markdown, /comparación sistemática 3\/4↔6\/8 será L3/);
  assert.match(markdown, /transformación y transferencia amplia serán L4/);
});

test('Phase 2 U6 L1 MusicXML encodes real 6/8 with ordinary eighth notes and exact measure closure', async () => {
  const score = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<divisions>12<\/divisions>/);
  assert.match(score, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.doesNotMatch(score, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score, /<metronome><beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute><\/metronome>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /<midi-channel>10<\/midi-channel>/);
  assert.match(score, /<midi-unpitched>39<\/midi-unpitched>/);

  assert.equal((score.match(/<duration>18<\/duration><type>quarter<\/type><dot\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 12);
  assert.equal((score.match(/<beam number="1">begin<\/beam>/g) ?? []).length, 4);
  assert.equal((score.match(/<beam number="1">continue<\/beam>/g) ?? []).length, 4);
  assert.equal((score.match(/<beam number="1">end<\/beam>/g) ?? []).length, 4);
  assert.doesNotMatch(score, /<time-modification>|<tuplet\b|<actual-notes>|<normal-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b/);

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

test('Phase 2 U6 L1 preserves feedback-first study, explicit metronome unit and multidimensional evaluation', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Del tresillo al compás compuesto — 4 min',
    '## 2. Qué significa 6/8 aquí — 5 min',
    '## 3. Leer la jerarquía 2×3 — 10–12 min',
    '## 4. Pulso principal y bilateralidad — 4–5 min',
    '## 5. Metrónomo: la unidad importa — 3 min',
    '## 6. Registro — 2 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 1);
  assert.match(markdown, /VER → CONTAR → CANTAR → TOCAR → ESCUCHAR/);
  assert.match(markdown, /♩\. = 80/);
  assert.match(markdown, /♩\. = 54/);
  assert.match(markdown, /80 pulsos principales de negra con puntillo por minuto/);
  assert.match(markdown, /<sound tempo="120"\/>/);
  assert.match(markdown, /ni una velocidad prescrita para practicar/i);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR A L2/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige:[\s\S]*un BPM fijo o alto/);
  assert.match(markdown, /9\/8 o 12\/8/);
  assert.match(markdown, /primera vista formal D5/);
  assert.match(markdown, /actualizar automáticamente D4 o F2/i);
  assert.doesNotMatch(markdown, /data-rhythm-dictation/);
});

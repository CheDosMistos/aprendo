import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u5-l1-tres-partes-mismo-pulso.md');
const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u5-overview.md');
const scorePath = path.resolve('public/bateria/notation/f2/u5/f2-u5-l1-tres-partes.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U5 overview preserves the approved architecture and conceptual boundaries', async () => {
  const overview = await readFile(overviewPath, 'utf8');
  const data = frontmatter(overview);

  assert.match(data, /^contentId:\s*bat-f2-u5-overview\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*5\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-5\s*$/m);
  assert.match(data, /^kind:\s*unit\s*$/m);
  assert.match(data, /^order:\s*0\s*$/m);
  for (const competency of ['C1', 'C2', 'C3', 'D3']) assert.match(data, new RegExp(`\\b${competency}\\b`));

  assert.match(overview, /EL PULSO CONTINÚA; LO QUE CAMBIA ES CÓMO ORGANIZAS SU INTERIOR/);
  assert.match(overview, /TRESILLO EN 4\/4:[\s\S]*No convierte 4\/4 en 6\/8/i);
  assert.match(overview, /CAMBIO DE SUBDIVISIÓN[\s\S]*CAMBIO DE TEMPO/i);
  assert.match(overview, /Tres partes dentro del mismo pulso/);
  assert.match(overview, /Binario ↔ ternario: el pulso no se mueve/);
  assert.match(overview, /2 ↔ 3 ↔ 4: reorganizar densidad/);
  assert.match(overview, /Oír, escribir y transferir 2–3–4/);
  assert.match(overview, /Puerta de reorganización del pulso/);
  assert.match(overview, /6\/8 como organización métrica compuesta — U6/);
  assert.match(overview, /primera vista formal D5 — U9/);
  assert.match(overview, /click reducido y gaps — U10/);
  assert.match(overview, /SENTIR\/CANTAR → LEER → CAMBIAR → ESCUCHAR → ESCRIBIR\/TRANSFORMAR/);
});

test('Phase 2 U5 L1 makes elementary ternary subdivision in 4/4 the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u5-l1\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*5\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-5\s*$/m);
  assert.match(data, /^slug:\s*tres-partes-dentro-del-mismo-pulso\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*1\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);
  assert.doesNotMatch(data.match(/^competencies:.*$/m)?.[0] ?? '', /\bD5\b/);

  for (const competency of ['C1', 'C2', 'D1', 'D2', 'D3', 'F1', 'F2']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U5 L1`);
  }

  assert.match(markdown, /TRES NOTAS DENTRO DEL PULSO NO SON TRES PULSOS/);
  assert.match(markdown, /No vamos a entrenar todavía cambios 2↔3 como tarea central/i);
  assert.match(markdown, /Tresillo en 4\/4 = tuplet dentro de métrica simple\. No convierte el compás en 6\/8/i);
  assert.match(markdown, /tres partes iguales en el espacio que normalmente ocuparían dos corcheas/i);
  assert.match(markdown, /pulso ≠ cada nota del tresillo/i);
  assert.match(markdown, /R L R \| L R L \| R L R \| L R L/);
  assert.match(markdown, /L R L \| R L R \| L R L \| R L R/);
  assert.match(markdown, /No introduzcas todavía secuencias sistemáticas 2↔3, 2↔3↔4 ni 6\/8/i);
});

test('Phase 2 U5 L1 MusicXML encodes real 3:2 eighth-note triplets and closes every 4/4 measure', async () => {
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

  const tripletRelation = /<time-modification><actual-notes>3<\/actual-notes><normal-notes>2<\/normal-notes><\/time-modification>/g;
  assert.equal((score.match(tripletRelation) ?? []).length, 36);
  assert.equal((score.match(/<tuplet type="start"\/>/g) ?? []).length, 12);
  assert.equal((score.match(/<tuplet type="stop"\/>/g) ?? []).length, 12);
  assert.equal((score.match(/<duration>4<\/duration><type>eighth<\/type>/g) ?? []).length, 36);
  assert.equal((score.match(/<duration>12<\/duration><type>quarter<\/type>/g) ?? []).length, 4);
  assert.doesNotMatch(score, /<actual-notes>6<\/actual-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b/);

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

test('Phase 2 U5 L1 preserves feedback-first study, evaluation semantics and later-unit boundaries', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperar el pulso — 3 min',
    '## 2. Sentir y cantar tres partes — 5–6 min',
    '## 3. Leer tresillos en 4/4 — 10–12 min',
    '## 4. Bilateralidad e igualdad temporal — 5–6 min',
    '## 5. Registro — 2 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 1);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR A L2/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige:[\s\S]*un BPM concreto o alto/);
  assert.match(markdown, /actualizar automáticamente C2 o D3/i);
  assert.match(markdown, /6\/8 —eso será U6/i);
  assert.match(markdown, /primera vista formal D5/i);
});

import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u6-l2-ataques-silencios.md');
const scorePath = path.resolve('public/bateria/notation/f2/u6/f2-u6-l2-ataques-silencios.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function measureAttackPattern(body: string): string {
  return [...body.matchAll(/<note>([\s\S]*?)<\/note>/g)]
    .map((match) => (match[1]?.includes('<rest/>') ? '.' : 'X'))
    .join('');
}

test('Phase 2 U6 L2 keeps attacks and rests inside established 6/8 as the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u6-l2\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*6\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-6\s*$/m);
  assert.match(data, /^slug:\s*ataques-y-silencios-dentro-de-6-8\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*2\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D1', 'D3', 'D4', 'F1', 'F2']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U6 L2`);
  }
  assert.doesNotMatch(competencies, /\bD5\b/);

  assert.match(markdown, /UN SILENCIO OCUPA TIEMPO\. NO BORRA EL PULSO NI LA POSICIÓN QUE OCUPA/);
  assert.match(markdown, /algunas posiciones internas dejan de sonar/i);
  assert.match(markdown, /comparación sistemática `3\/4 ↔ 6\/8` sigue reservada para L3/i);
  assert.match(markdown, /ATAQUE:[\s\S]*SILENCIO:[\s\S]*PÉRDIDA DE REJILLA:/);
  assert.match(markdown, /silencio al inicio del segundo pulso/i);
});

test('Phase 2 U6 L2 score is exact 6/8 eighth-note attack/rest material with no tuplet or later-layer notation', async () => {
  const score = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<divisions>12<\/divisions>/);
  assert.match(score, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.match(score, /<metronome><beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute><\/metronome>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /<midi-channel>10<\/midi-channel>/);
  assert.match(score, /<midi-unpitched>39<\/midi-unpitched>/);

  assert.equal((score.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 24);
  assert.equal((score.match(/<rest\/>/g) ?? []).length, 6);
  assert.equal((score.match(/<unpitched>/g) ?? []).length, 18);
  assert.equal((score.match(/<beam number="1">begin<\/beam>/g) ?? []).length, 6);
  assert.equal((score.match(/<beam number="1">continue<\/beam>/g) ?? []).length, 2);
  assert.equal((score.match(/<beam number="1">end<\/beam>/g) ?? []).length, 6);

  assert.doesNotMatch(score, /<time-modification>|<tuplet\b|<actual-notes>|<normal-notes>|<tie\b|<tied\b|<accent\b|<strong-accent\b|<dynamics\b|<lyric\b/);
  assert.doesNotMatch(score, /<time><beats>3<\/beats><beat-type>4<\/beat-type><\/time>/);

  const sounded = [...score.matchAll(/<note>([\s\S]*?)<\/note>/g)].filter(([, body]) => !body.includes('<rest/>'));
  assert.equal(sounded.length, 18);
  for (const [, body] of sounded) {
    assert.match(body, /<instrument id="P1-I1"\/>/);
    assert.match(body, /<notehead>normal<\/notehead>/);
  }

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  assert.deepEqual(measures.map(([, , body]) => measureAttackPattern(body)), [
    'XXXXXX',
    'XX.XX.',
    '.XXX.X',
    'X.X.XX',
  ]);

  for (const [, number, body] of measures) {
    const total = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(total, 36, `Measure ${number} must fill exactly 6/8 at divisions=12`);
  }
});

test('Phase 2 U6 L2 preserves feedback-first reading and explicitly diagnoses continuity layers', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación: seis posiciones, dos pulsos — 3 min',
    '## 2. Qué debe continuar durante un silencio — 4 min',
    '## 3. Leer ataques y silencios sin perder 2×3 — 10–12 min',
    '## 4. Continuidad a través del silencio — 5 min',
    '## 5. Diagnóstico: ¿qué se perdió? — 3 min',
    '## 6. Registro y siguiente acción — 2 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 1);
  assert.match(markdown, /VER → CONTAR → CANTAR → TOCAR → ESCUCHAR/);
  assert.match(markdown, /Error de ataque/);
  assert.match(markdown, /Error de subdivisión/);
  assert.match(markdown, /Pérdida del pulso compuesto/);
  assert.match(markdown, /Error de representación/);
  assert.match(markdown, /continuidad.*precisión local/i);
  assert.match(markdown, /<sound tempo="120"\/>/);
  assert.match(markdown, /equivalente aquí a `♩\. = 80`/);
  assert.match(markdown, /no.*tempo obligatorio de práctica ni un criterio de avance/i);
  assert.doesNotMatch(markdown, /data-rhythm-dictation/);
});

test('Phase 2 U6 L2 advancement stays multidimensional and protects L3 plus later-unit novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR/);
  assert.match(markdown, /CONTINUAR \+ CORRECTIVO/);
  assert.match(markdown, /REDUCIR NOVEDAD/);
  assert.match(markdown, /DETENER CARGA/);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR A L3/);
  assert.match(markdown, /silencio en la primera subdivisión de un pulso sin concluir que ese pulso ha desaparecido/i);
  assert.match(markdown, /distingues un error de ataque de una pérdida de subdivisión/i);
  assert.match(markdown, /pérdida de subdivisión de una pérdida del marco `2×3`/i);
  assert.match(markdown, /No se exige:[\s\S]*un BPM fijo o alto/);
  assert.match(markdown, /comparación funcional `3\/4 ↔ 6\/8` — L3/);
  assert.match(markdown, /9\/8 o 12\/8 — U7/);
  assert.match(markdown, /sextillos — U8/);
  assert.match(markdown, /primera vista formal D5 — U9/);
  assert.match(markdown, /gaps de metrónomo — U10/);
  assert.match(markdown, /actualizar automáticamente C1, C2, D4 o F2/i);
  assert.match(markdown, /Esto es \*\*agrupación\/variación interna dentro del mismo compás\*\*, no cambio métrico/);
});

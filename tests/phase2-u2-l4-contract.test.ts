import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const lessonPath = path.join(root, 'src/courses/bateria/content/pages/f2-u2-l4-doubles-diddles.md');
const scorePath = path.join(root, 'public/bateria/notation/f2/u2/f2-u2-linea-doubles-diddles.musicxml');
const lesson = fs.readFileSync(lessonPath, 'utf8');
const score = fs.readFileSync(scorePath, 'utf8');

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

test('Phase 2 U2 L4 keeps the approved B7 application scope', () => {
  assert.match(lesson, /contentId: bat-f2-u2-l4/);
  assert.match(lesson, /order: 4/);
  assert.match(lesson, /title: Doubles\/diddles sin alterar la línea/);
  assert.match(lesson, /competencies: \[A1, A2, B1, B2, B7, C1, C2, D1, F1, K2, K4, K6\]/);
  assert.match(lesson, /rudiments: \[\]/);

  assert.match(lesson, /La línea rítmica manda\. El sticking puede cambiar; las posiciones temporales no/);
  assert.match(lesson, /No enseña ni reconstruye un rudimento PAS concreto/);
  assert.match(lesson, /dos ataques consecutivos que ya existen en la partitura/);
  assert.match(lesson, /no duplica un ataque único/);
  assert.match(lesson, /no declara B7 FUNCIONAL de forma global/);
});

test('Phase 2 U2 L4 preserves the approved practice blocks and advanced grouping boundary', () => {
  assert.match(lesson, /## 1\. Recuperación — 3 min/);
  assert.match(lesson, /## 2\. Decodificación base — 5–6 min/);
  assert.match(lesson, /## 3\. Aplicación — 8–9 min/);
  assert.match(lesson, /## 4\. Transferencia — 4–5 min/);
  assert.match(lesson, /## Ventana AVANZADO opcional — 0–3 min/);
  assert.match(lesson, /## 5\. Registro — 2 min/);

  assert.match(lesson, /`5 \+ 5 \+ 6`/);
  assert.match(lesson, /agrupación interna mediante acentos/);
  assert.match(lesson, /no es 5\/4/);
  assert.match(lesson, /no es 5\/8/);
  assert.match(lesson, /no es polimetría/);
  assert.match(lesson, /no es modulación métrica/);
});

test('Phase 2 U2 L4 embeds protected recovery and the original application score', () => {
  assert.match(
    lesson,
    /data-score-src="\/bateria\/notation\/f2\/u2\/f2-u2-cambio-2-a-4-silencios\.musicxml"[^>]*data-score-feedback="after-attempt"/,
  );
  assert.match(lesson, /data-score-src="\/bateria\/notation\/f2\/u2\/f2-u2-linea-doubles-diddles\.musicxml"/);
  assert.match(lesson, /data-score-source-url="\/bateria\/notation\/f2\/u2\/f2-u2-linea-doubles-diddles\.musicxml"/);
  assert.equal(occurrences(lesson, 'data-notation-score'), 2);
  assert.equal(occurrences(lesson, 'data-rhythm-dictation'), 0);
});

test('Phase 2 U2 L4 MusicXML is original, complete 4/4 percussion notation with compatible attack pairs', () => {
  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(score, /<staff-lines>5<\/staff-lines>/);
  assert.match(score, /<sign>percussion<\/sign>/);
  assert.match(score, /<type>16th<\/type>/);
  assert.match(score, /<rest\/>/);
  assert.doesNotMatch(score, /<tie\b|<tied\b|<dot\s*\/>|<time-modification>|<tuplet\b/);

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const durations = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].map((match) => Number(match[1]));
    assert.equal(durations.reduce((sum, value) => sum + value, 0), 16, `measure ${number} must fill exactly 4/4`);

    const noteBodies = [...body.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((match) => match[1]);
    const attacks = noteBodies.map((noteBody) => !noteBody.includes('<rest/>'));
    const hasCompatiblePair = attacks.some((attack, index) => attack && attacks[index + 1] === true);
    assert.equal(hasCompatiblePair, true, `measure ${number} must contain at least one consecutive written attack pair for RR/LL application`);
  }
});

test('Phase 2 U2 L4 keeps evaluation multidimensional and points to the U2 checkpoint', () => {
  for (const label of ['**INFERENCIA:**', '**EVIDENCIA:**', '**TAREA:**', '**CONDICIONES:**', '**DECISIÓN:**']) {
    assert.ok(lesson.includes(label), `missing evaluation label ${label}`);
  }
  assert.match(lesson, /No se exige un BPM concreto, usar muchos doubles ni convertir toda la línea a un sticking complejo/);
  assert.match(lesson, /checkpoint de U2 — Puerta de semicorcheas y silencios/);
  assert.match(lesson, /no una exhibición de sticking complejo/);
});

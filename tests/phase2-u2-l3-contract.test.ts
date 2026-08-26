import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const lessonPath = path.join(root, 'src/courses/bateria/content/pages/f2-u2-l3-oir-imitar-escribir.md');
const lesson = fs.readFileSync(lessonPath, 'utf8');

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

test('Phase 2 U2 L3 keeps the approved hearing-writing scope', () => {
  assert.match(lesson, /contentId: bat-f2-u2-l3/);
  assert.match(lesson, /phase: 2/);
  assert.match(lesson, /unit: 2/);
  assert.match(lesson, /order: 3/);
  assert.match(lesson, /title: Oír, imitar y escribir la rejilla/);
  assert.match(lesson, /competencies: \[C1, C2, D1, D6, E2, E3, E4, F1, K2, K4, K5, K6\]/);
  assert.match(lesson, /rudiments: \[\]/);
  assert.doesNotMatch(lesson, /competencies: \[[^\]]*B7/);

  assert.match(lesson, /## 1\. Recuperación — 3 min/);
  assert.match(lesson, /## 2\. OÍR → IMITAR — 6–7 min/);
  assert.match(lesson, /## 3\. IMITAR → ESCRIBIR — 6–7 min/);
  assert.match(lesson, /## 4\. ESCRIBIR → TOCAR — 5–6 min/);
  assert.match(lesson, /## 5\. Registro — 2 min/);

  assert.match(lesson, /No se contará como evidencia de oído acertar después de haber visto previamente la respuesta escrita/);
  assert.match(lesson, /posiciones, ataques, silencios y duración total/);
  assert.match(lesson, /no es el criterio/);
  assert.match(lesson, /no declara E4 FUNCIONAL de forma global/);
  assert.match(lesson, /U3 conserva `ataque ≠ duración`, ligaduras, puntillos y síncopa estructurada/);
});

test('Phase 2 U2 L3 protects recovery playback and uses four hidden-answer dictations at subdivision 4', () => {
  assert.match(
    lesson,
    /data-score-src="\/bateria\/notation\/f2\/u2\/f2-u2-cambio-2-a-4-silencios\.musicxml"[^>]*data-score-feedback="after-attempt"/,
  );
  assert.match(lesson, /data-score-source-url="\/bateria\/notation\/f2\/u2\/f2-u2-cambio-2-a-4-silencios\.musicxml"/);

  assert.equal(occurrences(lesson, 'data-rhythm-dictation'), 4);
  assert.equal(occurrences(lesson, 'data-subdivision="4"'), 4);
  assert.equal(occurrences(lesson, 'data-answer='), 4);

  for (const pattern of ['1011', '0110', '11001010', '01011001']) {
    assert.match(lesson, new RegExp(`data-pattern="${pattern}"`));
    assert.match(pattern, /^[01]+$/);
    assert.ok(pattern.length === 4 || pattern.length === 8);
  }

  const firstDictation = lesson.indexOf('data-pattern="1011"');
  const firstAnswerText = lesson.indexOf('X · X X — un pulso');
  assert.ok(firstDictation >= 0 && firstAnswerText > firstDictation, 'the first written answer must live inside/after the dictation declaration');
});

test('Phase 2 U2 L3 keeps the approved evidence chain and advancement criteria multidimensional', () => {
  for (const label of ['**INFERENCIA:**', '**EVIDENCIA:**', '**TAREA:**', '**CONDICIONES:**', '**DECISIÓN:**']) {
    assert.ok(lesson.includes(label), `missing evaluation label ${label}`);
  }

  assert.match(lesson, /`CONTINUAR`, `CONTINUAR \+ CORRECTIVO`, `REDUCIR NOVEDAD` o `DETENER CARGA`/);
  assert.match(lesson, /No se exige un BPM concreto, caligrafía perfecta ni acertar todas las células a la primera/);
  assert.match(lesson, /variable limitante principal: oído, memoria, escritura, ejecución, pulso, subdivisión o carga/);
  assert.match(lesson, /auditivo:/);
  assert.match(lesson, /memoria:/);
  assert.match(lesson, /escritura:/);
  assert.match(lesson, /ejecución:/);
});

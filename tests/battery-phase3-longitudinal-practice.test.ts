import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('phase 3 unit overviews expose a bounded longitudinal practice layer', () => {
  const page = read('src/pages/bateria/[unit]/index.astro');
  const guide = read('src/courses/bateria/components/Phase3LongitudinalPractice.astro');

  assert.match(page, /Phase3LongitudinalPractice/);
  assert.match(page, /entry\.data\.phase === 3/);
  assert.match(guide, /Esto no añade otro bloque de práctica/);
  assert.match(guide, /25–30 minutos, 3–4 días por semana/);
  assert.match(guide, /Sustituir, no añadir/);
});

test('phase 3 keeps inherited work selective instead of creating daily review debt', () => {
  const guide = read('src/courses/bateria/components/Phase3LongitudinalPractice.astro');

  assert.match(guide, /No mantengas lectura, técnica, rudimentos, oído y creatividad como cinco deberes diarios/);
  assert.match(guide, /sólo vuelve si limita la tarea, necesita comprobarse después de un tiempo o puede transferirse/);
  assert.match(guide, /Si no existe una pregunta útil, no programes una revisión por obligación/);
});

test('phase 3 embeds motor and literacy transfer inside current musical material', () => {
  const guide = read('src/courses/bateria/components/Phase3LongitudinalPractice.astro');

  assert.match(guide, /otra mano líder, una dinámica distinta, un acento, un rudimento conocido, otra subdivisión o una referencia temporal menos explícita/);
  assert.match(guide, /la técnica sirve a la música en vez de competir con ella/);
  assert.match(guide, /recuperación/);
  assert.match(guide, /transferencia/);
});

test('phase 3 uses readable learner language for longitudinal decisions', () => {
  const guide = read('src/courses/bateria/components/Phase3LongitudinalPractice.astro');

  assert.doesNotMatch(guide, /\b[A-K][1-9]\b/);
  assert.doesNotMatch(guide, /\bOBS\b|\bHIP\b|\bAPROX\b|\bDUDA\b/);
  assert.match(guide, /dificultad concreta/);
  assert.match(guide, /qué merece reaparecer/);
  assert.match(guide, /Tempo de calidad/);
});

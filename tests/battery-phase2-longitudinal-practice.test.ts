import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('phase 2 unit overviews expose one bounded longitudinal practice layer', () => {
  const page = read('src/pages/bateria/[unit]/index.astro');
  const guide = read('src/courses/bateria/components/Phase2LongitudinalPractice.astro');

  assert.match(page, /Phase2LongitudinalPractice/);
  assert.match(page, /entry\.data\.phase === 2/);
  assert.match(page, /unit=\{entry\.data\.unit\}/);
  assert.match(guide, /Esto no añade un bloque extra/);
  assert.match(guide, /25–30 minutos, 3–4 días por semana/);
  assert.match(guide, /recuperar técnica o PAS anteriores sustituye parte del trabajo secundario/);
});

test('phase 2 keeps reading central while preserving inherited motor capacities', () => {
  const guide = read('src/courses/bateria/components/Phase2LongitudinalPractice.astro');

  assert.match(guide, /La lectura, el pulso y la subdivisión mandan/);
  assert.match(guide, /VER → CONTAR\/CANTAR → TOCAR → ESCUCHAR → ESCRIBIR/);
  assert.match(guide, /PAS CONOCIDO no significa capacidad motora dominada/);
  assert.match(guide, /Relajación, rebote, singles\/doubles, alturas, dinámica, bilateralidad, grace notes y continuidad de rolls/);
  assert.match(guide, /no repases todas por obligación/);
});

test('phase 2 rotates PAS retrieval from saved evidence instead of creating a review debt', () => {
  const guide = read('src/courses/bateria/components/Phase2LongitudinalPractice.astro');

  assert.match(guide, /Los 40 PAS de Fase 1 son vocabulario disponible, no cuarenta deberes permanentes/);
  assert.match(guide, /api\/progress\/skills\/\?courseId=bateria&skillType=rudiment/);
  assert.match(guide, /correctivo o variable limitante activa/);
  assert.match(guide, /retención todavía no comprobada/);
  assert.match(guide, /updatedAt/);
  assert.match(guide, /La muestra sirve para elegir, no para crear deuda/);
});

test('phase 2 longitudinal layer protects transfer, quality tempo and progressive click withdrawal', () => {
  const guide = read('src/courses/bateria/components/Phase2LongitudinalPractice.astro');

  assert.match(guide, /No confundas rendimiento después de repetir con aprendizaje/);
  assert.match(guide, /otra mano líder, dinámica, subdivisión, tempo cómodo o una línea nueva/);
  assert.match(guide, /Tempo de calidad/);
  assert.match(guide, /duración es evidencia contextual, no una cuota universal/);
  assert.match(guide, /click reducido o gaps de Unidad 10 no se adelantan por calendario/);
  assert.match(guide, /Un correctivo antiguo entra sustituyendo otra tarea/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const guidePath = path.resolve('src/courses/bateria/components/Phase4LongitudinalPractice.astro');
const indexPath = path.resolve('src/pages/bateria/[unit]/index.astro');

test('F4 overviews expose one bounded longitudinal layer', async () => {
  const [guide, index] = await Promise.all([readFile(guidePath, 'utf8'), readFile(indexPath, 'utf8')]);
  assert.match(index, /Phase4LongitudinalPractice/);
  assert.match(index, /entry\.data\.phase === 4/);
  assert.match(guide, /no añade otro bloque de práctica/i);
  assert.match(guide, /25–30 min, 3–4 días por semana/i);
  assert.match(guide, /Sustituir, no añadir/i);
});

test('F4 does not turn inherited capacities into daily review debt', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /siete deberes diarios/i);
  assert.match(guide, /limita la tarea.*comprobación posterior.*transferencia real/is);
  assert.match(guide, /no programes el repaso por obligación/i);
  assert.match(guide, /Una capacidad estable sale de prioridad/i);
});

test('F4 transfers pad skills into kit context before isolating', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /frase de pad.*caja.*superficies.*bombo.*pie izquierdo.*groove/is);
  assert.match(guide, /vuelve pronto al contexto completo/i);
  assert.match(guide, /Kit ≠ abandonar pad/i);
});

test('F4 longitudinal practice makes physical and hearing load part of session decisions', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /fatiga que degrada claramente control, sonido,\s*equilibrio o relajación/i);
  assert.match(guide, /reduce novedad o volumen/i);
  assert.match(guide, /Dolor persistente, hormigueo, entumecimiento o pérdida de fuerza\/control/i);
  assert.match(guide, /sostenibilidad física y auditiva tiene prioridad/i);
});

test('F4 learner-facing longitudinal language avoids internal competency codes', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.doesNotMatch(guide, /(?<![\p{L}\p{N}])(?:H[1-9]|K[1-9]|A[1-9]|B[1-9]|C[1-9]|D[1-9]|E[1-9]|F[1-9]|G[1-9]|J[1-9])(?![\p{L}\p{N}])/u);
  assert.match(guide, /prioridad dominante/i);
  assert.match(guide, /pregunta diagnóstica o musical útil/i);
  assert.match(guide, /Tempo de calidad/i);
});

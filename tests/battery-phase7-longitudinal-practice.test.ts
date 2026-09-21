import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const guidePath = path.resolve('src/courses/bateria/components/Phase7LongitudinalPractice.astro');
const indexPath = path.resolve('src/pages/bateria/[unit]/index.astro');
const u9CheckPath = path.resolve('src/courses/bateria/content/pages/f7-u9-checkpoint-7i.md');

test('F7 exposes one bounded longitudinal layer only on phase 7 overviews', async () => {
  const [guide, index] = await Promise.all([readFile(guidePath, 'utf8'), readFile(indexPath, 'utf8')]);
  assert.match(index, /Phase7LongitudinalPractice/);
  assert.match(index, /entry\.data\.phase === 7/);
  assert.match(guide, /no añade otro bloque de práctica/i);
  assert.match(guide, /25–30 min, 3–4 días por semana/i);
  assert.match(guide, /Sustituir, no añadir/i);
});

test('F7 sequence protects dependencies without creating nine permanent routines', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /Secuencia de profundidad ≠ nueve rutinas/i);
  assert.match(guide, /sale de la prioridad dominante/i);
  assert.match(guide, /Puerta relevante, no lista completa/i);
  assert.match(guide, /no exige practicar todos los recursos de la fase cada semana/i);
});

test('F7 keeps advanced-rhythm terminology distinct', async () => {
  const guide = await readFile(guidePath, 'utf8');
  for (const term of ['Agrupación','compás irregular','tuplet','desplazamiento','ciclo que cruza compases','polirritmia','polimetría','modulación métrica']) {
    assert.match(guide, new RegExp(term, 'i'));
  }
});

test('F7 Hito 8 uses selected resources rather than an eight-technique maintenance debt', async () => {
  const [guide, checkpoint] = await Promise.all([readFile(guidePath, 'utf8'), readFile(u9CheckPath, 'utf8')]);
  assert.match(guide, /Hito 8 no exige ocho técnicas simultáneas/i);
  assert.match(checkpoint, /no es un examen acumulativo de ocho técnicas ni una lista de ocho rutinas de mantenimiento/i);
  assert.match(checkpoint, /mapa de estado/i);
  assert.match(checkpoint, /salen de la prioridad dominante/i);
});

test('F7 learner-facing longitudinal language avoids internal competency codes', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.doesNotMatch(guide, /(?<![\p{L}\p{N}])(?:J[1-9]|H[1-9]|K[1-9]|C[1-9]|D[1-9]|F[1-9]|G[1-9])(?![\p{L}\p{N}])/u);
});

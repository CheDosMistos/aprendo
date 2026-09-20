import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const guidePath = path.resolve('src/courses/bateria/components/Phase5LongitudinalPractice.astro');
const indexPath = path.resolve('src/pages/bateria/[unit]/index.astro');

test('F5 overviews expose one bounded longitudinal layer', async () => {
  const [guide, index] = await Promise.all([readFile(guidePath, 'utf8'), readFile(indexPath, 'utf8')]);
  assert.match(index, /Phase5LongitudinalPractice/);
  assert.match(index, /entry\.data\.phase === 5/);
  assert.match(guide, /no añade otro bloque de práctica/i);
  assert.match(guide, /25–30 min, 3–4 días por semana/i);
  assert.match(guide, /Sustituir, no añadir/i);
});

test('F5 makes the current musical task dominant without creating review debt', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /La pieza o tarea musical manda/i);
  assert.match(guide, /No conviertas cada capacidad ni cada estilo conocido en un deber diario separado/i);
  assert.match(guide, /limita la tarea actual.*intervalo sin ensayo inmediato.*transferencia útil/is);
  assert.match(guide, /Una capacidad estable sale de prioridad/i);
});

test('F5 does not turn style windows into permanent maintenance routines', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /Estilo nuevo ≠ rutina nueva permanente/i);
  assert.match(guide, /shuffle, reggae, jazz, samba, lenguaje afro-cubano o métrica irregular/i);
  assert.match(guide, /no crea automáticamente seis rutinas de mantenimiento/i);
  assert.match(guide, /pregunta diagnóstica/i);
});

test('F5 separates didactic listening from practice repertoire and prices repertoire cost', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /Audición didáctica ≠ repertorio de práctica/i);
  for (const term of ['tempo', 'feel', 'compás', 'coordinación', 'dinámica', 'continuidad', 'duración', 'forma', 'memoria', 'recursos legales']) {
    assert.match(guide, new RegExp(term, 'i'));
  }
});

test('F5 correctives substitute work and return to integrated evidence', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /sustituya una tarea secundaria/i);
  assert.match(guide, /vuelve pronto al contexto musical completo/i);
  assert.match(guide, /evidencia integrada.*sin obligarte a recertificarlas por separado/is);
  assert.match(guide, /Tempo de calidad/i);
  assert.match(guide, /sostenibilidad física y auditiva tiene prioridad/i);
});

test('F5 learner-facing longitudinal language avoids internal competency codes', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.doesNotMatch(guide, /(?<![\p{L}\p{N}])(?:H[1-9]|K[1-9]|A[1-9]|B[1-9]|C[1-9]|D[1-9]|E[1-9]|F[1-9]|G[1-9]|J[1-9])(?![\p{L}\p{N}])/u);
  assert.match(guide, /pieza, forma o función dominante/i);
  assert.match(guide, /Variar con propósito/i);
});

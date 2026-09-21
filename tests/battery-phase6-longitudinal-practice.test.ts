import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const guidePath = path.resolve('src/courses/bateria/components/Phase6LongitudinalPractice.astro');
const indexPath = path.resolve('src/pages/bateria/[unit]/index.astro');

test('F6 overviews expose one bounded longitudinal layer', async () => {
  const [guide, index] = await Promise.all([readFile(guidePath, 'utf8'), readFile(indexPath, 'utf8')]);
  assert.match(index, /Phase6LongitudinalPractice/);
  assert.match(index, /entry\.data\.phase === 6/);
  assert.match(guide, /no añade otro bloque de práctica/i);
  assert.match(guide, /25–30 min, 3–4 días por semana/i);
  assert.match(guide, /Sustituir, no añadir/i);
});

test('F6 makes the current project dominant without accumulating advanced-skill debt', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /El proyecto musical manda/i);
  assert.match(guide, /No conviertas cada competencia estudiada en un deber diario separado/i);
  assert.match(guide, /Portafolio ≠ cuatro rutinas simultáneas/i);
  assert.match(guide, /no obligan a practicar cuatro bloques en cada sesión/i);
});

test('F6 defines autonomy as evidence-based choice and revision, not absence of help', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /Autonomía ≠ practicar sin ayuda/i);
  assert.match(guide, /elegir recursos, ayudas, orden de trabajo y correctivos/i);
  assert.match(guide, /cambiar el plan cuando la evidencia lo contradice/i);
});

test('F6 keeps methods subordinate to diagnosed musical needs', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /Métodos y recursos: resolver, no coleccionar/i);
  assert.match(guide, /cuello de botella concreto/i);
  assert.match(guide, /sustituye una tarea secundaria/i);
  assert.match(guide, /volver pronto a la música/i);
});

test('F6 protects retention and transfer from pseudo-precise calendars', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.match(guide, /Retención ≠ preparación inmediata/i);
  assert.match(guide, /no fija un intervalo universal de horas o días/i);
  assert.match(guide, /Evidencia integrada/i);
  assert.match(guide, /Incertidumbre explícita/i);
  assert.match(guide, /Tempo de calidad y carga sostenible/i);
});

test('F6 learner-facing longitudinal language avoids internal competency codes', async () => {
  const guide = await readFile(guidePath, 'utf8');
  assert.doesNotMatch(guide, /(?<![\p{L}\p{N}])(?:H[1-9]|K[1-9]|A[1-9]|B[1-9]|C[1-9]|D[1-9]|E[1-9]|F[1-9]|G[1-9]|J[1-9])(?![\p{L}\p{N}])/u);
  assert.match(guide, /problema, proyecto o evidencia/i);
});

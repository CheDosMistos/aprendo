import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dataSource = readFileSync(new URL('../src/courses/bateria/specializations.ts', import.meta.url), 'utf8');
const pageSource = readFileSync(new URL('../src/pages/bateria/trayectorias.astro', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../src/pages/bateria/index.astro', import.meta.url), 'utf8');

test('specialization appendix exposes exactly seven optional trajectories plus the progressive core route', () => {
  const trackIds = [...dataSource.matchAll(/\n    id: '([^']+)',\n    title:/g)].map((match) => match[1]);
  assert.deepEqual(trackIds, [
    'pies-doble-pedal',
    'rudimental-lineal-manos-pies',
    'independencia-ostinatos',
    'jazz-brushes',
    'metal-extreme',
    'afro-cuban',
    'brazilian',
  ]);
  assert.match(dataSource, /id: 'ruta-progresiva'/);
  assert.match(dataSource, /TRONCAL AVANZADO — no es una trayectoria duplicada/);
  assert.doesNotMatch(dataSource, /Fase 8|FASE 8/);
});

test('every trajectory uses the three approved entry stages', () => {
  assert.match(dataSource, /'PUEDES EXPLORARLA YA'/);
  assert.match(dataSource, /'INICIO PARALELO RAZONABLE'/);
  assert.match(dataSource, /'ESPECIALIZACIÓN SERIA'/);
  assert.equal((dataSource.match(/'PUEDES EXPLORARLA YA':/g) ?? []).length, 7);
  assert.equal((dataSource.match(/'INICIO PARALELO RAZONABLE':/g) ?? []).length, 7);
  assert.equal((dataSource.match(/'ESPECIALIZACIÓN SERIA':/g) ?? []).length, 7);
});

test('appendix preserves the approved practice baseline and keeps specialization optional', () => {
  assert.match(pageSource, /25–30 min, 3–4 días\/semana/);
  assert.match(pageSource, /Las trayectorias amplían el tronco común/);
  assert.match(pageSource, /BPM es una variable, nunca el único criterio/);
  assert.match(pageSource, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
});

test('course home exposes a visible route to the specialization appendix without making it a unit', () => {
  assert.match(homeSource, /data-specializations-callout/);
  assert.match(homeSource, /href="\/bateria\/trayectorias\/"/);
  assert.match(homeSource, />Trayectorias de especialización</);
  assert.doesNotMatch(homeSource, /data-content-id=".*trayectorias/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = (unit: number) =>
  readFileSync(`src/courses/bateria/content/pages/u${unit}-checkpoint.md`, 'utf8');

test('phase 1 intermediate checkpoints contribute evidence toward Hito 1 without certifying it', () => {
  for (let unit = 1; unit <= 9; unit += 1) {
    const content = page(unit);

    assert.match(content, /## Relación con Hito 1/);
    assert.match(content, /evidencia acumulativa hacia Hito 1/);
    assert.match(content, /no certifica Hito 1 por sí solo/);
    assert.match(content, /Actualiza únicamente lo realmente observado/);
    assert.match(content, /certificación global se realiza en el cierre de Fase 1/);
  }
});

test('the phase 1 final checkpoint remains the global Hito 1 certification point', () => {
  const finalCheckpoint = page(10);

  assert.match(finalCheckpoint, /## HITO OBLIGATORIO/);
  assert.match(finalCheckpoint, /Los 40 PAS al menos CONOCIDOS/);
  assert.doesNotMatch(finalCheckpoint, /no certifica Hito 1 por sí solo/);
});

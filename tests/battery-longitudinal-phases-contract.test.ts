import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const indexPath = path.resolve('src/pages/bateria/[unit]/index.astro');
const componentsDir = path.resolve('src/courses/bateria/components');

test('the approved curriculum wires exactly seven longitudinal phase layers', async () => {
  const index = await readFile(indexPath, 'utf8');

  const imported = [...index.matchAll(/import Phase(\d+)LongitudinalPractice from '@courses\/bateria\/components\/Phase\1LongitudinalPractice\.astro';/g)]
    .map((match) => Number(match[1]));
  const rendered = [...index.matchAll(/entry\.data\.phase === (\d+) && <Phase\1LongitudinalPractice unit=\{entry\.data\.unit\} \/>/g)]
    .map((match) => Number(match[1]));

  assert.deepEqual(imported, [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(rendered, [1, 2, 3, 4, 5, 6, 7]);
  assert.doesNotMatch(index, /Phase8LongitudinalPractice/);
  assert.doesNotMatch(index, /entry\.data\.phase === 8/);
});

test('each approved phase owns one longitudinal component with its own phase marker', async () => {
  const files = (await readdir(componentsDir))
    .filter((name) => /^Phase\d+LongitudinalPractice\.astro$/.test(name))
    .sort((a, b) => Number(a.match(/Phase(\d+)/)?.[1]) - Number(b.match(/Phase(\d+)/)?.[1]));

  assert.deepEqual(files, [
    'Phase1LongitudinalPractice.astro',
    'Phase2LongitudinalPractice.astro',
    'Phase3LongitudinalPractice.astro',
    'Phase4LongitudinalPractice.astro',
    'Phase5LongitudinalPractice.astro',
    'Phase6LongitudinalPractice.astro',
    'Phase7LongitudinalPractice.astro',
  ]);

  for (let phase = 1; phase <= 7; phase += 1) {
    const source = await readFile(path.join(componentsDir, `Phase${phase}LongitudinalPractice.astro`), 'utf8');
    assert.match(source, new RegExp(`data-phase${phase}-longitudinal`));
  }
});

test('the global longitudinal contract does not invent a phase beyond the approved seven-phase architecture', async () => {
  const index = await readFile(indexPath, 'utf8');
  const phases = [...index.matchAll(/entry\.data\.phase === (\d+) && <Phase\d+LongitudinalPractice/g)]
    .map((match) => Number(match[1]));

  assert.equal(Math.max(...phases), 7);
  assert.equal(new Set(phases).size, 7);
});

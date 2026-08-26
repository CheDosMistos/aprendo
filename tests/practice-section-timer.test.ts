import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { parsePracticeDurationHeading } from '../src/platform/practice/practiceDuration.ts';

const contentRoot = path.resolve('src/courses/bateria/content/pages');

test('practice duration headings become structured countdown data', () => {
  assert.deepEqual(parsePracticeDurationHeading('1. Preparación — unos 3 minutos'), {
    title: '1. Preparación',
    minimumMinutes: 3,
    maximumMinutes: 3,
    countdownSeconds: 180,
    badgeLabel: '3min',
    sourceLabel: '— unos 3 minutos',
  });

  assert.deepEqual(parsePracticeDurationHeading('2. Pulso constante — 5–6 min'), {
    title: '2. Pulso constante',
    minimumMinutes: 5,
    maximumMinutes: 6,
    countdownSeconds: 360,
    badgeLabel: '5–6min',
    sourceLabel: '— 5–6 min',
  });

  assert.equal(parsePracticeDurationHeading('Objetivo'), null);
  assert.equal(parsePracticeDurationHeading('Si solo tienes 10–15 minutos'), null);
});

test('all Phase 1 timed section-heading authoring tokens are parseable', async () => {
  const files = (await readdir(contentRoot)).filter((name) => name.endsWith('.md'));
  const failures: string[] = [];
  let timedHeadings = 0;

  for (const filename of files) {
    const source = await readFile(path.join(contentRoot, filename), 'utf8');
    for (const [index, line] of source.split('\n').entries()) {
      const heading = /^#{2,3}\s+(.+)$/.exec(line)?.[1]?.trim();
      if (!heading) continue;
      if (!/[—–-]\s+(?:(?:unos?|aprox\.?|aproximadamente)\s+)?\d+(?:\s*[–-]\s*\d+)?\s*(?:min(?:uto)?s?)\.?\s*$/iu.test(heading)) continue;
      timedHeadings += 1;
      if (!parsePracticeDurationHeading(heading)) failures.push(`${filename}:${index + 1}: ${heading}`);
    }
  }

  assert.ok(timedHeadings >= 20, `Expected substantial Phase 1 timed-section coverage, found ${timedHeadings}`);
  assert.deepEqual(failures, [], `Unparseable timed headings:\n${failures.join('\n')}`);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(path, 'utf8');

test('unit overviews do not mount practice tools intended for active sessions', async () => {
  const route = await read('src/pages/bateria/[unit]/index.astro');
  const layout = await read('src/courses/bateria/components/CourseArticleLayout.astro');
  assert.match(route, /showPracticeTools=\{false\}/);
  assert.match(layout, /showPracticeTools = true/);
  assert.match(layout, /\{showPracticeTools && \(/);
});

test('first sight keeps playback unavailable until the first attempt is explicitly finished', async () => {
  const modes = await read('src/courses/bateria/components/NotationStudyModes.astro');
  assert.match(modes, /firstSightCompleted = 'false'/);
  assert.match(modes, /Finalizar intento/);
  assert.match(modes, /data-first-sight-completed='false'/);
  assert.match(modes, /feedbackLocked = 'true'/);
});

test('progress translates stored limiting-variable codes into learner-facing labels', async () => {
  const progress = await read('src/pages/bateria/progreso.astro');
  assert.match(progress, /Tiempo \/ estabilidad temporal/);
  assert.match(progress, /Tensión innecesaria \/ economía/);
  assert.match(progress, /Recuperación \/ memoria/);
});

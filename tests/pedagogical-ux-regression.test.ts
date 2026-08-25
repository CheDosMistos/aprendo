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

test('cold-reading tasks from U1 through U10 explicitly use controlled first sight', async () => {
  const paths = [
    'src/courses/bateria/content/pages/u1-l4-recuperacion-lectura-aplicacion.md',
    'src/courses/bateria/content/pages/u2-l4-integracion.md',
    'src/courses/bateria/content/pages/u3-l4-integracion-dictado.md',
    'src/courses/bateria/content/pages/u4-l4-integracion-lectura-oido.md',
    'src/courses/bateria/content/pages/u5-l4-drag-paradiddle2-integracion.md',
    'src/courses/bateria/content/pages/u6-l4-integracion-68-motivos.md',
    'src/courses/bateria/content/pages/u7-l4-desplazamiento-lectura-oido.md',
    'src/courses/bateria/content/pages/u8-l4-agrupacion-lectura-oido.md',
    'src/courses/bateria/content/pages/u9-l4-tres-dos-lectura-oido.md',
    'src/courses/bateria/content/pages/u10-l3-lectura-oido-microcomposicion.md',
  ];
  for (const path of paths) {
    const content = await read(path);
    assert.match(content, /data-score-first-sight="true"/, `${path}: cold reading must be protected before first exposure`);
  }
});

test('guided 6/8 reading can keep playback as feedback after self-attempt', async () => {
  const lesson = await read('src/courses/bateria/content/pages/u6-l2-swiss-army-68.md');
  assert.match(lesson, /data-score-feedback="after-attempt"/);
});

test('progress translates stored limiting-variable codes into learner-facing labels', async () => {
  const progress = await read('src/pages/bateria/progreso.astro');
  assert.match(progress, /Tiempo \/ estabilidad temporal/);
  assert.match(progress, /Tensión innecesaria \/ economía/);
  assert.match(progress, /Recuperación \/ memoria/);
});

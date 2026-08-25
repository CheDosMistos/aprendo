import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('session completion stays separate from skill evidence in the UI', () => {
  const checkIn = read('src/courses/bateria/components/PracticeCheckIn.astro');
  assert.ok(checkIn.includes('Completar esta sesión no demuestra automáticamente todas las competencias de la lección.'));
});

test('dense U7–U9 lessons separate nucleus from application and windows', () => {
  const paths = [
    'src/courses/bateria/content/pages/u7-l2-flam-paradiddle-5-4.md',
    'src/courses/bateria/content/pages/u7-l4-desplazamiento-lectura-oido.md',
    'src/courses/bateria/content/pages/u8-l3-double-ratamacue-7-8.md',
    'src/courses/bateria/content/pages/u8-l4-agrupacion-lectura-oido.md',
    'src/courses/bateria/content/pages/u9-l3-flam-drag-quintillos.md',
    'src/courses/bateria/content/pages/u9-l4-tres-dos-lectura-oido.md',
  ];

  for (const path of paths) assert.ok(read(path).includes('NÚCLEO'), `${path} must identify its nucleus`);

  assert.ok(read(paths[0]).includes('AMPLIACIÓN / VENTANA'));
  assert.ok(read(paths[2]).includes('AMPLIACIÓN / VENTANA'));
  assert.ok(read(paths[4]).includes('El quintillo puede trasladarse a otra sesión sin crear deuda.'));
  assert.ok(read(paths[5]).includes('Los dos últimos bloques son reducibles'));
});

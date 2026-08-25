import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('Fase 1 didactic-audit maintenance', () => {
  it('keeps session completion separate from skill evidence in the UI', () => {
    const checkIn = read('src/courses/bateria/components/PracticeCheckIn.astro');
    expect(checkIn).toContain('Completar esta sesión no demuestra automáticamente todas las competencias de la lección.');
  });

  it('marks dense U7–U9 additions as nucleus/application/window instead of mandatory parallel novelty', () => {
    const paths = [
      'src/courses/bateria/content/pages/u7-l2-flam-paradiddle-5-4.md',
      'src/courses/bateria/content/pages/u7-l4-desplazamiento-lectura-oido.md',
      'src/courses/bateria/content/pages/u8-l3-double-ratamacue-7-8.md',
      'src/courses/bateria/content/pages/u8-l4-agrupacion-lectura-oido.md',
      'src/courses/bateria/content/pages/u9-l3-flam-drag-quintillos.md',
      'src/courses/bateria/content/pages/u9-l4-tres-dos-lectura-oido.md',
    ];

    for (const path of paths) {
      const content = read(path);
      expect(content).toContain('NÚCLEO');
    }

    expect(read(paths[0])).toContain('AMPLIACIÓN / VENTANA');
    expect(read(paths[2])).toContain('AMPLIACIÓN / VENTANA');
    expect(read(paths[4])).toContain('El quintillo puede trasladarse a otra sesión sin crear deuda.');
    expect(read(paths[5])).toContain('Los dos últimos bloques son reducibles');
  });
});

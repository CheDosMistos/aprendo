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

test('U1 and U2 checkpoints use controlled first-sight material', () => {
  const u1 = read('src/courses/bateria/content/pages/u1-checkpoint.md');
  const u2 = read('src/courses/bateria/content/pages/u2-checkpoint.md');
  assert.ok(u1.includes('data-score-first-sight="true"'));
  assert.ok(u2.includes('data-score-first-sight="true"'));
  assert.ok(u1.includes('/bateria/notation/u1/checkpoint-lectura-nueva.musicxml'));
  assert.ok(u2.includes('/bateria/notation/u2/checkpoint-lectura-nueva.musicxml'));

  const studyModes = read('src/courses/bateria/components/NotationStudyModes.astro');
  assert.ok(studyModes.includes("score.dataset.scoreFirstSight === 'true'"));
  assert.ok(studyModes.includes("button.textContent = firstSight ? 'Empezar' : 'Ocultar'"));
  assert.ok(studyModes.includes("score.dataset.firstSightCompleted = 'false'"));
  assert.ok(studyModes.includes("button.textContent = 'Finalizar intento'"));
  assert.ok(studyModes.includes(".course-score[data-score-first-sight='true'][data-first-sight-completed='false'] .course-score__play"));
});

test('checkpoint first-sight MusicXML measures are metrically complete', () => {
  const paths = [
    'public/bateria/notation/u1/checkpoint-lectura-nueva.musicxml',
    'public/bateria/notation/u2/checkpoint-lectura-nueva.musicxml',
  ];

  for (const path of paths) {
    const xml = read(path);
    assert.ok(xml.includes('EJERCICIO ORIGINAL CREADO PARA ESTE CURSO'));
    assert.ok(xml.includes('<staff-lines>5</staff-lines>'));
    assert.ok(xml.includes('<sound tempo="120"/>'));
    const measures = [...xml.matchAll(/<measure\b[\s\S]*?<\/measure>/g)];
    assert.equal(measures.length, 2, `${path} must contain two measures`);
    for (const [index, measure] of measures.entries()) {
      const total = [...measure[0].matchAll(/<duration>(\d+)<\/duration>/g)]
        .reduce((sum, match) => sum + Number(match[1]), 0);
      assert.equal(total, 8, `${path} measure ${index + 1} must equal 4/4 at divisions=2`);
    }
  }
});

test('all Phase 1 checkpoints use the common progression language', () => {
  const paths = Array.from({ length: 10 }, (_, index) =>
    `src/courses/bateria/content/pages/u${index + 1}-checkpoint.md`);

  for (const path of paths) {
    const content = read(path);
    assert.ok(content.includes('CONTINUAR'), `${path} must include CONTINUAR`);
    assert.ok(content.includes('CONTINUAR + CORRECTIVO'), `${path} must include CONTINUAR + CORRECTIVO`);
    assert.ok(content.includes('REDUCIR NOVEDAD'), `${path} must include REDUCIR NOVEDAD`);
    assert.ok(content.includes('DETENER CARGA'), `${path} must include DETENER CARGA`);
  }
});

test('U9 keeps work state, PAS mastery and retention separate', () => {
  const u9 = read('src/courses/bateria/content/pages/u9-checkpoint.md');
  assert.ok(u9.includes('**ESTADO DE TRABAJO**'));
  assert.ok(u9.includes('**ESTADO PAS**'));
  assert.ok(u9.includes('**RETENCIÓN**'));
  assert.ok(u9.includes('no son niveles anteriores a `CONOCIDO` dentro de una misma escala'));
});

test('the internal didactic contract encodes checkpoint validity rules', () => {
  const contract = read('docs/course-bateria-didactic-contract.md');
  assert.ok(contract.includes('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN'));
  assert.ok(contract.includes('Muestreo parcial no generaliza automáticamente'));
  assert.ok(contract.includes('Retención exige separación'));
  assert.ok(contract.includes('primera vista'));
});

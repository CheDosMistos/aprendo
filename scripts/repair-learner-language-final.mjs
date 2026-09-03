import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/courses/bateria/content/pages');
const files = fs.readdirSync(ROOT).filter((name) => /^f[1-7]-.*\.md$/.test(name));
let changed = 0;

for (const name of files) {
  const file = path.join(ROOT, name);
  const before = fs.readFileSync(file, 'utf8');
  let after = before;

  // Invariantes técnicas: la migración nunca debe renombrar assets MusicXML.
  after = after.replace(/(data-score-(?:src|source-url)="[^"]*)-Evaluación-/g, '$1-checkpoint-');

  // data-score-title sí es visible al alumno: eliminar jerga editorial artificial.
  after = after.replace(/data-score-title="Unidad \d+\.evaluación\s*—\s*/g, 'data-score-title="Evaluación — ');
  after = after.replace(/data-score-title="Unidad \d+\.Lección (\d+)\s*—\s*/g, 'data-score-title="Lección $1 — ');

  // Las mismas construcciones pueden aparecer en prosa visible.
  after = after.replace(/\bUnidad \d+\.evaluación\b/g, 'Evaluación');
  after = after.replace(/\bUnidad \d+\.Lección (\d+)\b/g, 'Lección $1');

  // Artefactos semánticos conocidos de la sustitución código + etiqueta.
  after = after.replace(/\bel Evaluación\b/g, 'la evaluación');
  after = after.replace(/\beste Evaluación\b/g, 'esta evaluación');
  after = after.replace(/\bMÍNIMO PARA EL Evaluación\b/g, 'MÍNIMO PARA AVANZAR');
  after = after.replace(/\btodos los evaluaciones\b/g, 'todas las evaluaciones');
  after = after.replace(/\btodos las evaluaciones\b/g, 'todas las evaluaciones');
  after = after.replace(/\btodas los evaluaciones\b/g, 'todas las evaluaciones');
  after = after.replace(/\blos evaluaciones\b/g, 'las evaluaciones');
  after = after.replace(/\blas evaluación\b/g, 'la evaluación');
  after = after.replace(/\bbombo bombo\b/gi, 'bombo');
  after = after.replace(/\bindependencia avanzada independencia avanzada\b/gi, 'independencia avanzada');
  after = after.replace(/\bindependencia avanzada independencia\b/gi, 'independencia avanzada');
  after = after.replace(/\bintegración de integración progresiva\b/gi, 'integración progresiva');
  after = after.replace(/\bintegración de integración\b/gi, 'integración');
  after = after.replace(/\bde la unidad de la unidad\b/gi, 'de la unidad');
  after = after.replace(/\bfiguras, silencios y compás sigue siendo legible\b/g, 'la lectura de figuras, silencios y compás sigue siendo legible');
  after = after.replace(/\bno de toda figuras, silencios y compás por sí sola\b/g, 'no de toda tu capacidad de lectura por sí sola');
  after = after.replace(/\bantes de cambiar el mapa de progreso\b/g, 'antes de cambiar el nivel registrado');
  after = after.replace(/\bla siguiente pieza de Unidad (\d+) será el \*\*Evaluación/g, 'la siguiente pieza de esta unidad será la **Evaluación');

  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
    console.log(name);
  }
}

console.log(`Repaired ${changed} learner-facing files.`);

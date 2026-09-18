import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('phase 1 unit overviews expose one bounded longitudinal practice layer', () => {
  const page = read('src/pages/bateria/[unit]/index.astro');
  const guide = read('src/courses/bateria/components/Phase1LongitudinalPractice.astro');

  assert.match(page, /Phase1LongitudinalPractice/);
  assert.match(page, /entry\.data\.phase === 1/);
  assert.match(page, /unit=\{entry\.data\.unit\}/);

  assert.match(guide, /Esto no añade minutos a la sesión/);
  assert.match(guide, /Técnica permanente/);
  assert.match(guide, /Vocabulario PAS actual/);
  assert.match(guide, /Recuperación que rota/);
  assert.match(guide, /Tiempo, lectura, oído y aplicación/);
  assert.match(guide, /una semana de 3–4 sesiones, no cinco obligaciones/i);
  assert.match(guide, /sustituye tiempo de evaluación\/recuperación/i);
});

test('phase 1 longitudinal layer follows the approved acquisition-retrieval-transfer logic', () => {
  const guide = read('src/courses/bateria/components/Phase1LongitudinalPractice.astro');

  assert.match(guide, /Adquisición \+ tiempo\/lectura/);
  assert.match(guide, /Estabilización \+ técnica/);
  assert.match(guide, /Intercalado \+ transferencia\/creatividad/);
  assert.match(guide, /Recuperación \+ evaluación \+ aplicación/);
  assert.match(guide, /correctivos activos/);
  assert.match(guide, /retención todavía no comprobada/);
  assert.match(guide, /recencia relativa, no un intervalo científico fijo/);
  assert.match(guide, /api\/progress\/skills\/\?courseId=bateria&skillType=rudiment/);
  assert.match(guide, /updatedAt/);
});

test('phase 1 longitudinal layer separates PAS vocabulary from permanent motor capacity', () => {
  const guide = read('src/courses/bateria/components/Phase1LongitudinalPractice.astro');

  assert.match(guide, /Un PAS puede pasar a <strong>CONOCIDO<\/strong> y dejar de ser prioridad/);
  assert.match(guide, /relajación y rebote; singles\/doubles; alturas y dinámica; grace notes; continuidad de rolls; bilateralidad y economía/);
  assert.match(guide, /Tempo de calidad/);
  assert.match(guide, /La duración observada es una condición de la muestra, no una cifra que debas superar cada semana/);
  assert.match(guide, /Click reducido, desplazado o con huecos solo aumenta dificultad cuando la referencia interna ya lo permite/);
});

test('phase 1 checkpoints expose progressive PAS evidence without changing the PAS campaign', () => {
  const page = read('src/pages/bateria/[unit]/[slug].astro');
  const map = read('src/courses/bateria/components/Phase1PasMap.astro');
  const curriculum = read('src/courses/bateria/curriculum.ts');

  assert.match(page, /entry\.data\.phase === 1 && entry\.data\.kind === 'checkpoint'/);
  assert.match(page, /Number\(unitNumber\) <= entry\.data\.unit/);
  assert.match(page, /Actualizar mapa PAS con lo que realmente has observado/);
  assert.match(page, /los PAS introducidos hasta esta unidad/i);

  assert.match(map, /rudiments\?: readonly PasRudiment\[\]/);
  assert.match(map, /rudiments = PAS_RUDIMENTS/);
  assert.match(map, /\{rudiments\.map\(\(rudiment, index\)/);

  assert.match(curriculum, /Phase 1 PAS plan must contain exactly 40 unique rudiments/);
  assert.match(curriculum, /10: \[\]/);
});

test('phase 1 separates didactic listening from practice repertoire', () => {
  const guide = read('src/courses/bateria/components/Phase1LongitudinalPractice.astro');

  assert.match(guide, /AUDICIÓN DIDÁCTICA · AMPLIACIÓN/);
  assert.match(guide, /No es repertorio de práctica/);
  assert.match(guide, /en F1 no necesitas aprender ni tocar esas canciones/);
  assert.match(guide, /fuera de tus gustos habituales para ampliar oído y referencias/);
});

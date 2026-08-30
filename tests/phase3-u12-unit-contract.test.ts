import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve('src/courses/bateria/content/pages');
const pages = {
  overview: 'f3-u12-overview.md',
  l1: 'f3-u12-l1-brief-final.md',
  l2: 'f3-u12-l2-pieza-candidata-v0.md',
  l3: 'f3-u12-l3-auditoria-autonoma-v0-v1.md',
  l4: 'f3-u12-l4-ensayo-hito.md',
  hito: 'f3-u12-hito-4-autor-ritmico.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(root, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }

const HITO = 'Crear, escribir, tocar y explicar una breve pieza rítmica propia empleando desarrollo motívico y al menos una transformación consciente.';

test('U12 has overview, four lessons and Hito 4 in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*3$/m);
    assert.match(frontmatter, /^unit:\s*12$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-3-unidad-12$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('hito')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('hito')), /^contentId:\s*bat-f3-u12-check$/m);
});

test('U12 preserves the approved Hito 4 literally and does not renumber Hito 3', async () => {
  const overview = await page('overview');
  const hito = await page('hito');
  assert.ok(overview.includes(HITO));
  assert.ok(hito.includes(HITO));
  assert.match(overview, /Hito global 4 — Autor rítmico/);
  assert.match(overview, /Hito global 3[\s\S]*ya tuvo su checkpoint en U4/);
  assert.match(hito, /Hito global 4 — Autor rítmico/);
});

test('odd meter is optional and 4/4, 5/4 and 7/8 are all valid choices', async () => {
  const overview = await page('overview');
  const l1 = await page('l1');
  const hito = await page('hito');
  for (const text of [overview, l1]) {
    assert.match(text, /4\/4/); assert.match(text, /5\/4/); assert.match(text, /7\/8/);
  }
  assert.match(overview, /métrica impar no es requisito del Hito/i);
  assert.match(hito, /No se exige[\s\S]*métrica impar/i);
  assert.doesNotMatch(`${overview}\n${hito}`, /debes usar (5\/4|7\/8)|obligatorio.*(5\/4|7\/8)/i);
});

test('L1 defines a bounded brief instead of rewarding complexity', async () => {
  const l1 = await page('l1');
  assert.match(l1, /1–4 compases pueden bastar/);
  assert.match(l1, /material\/motivo de partida/);
  assert.match(l1, /transformación conocida/);
  assert.match(l1, /El proyecto debe permitir observar autoría/);
  assert.match(l1, /4\/4 puede demostrar perfectamente el Hito/);
});

test('L2 requires own V0 and traceable development without a course solution score', async () => {
  const l2 = await page('l2');
  assert.match(l2, /No existe una partitura-solución del curso/);
  assert.match(l2, /SE CONSERVA →/);
  assert.match(l2, /CAMBIA →/);
  assert.match(l2, /V0/);
  assert.match(l2, /representación suficientemente clara/);
  assert.doesNotMatch(l2, /data-notation-score|\.musicxml/);
});

test('L3 preserves V0 and distinguishes representation, execution and compositional revision', async () => {
  const l3 = await page('l3');
  assert.match(l3, /Conserva V0/);
  assert.match(l3, /INTENCIÓN/); assert.match(l3, /REPRESENTACIÓN/); assert.match(l3, /EJECUCIÓN/);
  assert.match(l3, /Representación[\s\S]*Ejecución[\s\S]*Decisión compositiva/);
  assert.match(l3, /V1 sólo existe si cambias deliberadamente/);
  assert.match(l3, /mantener V0 porque no existe razón suficiente/);
  assert.match(l3, /Registrar una ayuda no invalida la toma/);
});

test('L4 rehearses evidence and explicitly rejects checkbox-as-competence', async () => {
  const l4 = await page('l4');
  assert.match(l4, /Oído ↔ escritura ↔ ejecución/);
  assert.match(l4, /SE CONSERVA →/); assert.match(l4, /CAMBIA →/);
  assert.match(l4, /\[ \] pieza propia representada por escrito/);
  assert.match(l4, /marcar casillas no demuestra por sí solo la competencia/i);
});

test('Hito minimum matches approved evidence and does not add perfection or advanced rhythm', async () => {
  const hito = await page('hito');
  for (const phrase of [
    'pieza es propia y breve',
    'motivo es identificable',
    'desarrollo motívico rastreable',
    'al menos una transformación consciente',
    'ejecución completa en pad',
    'continuidad razonable',
    'grabación final',
    'condiciones/ayudas',
    'decisión de revisión',
  ]) assert.match(hito, new RegExp(phrase, 'i'));
  assert.match(hito, /No se exige BPM alto, cero errores, métrica impar, varias transformaciones, kit ni originalidad excepcional/);
  assert.match(hito, /COMPETENTE no es requisito para reconocer el Hito mínimo/);
});

test('Hito separates session completion from evidence and keeps Phase 4 conditional on kit', async () => {
  const hito = await page('hito');
  assert.match(hito, /Pulsar “Cierre registrado” no demuestra automáticamente el Hito/);
  assert.match(hito, /Fase 4 — Transferencia al kit se activa cuando exista kit/);
  assert.match(hito, /Mientras sólo haya pad/);
});

test('U12 contains no local notation solution or automatic creativity grader', async () => {
  const all = (await Promise.all((Object.keys(pages) as (keyof typeof pages)[]).map(page))).join('\n');
  assert.doesNotMatch(all, /data-notation-score|\.musicxml/);
  assert.doesNotMatch(all, /data-(?:creativity|composition|hito)-grader/i);
  const publicF3 = path.resolve('public/bateria/notation/f3');
  const units = await readdir(publicF3);
  assert.ok(!units.includes('u12'));
});

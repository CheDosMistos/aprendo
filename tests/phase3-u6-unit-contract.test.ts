import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u6');
const pages = {
  overview: 'f3-u6-overview.md',
  l1: 'f3-u6-l1-el-contrato-de-transformacion-a-a-prime.md',
  l2: 'f3-u6-l2-fragmentar-extender-y-reducir.md',
  l3: 'f3-u6-l3-acento-dinamica-y-sticking.md',
  l4: 'f3-u6-l4-desplazar-sin-cambiar-el-compas.md',
  l5: 'f3-u6-l5-reagrupar-y-reacentuar.md',
  checkpoint: 'f3-u6-checkpoint-puerta-g2-hacia-improvisacion.md',
} as const;

async function page(name: keyof typeof pages) {
  return readFile(path.join(pageRoot, pages[name]), 'utf8');
}
function fm(md: string) {
  return md.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}
function measureBodies(xml: string) {
  return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((m) => m[1] ?? '');
}
function noteBodies(measure: string) {
  return [...measure.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((m) => m[1] ?? '');
}
function measureDuration(measure: string) {
  return noteBodies(measure).reduce((sum, note) => sum + Number(note.match(/<duration>(\d+)<\/duration>/)?.[1] ?? 0), 0);
}
function binaryPattern(measure: string) {
  return noteBodies(measure).map((note) => /<rest\s*\/>/.test(note) ? '0' : '1').join('');
}
function hamming(a: string, b: string) {
  assert.equal(a.length, b.length);
  return [...a].reduce((sum, value, index) => sum + (value === b[index] ? 0 : 1), 0);
}
async function xmlPatterns(file: string) {
  const xml = await readFile(path.join(notationRoot, file), 'utf8');
  const measures = measureBodies(xml);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/, file);
  assert.match(xml, /<sound tempo="120"\s*\/>/, file);
  assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/, file);
  assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/, file);
  assert.ok(measures.length > 0, file);
  assert.deepEqual(measures.map(measureDuration), measures.map(() => 48), file);
  for (const measure of measures) {
    assert.equal(noteBodies(measure).length, 8, file);
    for (const note of noteBodies(measure).filter((item) => !/<rest\s*\/>/.test(item))) {
      assert.match(note, /<notehead>normal<\/notehead>/, file);
    }
  }
  return measures.map(binaryPattern);
}

test('Phase 3 U6 has overview, five lessons and G2 checkpoint in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m);
    assert.match(data, /^unit:\s*6$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-6$/m);
    assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u6-check$/m);
});

test('U6 makes traceable conscious transformation the focus and postpones G3', async () => {
  const overview = await page('overview');
  assert.match(overview, /G2 — transformación consciente/);
  assert.match(overview, /SE CONSERVA:/);
  assert.match(overview, /CAMBIA:/);
  assert.match(overview, /No existe un porcentaje universal/i);
  assert.match(overview, /No exige improvisación libre/i);
  assert.match(overview, /corrector automático de transformación/i);
  assert.match(overview, /una transformación consciente bien identificada/i);
});

test('L1 uses a one-local-change A-prime and requires return to A', async () => {
  const l1 = await page('l1');
  assert.match(l1, /VARIABLE QUE QUIERO CONSERVAR/);
  assert.match(l1, /VARIABLE QUE QUIERO CAMBIAR/);
  assert.match(l1, /A → A’ → A/);
  assert.match(l1, /ACCIDENTE.*DECISIÓN/is);
  const patterns = await xmlPatterns('f3-u6-l1-a-a-prime.musicxml');
  assert.deepEqual(patterns, ['11010010', '11010110']);
  assert.equal(hamming(patterns[0]!, patterns[1]!), 1);
});

test('L2 separates fragmentation extension reduction and deliberate reduction from omission', async () => {
  const l2 = await page('l2');
  assert.match(l2, /A → FRAGMENTO → EXTENSIÓN → REDUCCIÓN/);
  assert.match(l2, /REDUCCIÓN DECIDIDA/);
  assert.match(l2, /OMISIÓN ACCIDENTAL/);
  assert.match(l2, /No hay porcentaje mágico/i);
  assert.deepEqual(await xmlPatterns('f3-u6-l2-structural-family.musicxml'), ['11010010', '11000000', '11010110', '11000010']);
});

test('L3 holds the attack skeleton while accent dynamics and sticking are textual transformations', async () => {
  const l3 = await page('l3');
  assert.match(l3, /MusicXML representa el esqueleto temporal/i);
  assert.match(l3, /ATAQUES\/SILENCIOS: CONSERVADOS/);
  assert.match(l3, /Cambiar sticking.*no implica necesariamente cambiar el ritmo audible/is);
  assert.match(l3, /No simulamos distribución entre caja, toms, bombo o platos/i);
  assert.deepEqual(await xmlPatterns('f3-u6-l3-parameter-family.musicxml'), ['10110100']);
});

test('L4 displacement stays in 4/4 and is only a J2 window', async () => {
  const l4 = await page('l4');
  assert.match(l4, /DESPLAZAMIENTO DENTRO DE 4\/4 ≠ CAMBIO DE COMPÁS/);
  assert.match(l4, /no certifica J2 funcional por sí sola/i);
  assert.match(l4, /desplazamiento.*reagrupación/is);
  assert.deepEqual(await xmlPatterns('f3-u6-l4-displacement.musicxml'), ['10010010', '01001001']);
});

test('L5 keeps 3+3+2 as grouping inside 4/4 rather than 7/8', async () => {
  const l5 = await page('l5');
  assert.match(l5, /3\+3\+2 dentro de 4\/4 ≠ 7\/8/);
  assert.match(l5, /MÉTRICA: 4\/4/);
  assert.match(l5, /AGRUPACIÓN: 3\+3\+2/);
  assert.match(l5, /barra vertical.*agrupación pedagógica.*no barra de compás/is);
  assert.deepEqual(await xmlPatterns('f3-u6-l5-regrouping.musicxml'), ['11111111', '11111111']);
});

test('G2 checkpoint uses fresh material and requires one transformation, not free improvisation', async () => {
  const cp = await page('checkpoint');
  assert.match(cp, /no apareció en L1–L5/i);
  assert.match(cp, /una transformación consciente bien identificada/i);
  assert.match(cp, /No necesitas combinar varias ni improvisar libremente/i);
  assert.match(cp, /AVANZADO no es requisito para U7/);
  assert.match(cp, /no certifica improvisación funcional G3/i);
  assert.deepEqual(await xmlPatterns('f3-u6-cp-transform.musicxml'), ['10011010']);
});

test('U6 keeps advanced metric concepts outside the essential contract', async () => {
  const overview = await page('overview');
  assert.match(overview, /recontextualización métrica.*no equivale a modulación métrica/is);
  assert.match(overview, /“inversión rítmica” no es término esencial/i);
  assert.doesNotMatch(overview, /polimetría.*ESENCIAL|modulación métrica.*ESENCIAL/i);
});

test('U6 reuses existing notation and recorder infrastructure without a transformation grader', async () => {
  const combined = await Promise.all(Object.keys(pages).map((key) => page(key as keyof typeof pages))).then((items) => items.join('\n'));
  assert.match(combined, /data-notation-score/);
  assert.doesNotMatch(combined, /data-motif-transform|transformation-score|creativity-score/i);
  const layout = await readFile(path.resolve('src/courses/bateria/components/CourseArticleLayout.astro'), 'utf8');
  assert.match(layout, /PracticeRecorder/);
  assert.match(layout, /InlineNotationScores/);
});

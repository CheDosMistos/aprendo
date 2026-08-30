import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u8');
const pages = {
  overview: 'f3-u8-overview.md',
  l1: 'f3-u8-l1-de-la-toma-a-la-version-cero.md',
  l2: 'f3-u8-l2-repeticion-retorno-y-esqueleto-formal.md',
  l3: 'f3-u8-l3-una-transformacion-con-trazabilidad.md',
  l4: 'f3-u8-l4-contraste-y-cierre.md',
  l5: 'f3-u8-l5-version-cero-a-version-uno-grabar-comparar-revisar.md',
  checkpoint: 'f3-u8-checkpoint-3b-autoria-en-desarrollo.md',
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
function tokenPattern(measure: string) {
  return noteBodies(measure).map((note) => /<rest\b/.test(note) ? '0' : '1').join('');
}
function hamming(a: string, b: string) {
  assert.equal(a.length, b.length);
  return [...a].reduce((sum, value, index) => sum + (value === b[index] ? 0 : 1), 0);
}

async function xmlData(file: string) {
  const xml = await readFile(path.join(notationRoot, file), 'utf8');
  const measures = measureBodies(xml);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/, file);
  assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/, file);
  assert.match(xml, /tempo="120"/, file);
  assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/, file);
  assert.ok(measures.length > 0, file);
  assert.deepEqual(measures.map(measureDuration), measures.map(() => 48), file);
  for (const note of measures.flatMap(noteBodies).filter((n) => /<unpitched>/.test(n))) {
    assert.match(note, /<notehead>normal<\/notehead>/, file);
  }
  return { xml, measures, patterns: measures.map(tokenPattern) };
}

test('Phase 3 U8 has overview, five lessons and Checkpoint 3B in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m);
    assert.match(data, /^unit:\s*8$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-8$/m);
    assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u8-check$/m);
});

test('U8 overview keeps G4 minimum at 1–4 bars and separates intention notation execution', async () => {
  const overview = await page('overview');
  assert.match(overview, /1–4 compases coherentes y reproducibles/);
  assert.match(overview, /INTENCIÓN:/);
  assert.match(overview, /NOTACIÓN\/REPRESENTACIÓN:/);
  assert.match(overview, /EJECUCIÓN:/);
  assert.match(overview, /Complejidad ≠ calidad/);
  assert.match(overview, /Hito 4.*U12/is);
});

test('L1 fixes a real V0 without presenting the course example as the correct composition', async () => {
  const l1 = await page('l1');
  assert.match(l1, /VERSIÓN 0 \(V0\)/);
  assert.match(l1, /No es “la composición correcta”/);
  assert.match(l1, /1 o 2 compases/);
  assert.match(l1, /desde la representación/i);
  const { patterns } = await xmlData('f3-u8-l1-version-zero.musicxml');
  assert.deepEqual(patterns, ['11010010', '10100110']);
});

test('L2 uses A A-prime B A as an example, not a universal formal law', async () => {
  const l2 = await page('l2');
  assert.match(l2, /A → A’ → B → A/);
  assert.match(l2, /no una plantilla universal/i);
  assert.match(l2, /2\/4\/8\/16 compases.*no reglas/is);
  const { patterns } = await xmlData('f3-u8-l2-form-skeleton.musicxml');
  assert.deepEqual(patterns, ['11010010', '11010011', '10101100', '11010010']);
});

test('L3 uses one traceable transformation and no universal identity percentage', async () => {
  const l3 = await page('l3');
  assert.match(l3, /una sola transformación G2 consciente/i);
  assert.match(l3, /SE CONSERVA:/);
  assert.match(l3, /CAMBIA:/);
  assert.match(l3, /no una regla de porcentaje/i);
  const { patterns } = await xmlData('f3-u8-l3-transform-trace.musicxml');
  assert.deepEqual(patterns, ['11001010', '11001110']);
  assert.equal(hamming(patterns[0]!, patterns[1]!), 1);
});

test('L4 distinguishes contrast from density or difficulty', async () => {
  const l4 = await page('l4');
  assert.match(l4, /contraste no significa “más notas” ni “más difícil”/i);
  assert.match(l4, /Cierre no significa obligatoriamente/i);
  const { patterns } = await xmlData('f3-u8-l4-contrast-closure.musicxml');
  assert.deepEqual(patterns, ['1010', '1011', '0101', '1001']);
  assert.equal((patterns[0]!.match(/1/g) ?? []).length, (patterns[2]!.match(/1/g) ?? []).length);
});

test('L5 preserves V0 and makes V1 a diagnosed revision that may simplify', async () => {
  const l5 = await page('l5');
  assert.match(l5, /V0 — CONSERVADA/);
  assert.match(l5, /INTENCIÓN:/);
  assert.match(l5, /NOTACIÓN:/);
  assert.match(l5, /EJECUCIÓN:/);
  assert.match(l5, /Un error de ejecución no crea automáticamente V1/i);
  assert.match(l5, /simplifica/i);
  assert.match(l5, /NO CAMBIO V0/);
  const { patterns } = await xmlData('f3-u8-l5-v0-v1.musicxml');
  assert.deepEqual(patterns, ['1010', '1011', '0101', '1001', '1010', '1011', '0100', '1001']);
  assert.equal(hamming(patterns.slice(0, 4).join(''), patterns.slice(4).join('')), 1);
});

test('Checkpoint 3B keeps authorship open and only supplies an optional one-bar seed', async () => {
  const cp = await page('checkpoint');
  assert.match(cp, /1–4 compases coherentes y reproducibles/);
  assert.match(cp, /semilla es opcional y no es una composición resuelta/i);
  assert.match(cp, /También puedes comenzar desde un motivo propio nuevo/i);
  assert.match(cp, /al menos una transformación consciente/i);
  assert.match(cp, /no es el Hito 4 final/i);
  assert.match(cp, /AVANZADO no es requisito para U9/);
  const { measures, patterns } = await xmlData('f3-u8-cp-seed.musicxml');
  assert.deepEqual(patterns, ['1010', '0', '0', '0']);
  assert.ok(measures.slice(1).every((measure) => !/<unpitched>/.test(measure)));
});

test('U8 uses existing score and recorder infrastructure without composition grader or mandatory internal editor', async () => {
  const combined = await Promise.all(Object.keys(pages).map((key) => page(key as keyof typeof pages))).then((items) => items.join('\n'));
  assert.match(combined, /data-notation-score/);
  assert.doesNotMatch(combined, /data-composition-grader|data-creativity-score|data-score-editor/);
  assert.match(combined, /No necesitas un editor de partituras dentro de Aprendo/i);
  const layout = await readFile(path.resolve('src/courses/bateria/components/CourseArticleLayout.astro'), 'utf8');
  assert.match(layout, /PracticeRecorder/);
  assert.match(layout, /InlineNotationScores/);
});

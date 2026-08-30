import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u5');
const pages = {
  overview: 'f3-u5-overview.md',
  l1: 'f3-u5-l1-crear-un-motivo-que-puedas-reconocer.md',
  l2: 'f3-u5-l2-identidad-mismo-relacionado-o-nuevo.md',
  l3: 'f3-u5-l3-repeticion-contraste-y-retorno.md',
  l4: 'f3-u5-l4-pregunta-respuesta-y-memoria-motivica.md',
  checkpoint: 'f3-u5-checkpoint-puerta-g1-hacia-transformacion.md',
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
  assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/, file);
  assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/, file);
  assert.ok(measures.length > 0, file);
  assert.deepEqual(measures.map(measureDuration), measures.map(() => 48), file);
  assert.deepEqual(measures.map((m) => noteBodies(m).length), measures.map(() => 8), file);
  return measures.map(binaryPattern);
}

test('Phase 3 U5 has overview, four lessons and G1 checkpoint in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m);
    assert.match(data, /^unit:\s*5$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-5$/m);
    assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u5-check$/m);
});

test('U5 keeps G1 as the focus and explicitly postpones systematic G2 transformations', async () => {
  const overview = await page('overview');
  assert.match(overview, /G1 — motivo, repetición y contraste/);
  assert.match(overview, /no sistematiza todavía/i);
  assert.match(overview, /Eso comienza en U6/);
  assert.match(overview, /No hay una regla universal/i);
  assert.match(overview, /¿qué se conservó y qué cambió\?/i);
  assert.match(overview, /corrector automático/i);
});

test('L1 models three independent one-bar motives and requires authorship plus retrieval', async () => {
  const l1 = await page('l1');
  assert.match(l1, /Cada compás .* motivo independiente/i);
  assert.match(l1, /1 pulso y 1 compás/i);
  assert.match(l1, /recuperación con interferencia/i);
  assert.match(l1, /identidad.*continuidad/is);
  assert.deepEqual(await xmlPatterns('f3-u5-l1-motivos-modelo.musicxml'), ['10111000', '11000101', '10011011']);
});

test('L2 uses A, one-local-change A-prime candidate and clearly more distant B without percentage rules', async () => {
  const l2 = await page('l2');
  assert.match(l2, /MISMO \/ RELACIONADO \/ NUEVO/);
  assert.match(l2, /se conserva:/i);
  assert.match(l2, /cambia:/i);
  assert.match(l2, /No demuestra una regla universal/i);

  const [a] = await xmlPatterns('f3-u5-l2-identidad-a.musicxml');
  const [ap] = await xmlPatterns('f3-u5-l2-identidad-a-prime.musicxml');
  const [b] = await xmlPatterns('f3-u5-l2-identidad-b.musicxml');
  assert.equal(a, '10110010');
  assert.equal(ap, '10110110');
  assert.equal(b, '11001001');
  assert.equal(hamming(a!, ap!), 1);
  assert.ok(hamming(a!, b!) >= 4);
});

test('L3 reference phrase is literally A A B A and contrast is not defined by density', async () => {
  const l3 = await page('l3');
  assert.match(l3, /A → A → B → A/);
  assert.match(l3, /contraste no significa “más notas” ni “más difícil”/i);
  assert.match(l3, /no una forma musical universal/i);
  assert.deepEqual(await xmlPatterns('f3-u5-l3-aaba.musicxml'), ['10110010', '10110010', '11001001', '10110010']);
});

test('L4 separates motif memory, temporal continuity and musical relation', async () => {
  const l4 = await page('l4');
  assert.match(l4, /MEMORIA:/);
  assert.match(l4, /CONTINUIDAD:/);
  assert.match(l4, /RELACIÓN:/);
  assert.match(l4, /Antecedente\/consecuente.*no es obligatorio/i);
  assert.deepEqual(await xmlPatterns('f3-u5-l4-pregunta-respuesta.musicxml'), ['10110010', '10100100', '10110010', '11001010']);
});

test('G1 checkpoint uses fresh C/X material, preserves first version and does not require G2', async () => {
  const cp = await page('checkpoint');
  assert.match(cp, /nuevo para este checkpoint/i);
  assert.match(cp, /Conserva tu primera versión/i);
  assert.match(cp, /A → A → B → A/);
  assert.match(cp, /MISMO \/ RELACIONADO \/ NUEVO/);
  assert.match(cp, /no necesitas todavía demostrar G2/i);
  assert.match(cp, /AVANZADO no es requisito para U6/);
  const patterns = await xmlPatterns('f3-u5-cp-clasificacion.musicxml');
  assert.deepEqual(patterns, ['11100010', '11100011']);
  assert.equal(hamming(patterns[0]!, patterns[1]!), 1);
});

test('U5 uses existing notation/recorder infrastructure rather than an automatic creativity grader', async () => {
  const combined = await Promise.all(Object.keys(pages).map((key) => page(key as keyof typeof pages))).then((items) => items.join('\n'));
  assert.match(combined, /data-notation-score/);
  assert.doesNotMatch(combined, /data-motif-identity/);
  assert.doesNotMatch(combined, /creativity-score|creative-score/i);
  const layout = await readFile(path.resolve('src/courses/bateria/components/CourseArticleLayout.astro'), 'utf8');
  assert.match(layout, /PracticeRecorder/);
  assert.match(layout, /InlineNotationScores/);
});

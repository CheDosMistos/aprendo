import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u7');
const pages = {
  overview: 'f3-u7-overview.md',
  l1: 'f3-u7-l1-un-motivo-una-transformacion-una-frase.md',
  l2: 'f3-u7-l2-call-and-response-escuchar-responder-continuar.md',
  l3: 'f3-u7-l3-densidad-y-silencio-como-restriccion.md',
  l4: 'f3-u7-l4-dos-transformaciones-y-recuperacion.md',
  l5: 'f3-u7-l5-retirar-la-restriccion-objetivo-formal-dinamico.md',
  checkpoint: 'f3-u7-checkpoint-puerta-g3-hacia-composicion.md',
} as const;

async function page(name: keyof typeof pages) { return readFile(path.join(pageRoot, pages[name]), 'utf8'); }
function fm(md: string) { return md.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function measureBodies(xml: string) { return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((m) => m[1] ?? ''); }
function noteBodies(measure: string) { return [...measure.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((m) => m[1] ?? ''); }
function measureDuration(measure: string) { return noteBodies(measure).reduce((sum, note) => sum + Number(note.match(/<duration>(\d+)<\/duration>/)?.[1] ?? 0), 0); }
function binaryPattern(measure: string) { return noteBodies(measure).map((note) => /<rest\s*\/>/.test(note) ? '0' : '1').join(''); }
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
    for (const note of noteBodies(measure).filter((item) => !/<rest\s*\/>/.test(item))) assert.match(note, /<notehead>normal<\/notehead>/, file);
  }
  return measures.map(binaryPattern);
}

test('Phase 3 U7 has overview, five lessons and G3 checkpoint in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m);
    assert.match(data, /^unit:\s*7$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-7$/m);
    assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u7-check$/m);
});

test('U7 makes restricted improvisation the focus and separates continuity content recovery and constraint', async () => {
  const overview = await page('overview');
  assert.match(overview, /G3 — improvisar frases cortas respetando una restricción/);
  assert.match(overview, /CONTINUIDAD:/);
  assert.match(overview, /CONTENIDO:/);
  assert.match(overview, /RECUPERACIÓN:/);
  assert.match(overview, /CONSIGNA:/);
  assert.match(overview, /No hay un grader automático de improvisación/i);
  assert.match(overview, /más restricciones = mejor/i);
});

test('L1 uses one motif one transformation and fixed phrase without prewriting the improvisation', async () => {
  const l1 = await page('l1');
  assert.match(l1, /1 MOTIVO \+ 1 TRANSFORMACIÓN \+ FRASE FIJA/);
  assert.match(l1, /No adquieras una nueva mientras improvisas/i);
  assert.match(l1, /ACCIDENTE QUE QUIERO CONSERVAR/);
  assert.deepEqual(await xmlPatterns('f3-u7-l1-motif-transform.musicxml'), ['10110010', '10110110']);
});

test('L2 alternates calls with genuine silent response bars and rejects one correct answer', async () => {
  const l2 = await page('l2');
  assert.match(l2, /No existe una única respuesta editorial correcta/i);
  assert.match(l2, /compases silenciosos.*no son pausas fuera del tiempo/is);
  assert.match(l2, /Antecedente\/consecuente clásico no es obligatorio/);
  assert.deepEqual(await xmlPatterns('f3-u7-l2-call-response.musicxml'), ['10110010', '00000000', '11001010', '00000000']);
});

test('L3 treats density and silence as decisions inside the pulse', async () => {
  const l3 = await page('l3');
  assert.match(l3, /Silencio musical ≠ bloqueo/);
  assert.match(l3, /MÁXIMO 4 ATAQUES POR COMPÁS/);
  assert.match(l3, /AL MENOS UN SILENCIO DELIBERADO POR FRASE/);
  assert.deepEqual(await xmlPatterns('f3-u7-l3-density-grid.musicxml'), ['10001000', '10001000']);
});

test('L4 provides two known transformations and makes recovery a musical skill', async () => {
  const l4 = await page('l4');
  assert.match(l4, /dos operaciones ya conocidas/i);
  assert.match(l4, /no detengas el tiempo/i);
  assert.match(l4, /simplificación útil/i);
  assert.deepEqual(await xmlPatterns('f3-u7-l4-two-transformations.musicxml'), ['10110010', '10110000', '10110110']);
});

test('L5 removes one layer of scaffolding and keeps the middle of the form unwritten', async () => {
  const l5 = await page('l5');
  assert.match(l5, /El score fija el marco;.*no escribe tu improvisación/is);
  assert.match(l5, /retira una ayuda/i);
  assert.match(l5, /No retires todas a la vez/i);
  assert.deepEqual(await xmlPatterns('f3-u7-l5-form-frame.musicxml'), ['10110010', '00000000', '00000000', '10110010']);
});

test('G3 checkpoint uses a fresh prompt and does not certify G4', async () => {
  const cp = await page('checkpoint');
  assert.match(cp, /no apareció en L1–L5/i);
  assert.match(cp, /improvisar una frase corta respetando una restricción/i);
  assert.match(cp, /No escribas la respuesta completa antes/i);
  assert.match(cp, /AVANZADO no es requisito para U8/);
  assert.match(cp, /no certifica G4 composición funcional/i);
  assert.deepEqual(await xmlPatterns('f3-u7-cp-prompt.musicxml'), ['10010110']);
});

test('U7 reuses existing recorder/notation infrastructure and adds no creativity grader', async () => {
  const combined = await Promise.all(Object.keys(pages).map((key) => page(key as keyof typeof pages))).then((items) => items.join('\n'));
  assert.match(combined, /data-notation-score/);
  assert.doesNotMatch(combined, /data-improv-grader|creativity-score|originality-score/i);
  const layout = await readFile(path.resolve('src/courses/bateria/components/CourseArticleLayout.astro'), 'utf8');
  assert.match(layout, /PracticeRecorder/);
  assert.match(layout, /InlineNotationScores/);
});

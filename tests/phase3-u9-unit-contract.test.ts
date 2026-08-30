import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u9');
const pages = {
  overview: 'f3-u9-overview.md', l1: 'f3-u9-l1-cinco-pulsos-entrar-en-5-4.md',
  l2: 'f3-u9-l2-agrupar-5-4-3-2-2-3.md', l3: 'f3-u9-l3-leer-escribir-transformar-en-5-4.md',
  l4: 'f3-u9-l4-oir-cinco-hipotesis-dictado-verificacion.md', l5: 'f3-u9-l5-crear-en-5-4-mirar-5-8.md',
  checkpoint: 'f3-u9-checkpoint-puerta-cinco.md',
} as const;
async function page(name: keyof typeof pages) { return readFile(path.join(pageRoot, pages[name]), 'utf8'); }
function fm(md: string) { return md.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function measures(xml: string) { return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map(m => m[1] ?? ''); }
function notes(m: string) { return [...m.matchAll(/<note>([\s\S]*?)<\/note>/g)].map(n => n[1] ?? ''); }
function duration(m: string) { return notes(m).reduce((s,n) => s + Number(n.match(/<duration>(\d+)<\/duration>/)?.[1] ?? 0), 0); }
function pattern(m: string) { return notes(m).map(n => /<rest\s*\/>/.test(n) ? '0' : '1').join(''); }
async function score(file: string, beatType = 4) {
  const xml = await readFile(path.join(notationRoot, file), 'utf8');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/, file);
  assert.match(xml, new RegExp(`<beats>5<\\/beats><beat-type>${beatType}<\\/beat-type>`), file);
  assert.match(xml, /<divisions>12<\/divisions>/, file);
  assert.match(xml, /<sound tempo="120"\/>/, file);
  assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/, file);
  const ms = measures(xml); const expected = beatType === 4 ? 60 : 30; const slots = beatType === 4 ? 10 : 5;
  assert.ok(ms.length > 0, file);
  assert.deepEqual(ms.map(duration), ms.map(() => expected), file);
  assert.deepEqual(ms.map(m => notes(m).length), ms.map(() => slots), file);
  for (const n of ms.flatMap(notes).filter(n => !/<rest\s*\/>/.test(n))) assert.match(n, /<notehead>normal<\/notehead>/, file);
  return ms.map(pattern);
}

test('U9 has overview, five lessons and Puerta Cinco in order', async () => {
  for (const [order,key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m); assert.match(data, /^unit:\s*9$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-9$/m); assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u9-check$/m);
});

test('U9 keeps 5/4 core, 5/8 expansion and J3 globally developing', async () => {
  const overview = await page('overview'); const cp = await page('checkpoint');
  assert.match(overview, /5\/4 ≠ quintillo ≠ agrupación de cinco notas/);
  assert.match(overview, /agrupación dentro del compás ≠ compás/);
  assert.match(overview, /5\/8 aparece sólo.*comparación/is);
  assert.match(cp, /J3 continúa EN DESARROLLO/);
  assert.match(cp, /AVANZADO no es requisito para U10/);
});

test('5/4 scores close to 60 divisions with exact pedagogical patterns', async () => {
  assert.deepEqual(await score('f3-u9-l1-five-pulses.musicxml'), ['1010101010','1100101010']);
  assert.deepEqual(await score('f3-u9-l2-five-quarter-grid.musicxml'), ['1111111111']);
  assert.deepEqual(await score('f3-u9-l3-read-transform.musicxml'), ['1011010010','1011010110','1011010010']);
  assert.deepEqual(await score('f3-u9-l4-dictation-answer.musicxml'), ['1101010010']);
  assert.deepEqual(await score('f3-u9-l5-create-seed-5-4.musicxml'), ['1010100010']);
  assert.deepEqual(await score('f3-u9-cp-reading.musicxml'), ['0110101010']);
});

test('5/8 exists only as expansion and closes to 30 divisions', async () => {
  assert.deepEqual(await score('f3-u9-l5-compare-5-8.musicxml', 8), ['11010']);
  const l5 = await page('l5');
  assert.match(l5, /Parte B — AMPLIACIÓN: 5\/8/);
  assert.match(l5, /5\/8 no es automáticamente “5\/4 más rápido”/);
  assert.match(l5, /no forma parte del mínimo/i);
});

test('L2 changes grouping without redefining meter', async () => {
  const l2 = await page('l2');
  assert.match(l2, /3\+2.*2\+3/is); assert.match(l2, /no cambia el compás/i);
  assert.match(l2, /no una lista exhaustiva|no.*exhaustiva/i);
});

test('L4 dictation pattern equals hidden MusicXML answer', async () => {
  const l4 = await page('l4');
  assert.match(l4, /data-rhythm-dictation/); assert.match(l4, /data-pattern="1101010010"/);
  assert.match(l4, /f3-u9-l4-dictation-answer\.musicxml/); assert.match(l4, /permanece oculta/i);
  assert.deepEqual(await score('f3-u9-l4-dictation-answer.musicxml'), ['1101010010']);
});

test('U9 does not smuggle J4 or an odd-meter grader into the core', async () => {
  const combined = (await Promise.all((Object.keys(pages) as (keyof typeof pages)[]).map(page))).join('\n');
  assert.match(combined, /No introducimos quintillos como habilidad nueva|no introduce quintillos funcionales/i);
  assert.doesNotMatch(combined, /data-odd-meter-grader|data-meter-grader/);
  const layout = await readFile(path.resolve('src/courses/bateria/components/CourseArticleLayout.astro'), 'utf8');
  assert.match(layout, /PracticeRecorder/); assert.match(layout, /InlineNotationScores/); assert.match(layout, /RhythmDictationWidgets/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u10');
const pages = {
  overview: 'f3-u10-overview.md', l1: 'f3-u10-l1-siete-corcheas-entrar-en-7-8.md',
  l2: 'f3-u10-l2-tres-agrupaciones-un-mismo-7-8.md', l3: 'f3-u10-l3-leer-escribir-transformar-en-7-8.md',
  l4: 'f3-u10-l4-oir-siete-metrica-agrupacion-dictado.md', l5: 'f3-u10-l5-crear-en-7-8-mirar-7-4.md',
  checkpoint: 'f3-u10-checkpoint-puerta-siete.md',
} as const;
async function page(name: keyof typeof pages) { return readFile(path.join(pageRoot, pages[name]), 'utf8'); }
function fm(md: string) { return md.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function measures(xml: string) { return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map(m => m[1] ?? ''); }
function notes(m: string) { return [...m.matchAll(/<note>([\s\S]*?)<\/note>/g)].map(n => n[1] ?? ''); }
function duration(m: string) { return notes(m).reduce((s,n) => s + Number(n.match(/<duration>(\d+)<\/duration>/)?.[1] ?? 0), 0); }
function pattern(m: string) { return notes(m).map(n => /<rest\s*\/>/.test(n) ? '0' : '1').join(''); }
async function score(file: string, beatType = 8) {
  const xml = await readFile(path.join(notationRoot, file), 'utf8');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/, file);
  assert.match(xml, new RegExp(`<beats>7<\\/beats><beat-type>${beatType}<\\/beat-type>`), file);
  assert.match(xml, /<divisions>12<\/divisions>/, file);
  assert.match(xml, /<sound tempo="120"\/>/, file);
  assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/, file);
  const ms = measures(xml); const expected = beatType === 8 ? 42 : 84;
  assert.ok(ms.length > 0, file);
  assert.deepEqual(ms.map(duration), ms.map(() => expected), file);
  assert.deepEqual(ms.map(m => notes(m).length), ms.map(() => 7), file);
  for (const n of ms.flatMap(notes).filter(n => !/<rest\s*\/>/.test(n))) assert.match(n, /<notehead>normal<\/notehead>/, file);
  return ms.map(pattern);
}

test('U10 has overview, five lessons and Puerta Siete in order', async () => {
  for (const [order,key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m); assert.match(data, /^unit:\s*10$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-10$/m); assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u10-check$/m);
});

test('U10 keeps 7/8 core, 7/4 expansion and evidence-based J3 levels', async () => {
  const overview = await page('overview'); const cp = await page('checkpoint');
  assert.match(overview, /7\/8 ≠ septillo ≠ agrupación de siete notas/);
  assert.match(overview, /agrupación dentro del compás ≠ compás/);
  assert.match(overview, /7\/4 aparece sólo como comparación/i);
  assert.match(overview, /J3 MÍNIMO GLOBAL/);
  assert.match(overview, /J3 COMPETENTE\/FUNCIONAL no se concede por calendario/);
  assert.match(cp, /Sólo si esta evidencia es funcional en ambas métricas puede registrarse J3 COMPETENTE/);
  assert.match(cp, /AVANZADO no es requisito para U11/);
});

test('7/8 scores close to 42 divisions with exact pedagogical patterns', async () => {
  assert.deepEqual(await score('f3-u10-l1-seven-eight.musicxml'), ['1111111','1010101']);
  assert.deepEqual(await score('f3-u10-l2-seven-eight-grid.musicxml'), ['1111111']);
  assert.deepEqual(await score('f3-u10-l3-read-transform.musicxml'), ['1011010','1010110','1011010']);
  assert.deepEqual(await score('f3-u10-l4-dictation-answer.musicxml'), ['1101010']);
  assert.deepEqual(await score('f3-u10-l5-create-seed-7-8.musicxml'), ['1011010']);
  assert.deepEqual(await score('f3-u10-cp-reading.musicxml'), ['0110101']);
});

test('7/4 exists only as expansion and closes to 84 divisions', async () => {
  assert.deepEqual(await score('f3-u10-l5-compare-7-4.musicxml', 4), ['1101010']);
  const l5 = await page('l5');
  assert.match(l5, /Parte B — AMPLIACIÓN: 7\/4/);
  assert.match(l5, /7\/4 no es automáticamente.*7\/8 más lento/i);
  assert.match(l5, /no forma parte del mínimo/i);
});

test('L2 changes grouping without redefining meter', async () => {
  const l2 = await page('l2');
  assert.match(l2, /2\+2\+3.*2\+3\+2.*3\+2\+2/is);
  assert.match(l2, /no cambia el compás/i);
  assert.match(l2, /No hay una agrupación “correcta universal”/i);
});

test('L4 dictation pattern equals hidden MusicXML answer and names the meter', async () => {
  const l4 = await page('l4');
  assert.match(l4, /data-rhythm-dictation/); assert.match(l4, /data-pattern="1101010"/);
  assert.match(l4, /data-stimulus-label="1 compás de 7\/8"/);
  assert.match(l4, /f3-u10-l4-dictation-answer\.musicxml/);
  assert.deepEqual(await score('f3-u10-l4-dictation-answer.musicxml'), ['1101010']);
  const widget = await readFile(path.resolve('src/courses/bateria/components/RhythmDictationWidgets.astro'), 'utf8');
  assert.match(widget, /dataset\.stimulusLabel/);
});

test('U10 does not smuggle J4+ or an odd-meter grader into the core', async () => {
  const combined = (await Promise.all((Object.keys(pages) as (keyof typeof pages)[]).map(page))).join('\n');
  assert.match(combined, /No introducimos septillos como habilidad nueva|Septillos funcionales.*no son novedad central/is);
  assert.doesNotMatch(combined, /data-odd-meter-grader|data-meter-grader/);
  const layout = await readFile(path.resolve('src/courses/bateria/components/CourseArticleLayout.astro'), 'utf8');
  assert.match(layout, /PracticeRecorder/); assert.match(layout, /InlineNotationScores/); assert.match(layout, /RhythmDictationWidgets/);
});

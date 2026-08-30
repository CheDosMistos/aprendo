import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u2');
const pages = {
  overview: 'f3-u2-overview.md',
  l1: 'f3-u2-l1-escuchar-por-partes.md',
  l2: 'f3-u2-l2-del-pulso-al-compas.md',
  l3: 'f3-u2-l3-escribir-durante-o-despues.md',
  l4: 'f3-u2-l4-dos-compases.md',
  checkpoint: 'f3-u2-checkpoint-puerta-e3-e4.md',
} as const;

const scorePatterns = {
  'f3-u2-l1-segmentacion-a.musicxml': ['11001101'],
  'f3-u2-l2-semicorcheas-a.musicxml': ['1000101001001000'],
  'f3-u2-l3-durante-a.musicxml': ['11100101'],
  'f3-u2-l3-despues-b.musicxml': ['10101110'],
  'f3-u2-l4-dos-compases-a.musicxml': ['11010100', '11010010'],
  'f3-u2-cp-semicorcheas-a.musicxml': ['1010000100101000'],
  'f3-u2-cp-dos-compases-b.musicxml': ['10011010', '10011001'],
} as const;

const u1Patterns = new Set([
  '10110101', '11010011', '10100101', '11011010', '10010110',
  '10110100', '10100100', '10011101', '11001011',
]);

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

test('Phase 3 U2 has overview, four lessons and checkpoint in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m);
    assert.match(data, /^unit:\s*2$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-2$/m);
    assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u2-check$/m);
});

test('U2 keeps chunking non-dogmatic and reserves E6 transcription for U3', async () => {
  const overview = await page('overview');
  assert.match(overview, /DECISIÓN CURRICULAR RAZONADA/);
  assert.match(overview, /no una ley científica/i);
  assert.match(overview, /no existe un número universal de escuchas/i);
  assert.match(overview, /E6 — transcripción iterativa de una fuente — empieza en U3/);
  assert.match(overview, /vocalizar puede ayudar, pero no es ritual obligatorio/i);
});

test('all U2 MusicXML assets are original, metrically closed and match the auditory patterns', async () => {
  for (const [file, expectedPatterns] of Object.entries(scorePatterns)) {
    const xml = await readFile(path.join(notationRoot, file), 'utf8');
    const measures = measureBodies(xml);
    assert.equal(measures.length, expectedPatterns.length, file);
    assert.deepEqual(measures.map(measureDuration), expectedPatterns.map(() => 48), file);
    assert.deepEqual(measures.map(binaryPattern), expectedPatterns, file);
    assert.match(xml, /<divisions>12<\/divisions>/);
    assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
    assert.match(xml, /<staff-lines>5<\/staff-lines>/);
    assert.match(xml, /<sound tempo="120"\/>/);
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);
  }
});

test('U2 stimuli do not recycle U1 and L3 conditions have equal density', () => {
  const allU2 = Object.values(scorePatterns).flat();
  assert.equal(new Set(allU2).size, allU2.length, 'U2 contains a duplicate stimulus');
  for (const pattern of allU2) assert.equal(u1Patterns.has(pattern), false, `recycled U1 pattern: ${pattern}`);
  assert.equal(scorePatterns['f3-u2-l3-durante-a.musicxml'][0].replaceAll('0', '').length, 5);
  assert.equal(scorePatterns['f3-u2-l3-despues-b.musicxml'][0].replaceAll('0', '').length, 5);
});

test('U2 pages declare the intended configurable chunk contracts', async () => {
  const l1 = await page('l1');
  assert.match(l1, /data-pattern="11001101"/);
  assert.match(l1, /data-subdivision="2"/);
  assert.match(l1, /data-chunk-beats="1"/);
  assert.match(l1, /Pulso 1\|Pulso 2\|Pulso 3\|Pulso 4/);

  const l2 = await page('l2');
  assert.match(l2, /data-pattern="1000101001001000"/);
  assert.match(l2, /data-subdivision="4"/);
  assert.match(l2, /data-chunk-beats="1"/);

  const l4 = await page('l4');
  assert.match(l4, /data-pattern="1101010011010010"/);
  assert.match(l4, /data-chunk-beats="4"/);
  assert.match(l4, /Compás 1\|Compás 2/);

  const cp = await page('checkpoint');
  assert.match(cp, /data-pattern="1010000100101000"/);
  assert.match(cp, /data-pattern="1001101010011001"/);
  assert.match(cp, /CONTINUAR \+ CORRECTIVO/);
  assert.match(cp, /REDUCIR NOVEDAD/);
  assert.match(cp, /DETENER CARGA/);
});

test('dictation widget keeps U1 compatibility and adds locked, counted chunks for U2', async () => {
  const component = await readFile(path.resolve('src/courses/bateria/components/RhythmDictationWidgets.astro'), 'utf8');
  assert.match(component, /widget\.dataset\.chunkBeats/);
  assert.match(component, /data-dictation-chunk-play/);
  assert.match(component, /data-chunk-index/);
  assert.match(component, /disabled/);
  assert.match(component, /listenCount === 1/);
  assert.match(component, /button\.disabled = false/);
  assert.match(component, /widget\.dataset\.chunkListenCount/);
  assert.match(component, /Escuchas completas:/);
  assert.match(component, /Escuchas: \$\{listenCount\}/);
  assert.match(component, /preloadNotationResources\(\[answerScoreSrc\]\)/);
});

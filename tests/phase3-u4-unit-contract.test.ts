import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u4');
const pages = {
  overview: 'f3-u4-overview.md',
  l1: 'f3-u4-l1-de-la-celula-a-la-frase.md',
  l2: 'f3-u4-l2-repeticion-contraste-y-transicion.md',
  l3: 'f3-u4-l3-riff-ostinato-pickup-y-fill-como-funcion.md',
  l4: 'f3-u4-l4-construir-y-usar-un-mapa-de-forma.md',
  checkpoint: 'f3-u4-checkpoint-3a-hito-global-3.md',
} as const;

async function page(name: keyof typeof pages) {
  return readFile(path.join(pageRoot, pages[name]), 'utf8');
}
function fm(md: string) {
  return md.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}
function attr(tag: string, name: string) {
  return tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? '';
}
function formTags(md: string) {
  return [...md.matchAll(/<div\s+data-rhythm-form\b[^>]*><\/div>/g)].map((m) => m[0]);
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

test('Phase 3 U4 has overview, four lessons and Checkpoint 3A in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m);
    assert.match(data, /^unit:\s*4$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-4$/m);
    assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u4-check$/m);
});

test('U4 preserves formal distinctions and treats regular phrase lengths as heuristics', async () => {
  const overview = await page('overview');
  assert.match(overview, /motivo, frase y sección/i);
  assert.match(overview, /repetición, contraste y transición/i);
  assert.match(overview, /2 \/ 4 \/ 8 \/ 16 no son una ley/i);
  assert.match(overview, /riff, ostinato, pickup\/anacrusa y fill/i);
  const l2 = await page('l2');
  assert.match(l2, /siete compases/i);
  assert.match(l2, /EXPECTATIVA → COMPROBACIÓN AUDITIVA/);
  const l3 = await page('l3');
  assert.match(l3, /No toda frase densa es un fill/i);
  assert.match(l3, /Densidad sin transición/i);
  assert.match(l3, /Densidad con función de transición/i);
});

test('all U4 form sources have aligned layers and valid block maps', async () => {
  for (const key of ['l1', 'l2', 'l3', 'l4'] as const) {
    for (const tag of formTags(await page(key))) {
      const subdivision = Number(attr(tag, 'data-subdivision'));
      const low = attr(tag, 'data-low-pattern');
      const mid = attr(tag, 'data-mid-pattern');
      const high = attr(tag, 'data-high-pattern');
      assert.ok(subdivision > 0, key);
      assert.equal(low.length, mid.length, `${key}: low/mid length`);
      assert.equal(low.length, high.length, `${key}: low/high length`);
      assert.equal(low.length % (subdivision * 4), 0, `${key}: complete bars`);
      assert.match(low + mid + high, /^[01]+$/);
      const lengths = attr(tag, 'data-block-lengths');
      if (lengths) {
        const blockBars = lengths.split('|').map(Number);
        assert.equal(blockBars.reduce((a, b) => a + b, 0), low.length / (subdivision * 4), `${key}: block sum`);
      }
    }
  }
});

test('L1 is 4+4 by design while L2 deliberately breaks an eight-bar expectation', async () => {
  const l1Tag = formTags(await page('l1'))[0] ?? '';
  assert.equal(attr(l1Tag, 'data-block-lengths'), '4|4');
  assert.equal(attr(l1Tag, 'data-low-pattern').length / 8, 8);
  const l2Tag = formTags(await page('l2'))[0] ?? '';
  assert.equal(attr(l2Tag, 'data-block-lengths'), '2|2|1|2');
  assert.equal(attr(l2Tag, 'data-low-pattern').length / 8, 7);
});

test('Checkpoint 3A preserves the official Hito 3 wording and uses one related material family', async () => {
  const cp = await page('checkpoint');
  assert.match(cp, /leer → cantar → tocar → escuchar → escribir/);
  assert.match(cp, /material nuevo/i);
  assert.match(cp, /data-hito-read-only/);
  assert.match(cp, /f3-u4-cp-read-e\.musicxml/);
  assert.match(cp, /data-pattern="1011010010110101"/);
  assert.match(cp, /data-chunk-beats="4"/);
  assert.match(cp, /CONTINUAR \+ CORRECTIVO/);
  assert.match(cp, /no cierra Fase 3/i);
});

test('Checkpoint MusicXML files are original, closed and differ only in the intended second-bar event', async () => {
  const expected = {
    'f3-u4-cp-read-e.musicxml': ['10110100', '10100101'],
    'f3-u4-cp-heard-e-prime.musicxml': ['10110100', '10110101'],
  } as const;
  for (const [file, patterns] of Object.entries(expected)) {
    const xml = await readFile(path.join(notationRoot, file), 'utf8');
    const measures = measureBodies(xml);
    assert.equal(measures.length, 2, file);
    assert.deepEqual(measures.map(measureDuration), [48, 48], file);
    assert.deepEqual(measures.map(binaryPattern), patterns, file);
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
    assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);
  }
});

test('U4 form widget is separate, locks block help until one full listen and does not alter transcription semantics', async () => {
  const component = await readFile(path.resolve('src/courses/bateria/components/RhythmFormWidgets.astro'), 'utf8');
  assert.match(component, /\[data-rhythm-form\]/);
  assert.match(component, /data-form-block/);
  assert.match(component, /disabled/);
  assert.match(component, /fullCount === 1/);
  assert.match(component, /button\.disabled = false/);
  assert.match(component, /formFullListenCount/);
  assert.match(component, /formBlockListenCount/);
  assert.doesNotMatch(component, /data-rhythm-transcription/);
});

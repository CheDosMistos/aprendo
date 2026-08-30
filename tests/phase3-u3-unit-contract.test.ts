import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u3');
const pages = {
  overview: 'f3-u3-overview.md',
  l1: 'f3-u3-l1-fuente-marco-hipotesis.md',
  l2: 'f3-u3-l2-reconstruccion-iterativa-por-capas.md',
  l3: 'f3-u3-l3-slowdown-diagnostico.md',
  l4: 'f3-u3-l4-transcripcion-util-trazabilidad.md',
  checkpoint: 'f3-u3-checkpoint-primera-evidencia-e6.md',
} as const;

const sourceContracts = {
  l1: {
    file: 'f3-u3-l1-source-a.musicxml', sub: 2,
    low: '1000100010001000', mid: '0010001000100010', high: '0100010001000100',
    composite: '1110111011101110',
  },
  l2: {
    file: 'f3-u3-l2-source-b.musicxml', sub: 2,
    low: '1001000010010000', mid: '0010001000001010', high: '0100010001000100',
    composite: '1111011011011110',
  },
  l3: {
    file: 'f3-u3-l3-source-c.musicxml', sub: 4,
    low: '10000000100000001000000010000000', mid: '00001000000010000000100000001000', high: '00100100001001000010010000100100',
    composite: '10101100101011001010110010101100',
  },
  l4: {
    file: 'f3-u3-l4-source-d.musicxml', sub: 2,
    low: '1000100010010000', mid: '0010001000100010', high: '0100000101000001',
    composite: '1110101111110011',
  },
  checkpoint: {
    file: 'f3-u3-cp-source-e.musicxml', sub: 2,
    low: '1001000010000100', mid: '0010001000101000', high: '0100010001000010',
    composite: '1111011011101110',
  },
} as const;

async function page(name: keyof typeof pages) {
  return readFile(path.join(pageRoot, pages[name]), 'utf8');
}
function fm(md: string) {
  return md.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}
function measures(xml: string) {
  return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((m) => m[1] ?? '');
}
function notes(measure: string) {
  return [...measure.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((m) => m[1] ?? '');
}
function duration(measure: string) {
  return notes(measure).reduce((sum, note) => sum + Number(note.match(/<duration>(\d+)<\/duration>/)?.[1] ?? 0), 0);
}
function binary(measure: string) {
  return notes(measure).map((note) => /<rest\s*\/>/.test(note) ? '0' : '1').join('');
}
function orLayers(...patterns: string[]) {
  return [...patterns[0]].map((_, index) => patterns.some((pattern) => pattern[index] === '1') ? '1' : '0').join('');
}

test('Phase 3 U3 has overview, four lessons and checkpoint in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m);
    assert.match(data, /^unit:\s*3$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-3$/m);
    assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u3-check$/m);
});

test('U3 defines E6 as iterative verification and preserves uncertainty', async () => {
  const overview = await page('overview');
  assert.match(overview, /Transcribir no significa hacer un dictado más largo/);
  assert.match(overview, /FUENTE → HIPÓTESIS → PREGUNTA → REESCUCHA → REVISIÓN → EJECUCIÓN → VALIDACIÓN/);
  for (const label of ['OBS', 'HIP', 'APROX', 'DUDA']) assert.match(overview, new RegExp(`\\*\\*${label}:`));
  assert.match(overview, /identificar qué parte es aproximación propia/i);
  assert.match(overview, /No existe un número universal de escuchas, compases o BPM/i);
});

test('each source page declares exact three-layer data and its OR matches the written composite', async () => {
  for (const [key, contract] of Object.entries(sourceContracts) as [keyof typeof sourceContracts, (typeof sourceContracts)[keyof typeof sourceContracts]][]) {
    const md = await page(key);
    assert.match(md, new RegExp(`data-subdivision="${contract.sub}"`));
    assert.match(md, new RegExp(`data-low-pattern="${contract.low}"`));
    assert.match(md, new RegExp(`data-mid-pattern="${contract.mid}"`));
    assert.match(md, new RegExp(`data-high-pattern="${contract.high}"`));
    assert.equal(orLayers(contract.low, contract.mid, contract.high), contract.composite, key);
    assert.match(md, new RegExp(`Esqueleto compuesto: ${contract.composite}`));
    assert.match(md, new RegExp(`/bateria/notation/f3/u3/${contract.file.replaceAll('.', '\\.')}`));
  }
});

test('all U3 MusicXML skeletons are original, 4/4, closed and equal the composite audio attacks', async () => {
  for (const contract of Object.values(sourceContracts)) {
    const xml = await readFile(path.join(notationRoot, contract.file), 'utf8');
    const parts = measures(xml);
    const slotsPerMeasure = contract.sub * 4;
    const expected = Array.from({ length: contract.composite.length / slotsPerMeasure }, (_, i) => contract.composite.slice(i * slotsPerMeasure, (i + 1) * slotsPerMeasure));
    assert.equal(parts.length, 2, contract.file);
    assert.deepEqual(parts.map(duration), [48, 48], contract.file);
    assert.deepEqual(parts.map(binary), expected, contract.file);
    assert.match(xml, /<divisions>12<\/divisions>/);
    assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
    assert.match(xml, /<staff-lines>5<\/staff-lines>/);
    assert.match(xml, /<sound tempo="120"\/>/);
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);
  }
});

test('U3 sources and composite skeletons are independent', () => {
  const composites = Object.values(sourceContracts).map((contract) => contract.composite);
  assert.equal(new Set(composites).size, composites.length);
  const layerTriples = Object.values(sourceContracts).map((contract) => `${contract.low}|${contract.mid}|${contract.high}`);
  assert.equal(new Set(layerTriples).size, layerTriples.length);
});

test('slowdown is diagnostic only in L3 and checkpoint', async () => {
  assert.doesNotMatch(await page('l1'), /data-allow-slowdown="true"/);
  assert.doesNotMatch(await page('l2'), /data-allow-slowdown="true"/);
  assert.match(await page('l3'), /data-allow-slowdown="true"/);
  assert.doesNotMatch(await page('l4'), /data-allow-slowdown="true"/);
  assert.match(await page('checkpoint'), /data-allow-slowdown="true"/);
  assert.match(await page('l3'), /100 % → HIPÓTESIS → 80 % SI APORTA INFORMACIÓN → REVISIÓN → 100 % → VALIDACIÓN/);
  assert.match(await page('checkpoint'), /Si utilizas 80 %, vuelve después al 100 %/);
});

test('transcription widget locks aids until first 100 percent listen and preloads lazy solution', async () => {
  const component = await readFile(path.resolve('src/courses/bateria/components/RhythmTranscriptionWidgets.astro'), 'utf8');
  assert.match(component, /data-transcription-chunk/);
  assert.match(component, /data-transcription-slow disabled/);
  assert.match(component, /fullCount === 1/);
  assert.match(component, /button\.disabled = false/);
  assert.match(component, /playSlow\.disabled = false/);
  assert.match(component, /widget\.dataset\.fullListenCount/);
  assert.match(component, /widget\.dataset\.chunkListenCount/);
  assert.match(component, /widget\.dataset\.slowListenCount/);
  assert.match(component, /preloadNotationResources\(\[answerScoreSrc\]\)/);
  assert.match(component, /data-transcription-answer-score/);
  assert.match(component, /effectiveBpm = bpm \* rate/);
});

test('course layout mounts dictation and transcription widgets together', async () => {
  const layout = await readFile(path.resolve('src/courses/bateria/components/CourseArticleLayout.astro'), 'utf8');
  assert.match(layout, /RhythmDictationWidgets/);
  assert.match(layout, /RhythmTranscriptionWidgets/);
  assert.match(layout, /<RhythmDictationWidgets \/>/);
  assert.match(layout, /<RhythmTranscriptionWidgets \/>/);
});

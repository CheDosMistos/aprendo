import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f3/u1');
const pages = {
  overview: 'f3-u1-overview.md',
  l1: 'f3-u1-l1-una-idea-varias-representaciones.md',
  l2: 'f3-u1-l2-oir-imitar-escribir.md',
  l3: 'f3-u1-l3-escribir-tocar-escuchar-revisar.md',
  l4: 'f3-u1-l4-motivo-rastreable.md',
  checkpoint: 'f3-u1-checkpoint-representacion-bidireccional.md',
} as const;

const scorePatterns = {
  'f3-u1-l1-visual-a.musicxml': ['10110101'],
  'f3-u1-l1-solucion-auditiva-a.musicxml': ['11010011'],
  'f3-u1-l2-dictado-a.musicxml': ['10100101'],
  'f3-u1-l2-dictado-b.musicxml': ['11011010'],
  'f3-u1-l3-modelo-escritura.musicxml': ['10010110'],
  'f3-u1-l4-motivo-a.musicxml': ['10110100', '10100100'],
  'f3-u1-cp-visual-a.musicxml': ['10011101'],
  'f3-u1-cp-solucion-auditiva-a.musicxml': ['11001011'],
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
function measureDuration(measure: string) {
  return [...measure.matchAll(/<note>([\s\S]*?)<\/note>/g)]
    .reduce((sum, note) => sum + Number((note[1] ?? '').match(/<duration>(\d+)<\/duration>/)?.[1] ?? 0), 0);
}
function eighthPattern(measure: string) {
  return [...measure.matchAll(/<note>([\s\S]*?)<\/note>/g)]
    .map((note) => /<rest\s*\/>/.test(note[1] ?? '') ? '0' : '1')
    .join('');
}

test('Phase 3 U1 has overview, four lessons and checkpoint in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*3$/m);
    assert.match(data, /^unit:\s*1$/m);
    assert.match(data, /^unitSlug:\s*fase-3-unidad-1$/m);
    assert.match(data, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f3-u1-check$/m);
});

test('U1 keeps recognition, imitation, dictation, transcription and analysis separate', async () => {
  const overview = await page('overview');
  for (const label of ['Reconocimiento', 'Imitación', 'Dictado rítmico', 'Transcripción', 'Análisis']) {
    assert.match(overview, new RegExp(`\\*\\*${label}`));
  }
  assert.match(overview, /Su trabajo estructurado empieza en U3/);
  assert.match(overview, /no existe un número universal de escuchas para aprobar/i);
  assert.match(overview, /no es el Hito global 3/i);
});

test('auditory tasks expose unique hidden-score stimuli matching their MusicXML', async () => {
  const expected = [
    ['l1', '11010011', 'f3-u1-l1-solucion-auditiva-a.musicxml'],
    ['l2', '10100101', 'f3-u1-l2-dictado-a.musicxml'],
    ['l2', '11011010', 'f3-u1-l2-dictado-b.musicxml'],
    ['checkpoint', '11001011', 'f3-u1-cp-solucion-auditiva-a.musicxml'],
  ] as const;
  const patterns = new Set<string>();
  for (const [key, pattern, file] of expected) {
    const md = await page(key);
    assert.match(md, new RegExp(`data-pattern="${pattern}"`));
    assert.match(md, new RegExp(`data-answer-score-src="/bateria/notation/f3/u1/${file}"`));
    assert.equal(patterns.has(pattern), false, `duplicate auditory pattern: ${pattern}`);
    patterns.add(pattern);
  }
});

test('all U1 MusicXML assets are original, 4/4, metrically closed and match their declared eighth grids', async () => {
  for (const [file, expectedPatterns] of Object.entries(scorePatterns)) {
    const xml = await readFile(path.join(notationRoot, file), 'utf8');
    const measures = measureBodies(xml);
    assert.equal(measures.length, expectedPatterns.length, file);
    assert.deepEqual(measures.map(measureDuration), expectedPatterns.map(() => 48), file);
    assert.deepEqual(measures.map(eighthPattern), expectedPatterns, file);
    assert.match(xml, /<divisions>12<\/divisions>/);
    assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
    assert.match(xml, /<staff-lines>5<\/staff-lines>/);
    assert.match(xml, /<sound tempo="120"\/>/);
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);
  }
});

test('L4 changes one attack only and checkpoint protects the independent visual sample', async () => {
  const l4 = await page('l4');
  assert.match(l4, /se elimina deliberadamente el ataque de la segunda corchea del pulso 2/i);
  assert.match(l4, /no la registramos automáticamente como desarrollo del motivo original/i);

  const cp = await page('checkpoint');
  assert.match(cp, /data-score-first-sight="true"/);
  assert.match(cp, /f3-u1-cp-visual-a\.musicxml/);
  assert.match(cp, /No hay un máximo universal de escuchas para aprobar/);
  assert.match(cp, /CONTINUAR \+ CORRECTIVO/);
  assert.match(cp, /REDUCIR NOVEDAD/);
  assert.match(cp, /DETENER CARGA/);
});

test('dictation widget supports visible listen count and a preloaded hidden notation answer', async () => {
  const component = await readFile(path.resolve('src/courses/bateria/components/RhythmDictationWidgets.astro'), 'utf8');
  assert.match(component, /data-dictation-listen-count/);
  assert.match(component, /widget\.dataset\.listenCount/);
  assert.match(component, /data-dictation-answer-score/);
  assert.match(component, /data-notation-score/);
  assert.match(component, /answerScore\.hidden = true/);
});

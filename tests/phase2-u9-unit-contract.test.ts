import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f2/u9');
const originalBadge = 'EJERCICIO ORIGINAL CREADO PARA ESTE CURSO';

const pages = {
  overview: 'f2-u9-overview.md',
  l1: 'f2-u9-l1-protocolo-un-solo-intento.md',
  l2: 'f2-u9-l2-continuidad-y-precision.md',
  l3: 'f2-u9-l3-recuperacion-sin-reiniciar.md',
  l4: 'f2-u9-l4-transferencia-compas-compuesto.md',
  checkpoint: 'f2-u9-checkpoint-puerta-primera-vista-i.md',
} as const;

const scores = {
  l1: 'f2-u9-l1-primera-vista-protocolo.musicxml',
  l2: 'f2-u9-l2-continuidad-vs-precision.musicxml',
  l3: 'f2-u9-l3-recuperacion-sin-reiniciar.musicxml',
  l4: 'f2-u9-l4-primera-vista-9-8.musicxml',
  a: 'f2-u9-checkpoint-muestra-a-4-4.musicxml',
  b: 'f2-u9-checkpoint-muestra-b-6-8.musicxml',
} as const;

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function measures(xml: string): string[] {
  return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((match) => match[1] ?? '');
}

function metricDuration(measure: string): number {
  let total = 0;
  for (const match of measure.matchAll(/<note>([\s\S]*?)<\/note>/g)) {
    const note = match[1] ?? '';
    if (note.includes('<grace')) continue;
    const duration = note.match(/<duration>(\d+)<\/duration>/)?.[1];
    assert.ok(duration, 'Every ordinary note/rest must carry duration');
    total += Number(duration);
  }
  return total;
}

function count(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

async function readPage(name: keyof typeof pages): Promise<string> {
  return readFile(path.join(pageRoot, pages[name]), 'utf8');
}

async function readScore(name: keyof typeof scores): Promise<string> {
  const file = path.join(notationRoot, scores[name]);
  await access(file);
  return readFile(file, 'utf8');
}

test('Phase 2 U9 architecture makes D5 central, orders four lessons plus checkpoint, and reserves reduced click for U10', async () => {
  const overview = await readPage('overview');
  const data = frontmatter(overview);
  assert.match(data, /^contentId:\s*bat-f2-u9-overview\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*9\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-9\s*$/m);
  assert.match(data, /^kind:\s*unit\s*$/m);
  assert.match(data, /^order:\s*0\s*$/m);
  assert.match(data, /^competencies:.*\bD5\b.*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);
  assert.match(overview, /PRIMERA VISTA = MATERIAL REALMENTE NUEVO \+ INSPECCIÓN BREVE \+ PRIMER INTENTO SIN ENSAYO NI PLAYBACK PREVIO/);
  assert.match(overview, /ESA MISMA PARTITURA → PRÁCTICA DE LECTURA, NO NUEVA EVIDENCIA D5/);
  assert.match(overview, /click reducido, half-time o gaps — \*\*U10\*\*/);

  const expected = [
    ['l1', 1], ['l2', 2], ['l3', 3], ['l4', 4], ['checkpoint', 5],
  ] as const;
  for (const [name, order] of expected) {
    const markdown = await readPage(name);
    const fm = frontmatter(markdown);
    assert.match(fm, /^phase:\s*2\s*$/m);
    assert.match(fm, /^unit:\s*9\s*$/m);
    assert.match(fm, new RegExp(`^order:\\s*${order}\\s*$`, 'm'));
    assert.match(fm, /^competencies:.*\bD5\b.*$/m);
    assert.match(fm, /^rudiments:\s*\[\]\s*$/m);
  }
});

test('Phase 2 U9 formal samples are protected before first attempt, source-linked, and never use after-attempt feedback as a substitute', async () => {
  for (const name of ['l1', 'l2', 'l3', 'l4'] as const) {
    const markdown = await readPage(name);
    const publicPath = `/bateria/notation/f2/u9/${scores[name]}`;
    assert.equal(count(markdown, /data-notation-score/g), 1);
    assert.equal(count(markdown, /data-score-first-sight="true"/g), 1);
    assert.equal(count(markdown, /data-score-feedback="after-attempt"/g), 0);
    assert.ok(markdown.includes(`data-score-src="${publicPath}"`));
    assert.ok(markdown.includes(`data-score-source-url="${publicPath}"`));
    assert.ok(markdown.includes(`data-score-badge="${originalBadge}"`));
    assert.match(markdown, /después|Después|Finalizar intento/);
  }

  const checkpoint = await readPage('checkpoint');
  assert.equal(count(checkpoint, /data-notation-score/g), 2);
  assert.equal(count(checkpoint, /data-score-first-sight="true"/g), 2);
  assert.equal(count(checkpoint, /data-score-feedback="after-attempt"/g), 0);
  for (const name of ['a', 'b'] as const) {
    const publicPath = `/bateria/notation/f2/u9/${scores[name]}`;
    assert.ok(checkpoint.includes(`data-score-src="${publicPath}"`));
    assert.ok(checkpoint.includes(`data-score-source-url="${publicPath}"`));
  }
});

test('Phase 2 U9 repeatedly states that practiced material no longer supplies independent first-sight evidence', async () => {
  const oneUseSignals = [
    'ya no',
    'deja de',
    'sólo es válida',
    'solo es válida',
    'no como nueva evidencia',
    'no la cuentes como primera vista',
    'ya es práctica',
  ];
  for (const name of ['overview', 'l1', 'l2', 'l3', 'l4', 'checkpoint'] as const) {
    const markdown = (await readPage(name)).toLowerCase();
    assert.ok(oneUseSignals.some((signal) => markdown.includes(signal)), `${name}: expected explicit one-use first-sight validity language`);
  }
});

test('Phase 2 U9 L1-L3 keep familiar 4/4 vocabulary in exact four-measure protected samples', async () => {
  for (const name of ['l1', 'l2', 'l3'] as const) {
    const xml = await readScore(name);
    const bars = measures(xml);
    assert.equal(bars.length, 4, `${name}: expected four measures`);
    assert.match(xml, /<score-partwise version="4\.0">/);
    assert.match(xml, /<divisions>12<\/divisions>/);
    assert.match(xml, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
    assert.deepEqual(bars.map(metricDuration), [48, 48, 48, 48]);
    assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);
    assert.match(xml, /<midi-channel>10<\/midi-channel>/);
    assert.match(xml, /<midi-unpitched>39<\/midi-unpitched>/);
    assert.match(xml, /<staff-lines>5<\/staff-lines>/);
    assert.match(xml, /<sound tempo="120"\/>/);
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  }
});

test('Phase 2 U9 L4 transfers first sight to known 9/8 without tuplets or new ornamentation', async () => {
  const xml = await readScore('l4');
  const bars = measures(xml);
  assert.equal(bars.length, 4);
  assert.match(xml, /<time><beats>9<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.deepEqual(bars.map(metricDuration), [54, 54, 54, 54]);
  assert.match(xml, /<beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute>/);
  assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);
});

test('Phase 2 U9 checkpoint uses two independent exact samples: A in 4/4 and B in prototypical 6/8', async () => {
  const simple = await readScore('a');
  const compound = await readScore('b');
  const aBars = measures(simple);
  const bBars = measures(compound);

  assert.equal(aBars.length, 4);
  assert.match(simple, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.deepEqual(aBars.map(metricDuration), [48, 48, 48, 48]);

  assert.equal(bBars.length, 4);
  assert.match(compound, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.deepEqual(bBars.map(metricDuration), [36, 36, 36, 36]);
  assert.match(compound, /<beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute>/);

  for (const xml of [simple, compound]) {
    assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.match(xml, /<sound tempo="120"\/>/);
  }
});

test('Phase 2 U9 checkpoint preserves validity chain, separate dimensions, and the conditional bridge to U10', async () => {
  const markdown = await readPage('checkpoint');
  assert.match(markdown, /## INFERENCIA/);
  assert.match(markdown, /## EVIDENCIA/);
  assert.match(markdown, /## TAREA Y CONDICIONES/);
  assert.match(markdown, /## DECISIÓN/);
  assert.match(markdown, /continuidad\/recuperación/);
  assert.match(markdown, /precisión de lectura\/ejecución/);
  assert.match(markdown, /### CONTINUAR/);
  assert.match(markdown, /### CONTINUAR \+ CORRECTIVO/);
  assert.match(markdown, /### REDUCIR NOVEDAD/);
  assert.match(markdown, /### DETENER CARGA/);
  assert.match(markdown, /## MÍNIMO PARA ABRIR U10/);
  assert.match(markdown, /click reducido/);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /resultados contradictorios/i);
});

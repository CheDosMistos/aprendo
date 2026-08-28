import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f2/u8');
const originalBadge = 'EJERCICIO ORIGINAL CREADO PARA ESTE CURSO';
const pasPdf = 'https://pas.org/wp-content/uploads/2024/04/pas-rudiments.pdf';

const pages = {
  overview: 'f2-u8-overview.md',
  l1: 'f2-u8-l1-sextillo-escrito-seis-en-tiempo-de-cuatro.md',
  l2: 'f2-u8-l2-flam-escrito-grace-note-y-principal.md',
  l3: 'f2-u8-l3-drag-escrito-double-grace-y-principal.md',
  l4: 'f2-u8-l4-roll-escrito-duracion-y-repeticion.md',
  checkpoint: 'f2-u8-checkpoint-puerta-decodificacion-ornamental.md',
} as const;

const scores = {
  l1: 'f2-u8-l1-semicorcheas-vs-sextillos-6-4.musicxml',
  l2: 'f2-u8-l2-linea-base-vs-grace-note.musicxml',
  l3: 'f2-u8-l3-linea-base-vs-double-grace.musicxml',
  l4: 'f2-u8-l4-linea-base-vs-roll-escrito.musicxml',
  checkpoint: 'f2-u8-checkpoint-decodificacion-ornamental.musicxml',
} as const;

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function measures(xml: string): string[] {
  return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((match) => match[1] ?? '');
}

function noteBodies(measure: string): string[] {
  return [...measure.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((match) => match[1] ?? '');
}

function metricDuration(measure: string): number {
  let total = 0;
  for (const note of noteBodies(measure)) {
    if (note.includes('<grace')) continue;
    const duration = note.match(/<duration>(\d+)<\/duration>/)?.[1];
    assert.ok(duration, 'Every non-grace note/rest in the fixture must carry duration');
    total += Number(duration);
  }
  return total;
}

function count(haystack: string, pattern: RegExp): number {
  return (haystack.match(pattern) ?? []).length;
}

async function readPage(name: keyof typeof pages): Promise<string> {
  return readFile(path.join(pageRoot, pages[name]), 'utf8');
}

async function readScore(name: keyof typeof scores): Promise<string> {
  const file = path.join(notationRoot, scores[name]);
  await access(file);
  return readFile(file, 'utf8');
}

test('Phase 2 U8 architecture keeps D3/B7 central, orders four lessons plus checkpoint, and reserves D5 for U9', async () => {
  const overview = await readPage('overview');
  const overviewData = frontmatter(overview);

  assert.match(overviewData, /^contentId:\s*bat-f2-u8-overview\s*$/m);
  assert.match(overviewData, /^phase:\s*2\s*$/m);
  assert.match(overviewData, /^unit:\s*8\s*$/m);
  assert.match(overviewData, /^unitSlug:\s*fase-2-unidad-8\s*$/m);
  assert.match(overviewData, /^kind:\s*unit\s*$/m);
  assert.match(overviewData, /^order:\s*0\s*$/m);
  assert.match(overviewData, /^rudiments:\s*\[\]\s*$/m);

  const overviewCompetencies = overviewData.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['B3', 'B4', 'B5', 'B7', 'C2', 'C3', 'D3', 'K2', 'K4', 'K6']) {
    assert.match(overviewCompetencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U8 overview`);
  }
  assert.doesNotMatch(overviewCompetencies, /\bD5\b/);
  assert.match(overview, /VER EL SÍMBOLO → DECODIFICAR SU FUNCIÓN → EJECUTAR → RECONOCER\/APLICAR LA FAMILIA/);
  assert.match(overview, /PAS es la autoridad normativa/);
  assert.match(overview, /D5 primera vista formal:\*\* U9/);

  const expected = [
    ['l1', 1, 'D3'],
    ['l2', 2, 'B3'],
    ['l3', 3, 'B4'],
    ['l4', 4, 'B5'],
    ['checkpoint', 5, 'B7'],
  ] as const;

  for (const [name, order, requiredCompetency] of expected) {
    const markdown = await readPage(name);
    const data = frontmatter(markdown);
    assert.match(data, /^phase:\s*2\s*$/m);
    assert.match(data, /^unit:\s*8\s*$/m);
    assert.match(data, /^unitSlug:\s*fase-2-unidad-8\s*$/m);
    assert.match(data, new RegExp(`^order:\\s*${order}\\s*$`, 'm'));
    assert.match(data, /^rudiments:\s*\[\]\s*$/m);
    const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
    assert.match(competencies, /\bD3\b/);
    assert.match(competencies, new RegExp(`\\b${requiredCompetency}\\b`));
    assert.doesNotMatch(competencies, /\bD5\b/);
    assert.doesNotMatch(markdown, /data-score-first-sight="true"/);
  }

  assert.match(await readPage('checkpoint'), /no es una prueba formal de primera vista D5/i);
  assert.match(await readPage('checkpoint'), /primera vista formal D5.*U9/i);
});

test('Phase 2 U8 pages embed only original-course scores with after-attempt feedback and explicit source links', async () => {
  for (const name of ['l1', 'l2', 'l3', 'l4', 'checkpoint'] as const) {
    const markdown = await readPage(name);
    const scoreFile = scores[name];
    const publicPath = `/bateria/notation/f2/u8/${scoreFile}`;

    assert.equal(count(markdown, /data-notation-score/g), 1, `${name}: expected exactly one embedded score`);
    assert.equal(count(markdown, /data-score-feedback="after-attempt"/g), 1, `${name}: expected feedback gating`);
    assert.ok(markdown.includes(`data-score-src="${publicPath}"`), `${name}: missing score src`);
    assert.ok(markdown.includes(`data-score-source-url="${publicPath}"`), `${name}: missing source link`);
    assert.ok(markdown.includes(`data-score-badge="${originalBadge}"`), `${name}: missing original-material badge`);
  }

  for (const name of ['l2', 'l3', 'l4', 'checkpoint'] as const) {
    assert.ok((await readPage(name)).includes(pasPdf), `${name}: expected normative PAS PDF link`);
  }

  assert.match(await readPage('l2'), /no reproduce el Flam PAS #20/i);
  assert.match(await readPage('l3'), /no reproduce el ejercicio PAS #31/i);
  assert.match(await readPage('l4'), /no reproduce ningún roll PAS numerado/i);
  assert.match(await readPage('checkpoint'), /No reproduce el Flam #20, Drag #31 ni ningún roll PAS numerado/);
});

test('Phase 2 U8 L1 encodes ordinary sixteenths versus four complete 6:4 sextuplet groups in unchanged 4/4', async () => {
  const xml = await readScore('l1');
  const bars = measures(xml);

  assert.equal(bars.length, 2);
  assert.match(xml, /<score-partwise version="4\.0">/);
  assert.match(xml, /<divisions>24<\/divisions>/);
  assert.match(xml, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.deepEqual(bars.map(metricDuration), [96, 96]);

  assert.equal(count(bars[0] ?? '', /<type>16th<\/type>/g), 16);
  assert.equal(count(bars[0] ?? '', /<time-modification>/g), 0);
  assert.equal(count(bars[1] ?? '', /<type>16th<\/type>/g), 24);
  assert.equal(count(bars[1] ?? '', /<actual-notes>6<\/actual-notes>/g), 24);
  assert.equal(count(bars[1] ?? '', /<normal-notes>4<\/normal-notes>/g), 24);
  assert.equal(count(bars[1] ?? '', /<tuplet type="start"\/>/g), 4);
  assert.equal(count(bars[1] ?? '', /<tuplet type="stop"\/>/g), 4);
  assert.doesNotMatch(xml, /<grace\b|<tremolo\b/);
});

test('Phase 2 U8 L2 and L3 encode grace-note hierarchy without consuming metric duration', async () => {
  const flam = await readScore('l2');
  const drag = await readScore('l3');
  const flamBars = measures(flam);
  const dragBars = measures(drag);

  assert.deepEqual(flamBars.map(metricDuration), [48, 48]);
  assert.equal(count(flamBars[1] ?? '', /<grace slash="yes"\/>/g), 4);
  assert.equal(count(flamBars[1] ?? '', /<duration>12<\/duration><type>quarter<\/type>/g), 4);
  const flamGraceNotes = noteBodies(flamBars[1] ?? '').filter((note) => note.includes('<grace'));
  assert.equal(flamGraceNotes.length, 4);
  for (const grace of flamGraceNotes) assert.doesNotMatch(grace, /<duration>/);
  assert.doesNotMatch(flam, /<time-modification>|<tremolo\b/);

  assert.deepEqual(dragBars.map(metricDuration), [48, 48]);
  assert.equal(count(dragBars[1] ?? '', /<grace slash="yes"\/>/g), 8);
  assert.equal(count(dragBars[1] ?? '', /<duration>12<\/duration><type>quarter<\/type>/g), 4);
  assert.equal(count(dragBars[1] ?? '', /<beam number="1">begin<\/beam>/g), 4);
  assert.equal(count(dragBars[1] ?? '', /<beam number="1">end<\/beam>/g), 4);
  const dragGraceNotes = noteBodies(dragBars[1] ?? '').filter((note) => note.includes('<grace'));
  assert.equal(dragGraceNotes.length, 8);
  for (const grace of dragGraceNotes) assert.doesNotMatch(grace, /<duration>/);
  assert.doesNotMatch(drag, /<time-modification>|<tremolo\b/);
});

test('Phase 2 U8 L4 encodes a two-beat roll carrier, quarter-note release, and quarter rest without naming a PAS roll', async () => {
  const xml = await readScore('l4');
  const bars = measures(xml);

  assert.deepEqual(bars.map(metricDuration), [48, 48]);
  assert.equal(count(xml, /<tremolo type="single">2<\/tremolo>/g), 1);
  assert.match(bars[1] ?? '', /<duration>24<\/duration><type>half<\/type>[\s\S]*<tremolo type="single">2<\/tremolo>/);
  assert.match(bars[1] ?? '', /<duration>12<\/duration><type>quarter<\/type>/);
  assert.match(bars[1] ?? '', /<rest\/><duration>12<\/duration><type>quarter<\/type>/);
  assert.doesNotMatch(xml, /<grace\b|<time-modification>/);
});

test('Phase 2 U8 checkpoint isolates 6:4, selective grace, selective double-grace, and roll release in four exact 4/4 measures', async () => {
  const xml = await readScore('checkpoint');
  const bars = measures(xml);

  assert.equal(bars.length, 4);
  assert.match(xml, /<divisions>24<\/divisions>/);
  assert.deepEqual(bars.map(metricDuration), [96, 96, 96, 96]);

  assert.equal(count(bars[0] ?? '', /<actual-notes>6<\/actual-notes>/g), 6);
  assert.equal(count(bars[0] ?? '', /<normal-notes>4<\/normal-notes>/g), 6);
  assert.equal(count(bars[0] ?? '', /<tuplet type="start"\/>/g), 1);
  assert.equal(count(bars[0] ?? '', /<tuplet type="stop"\/>/g), 1);
  assert.equal(count(bars[0] ?? '', /<duration>24<\/duration><type>quarter<\/type>/g), 3);

  assert.equal(count(bars[1] ?? '', /<grace slash="yes"\/>/g), 2);
  assert.equal(count(bars[1] ?? '', /<duration>24<\/duration><type>quarter<\/type>/g), 4);
  assert.equal(count(bars[2] ?? '', /<grace slash="yes"\/>/g), 4);
  assert.equal(count(bars[2] ?? '', /<duration>24<\/duration><type>quarter<\/type>/g), 4);

  assert.equal(count(bars[3] ?? '', /<tremolo type="single">2<\/tremolo>/g), 1);
  assert.match(bars[3] ?? '', /<duration>48<\/duration><type>half<\/type>/);
  assert.match(bars[3] ?? '', /<duration>24<\/duration><type>quarter<\/type>/);
  assert.match(bars[3] ?? '', /<rest\/><duration>24<\/duration><type>quarter<\/type>/);

  assert.match(xml, /<midi-channel>10<\/midi-channel>/);
  assert.match(xml, /<midi-unpitched>39<\/midi-unpitched>/);
  assert.match(xml, /<staff-lines>5<\/staff-lines>/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
});

test('Phase 2 U8 checkpoint preserves the evidence chain, bounded decision language, and U9/U10 boundaries', async () => {
  const markdown = await readPage('checkpoint');

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /### CONTINUAR/);
  assert.match(markdown, /### CONTINUAR \+ CORRECTIVO/);
  assert.match(markdown, /### REDUCIR NOVEDAD/);
  assert.match(markdown, /### DETENER CARGA/);
  assert.match(markdown, /## MÍNIMO PARA ABRIR U9/);
  assert.match(markdown, /primera vista formal D5.*U9/i);
  assert.match(markdown, /click reducido, half-time o gaps.*U10/i);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /Eso no equivale a promover automáticamente ninguna competencia global/);
});

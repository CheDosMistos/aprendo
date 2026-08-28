import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve('src/courses/bateria/content/pages');
const files = {
  overview: 'f2-u12-overview.md',
  l1: 'f2-u12-l1-que-mide-hito-2.md',
  l2: 'f2-u12-l2-muestra-protegida-a-4-4.md',
  l3: 'f2-u12-l3-muestra-protegida-b-6-8.md',
  l4: 'f2-u12-l4-diagnostico-y-puente-f3.md',
  checkpoint: 'f2-u12-checkpoint-hito-2.md',
} as const;
const scores = {
  a: path.resolve('public/bateria/notation/f2/u12/f2-u12-l2-muestra-a-4-4.musicxml'),
  b: path.resolve('public/bateria/notation/f2/u12/f2-u12-l3-muestra-b-6-8.musicxml'),
  c: path.resolve('public/bateria/notation/f2/u12/f2-u12-check-muestra-c-4-4.musicxml'),
  d: path.resolve('public/bateria/notation/f2/u12/f2-u12-check-muestra-d-6-8.musicxml'),
} as const;
async function page(name: keyof typeof files) { return readFile(path.join(root, files[name]), 'utf8'); }
function fm(md: string) { return md.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function measures(xml: string) { return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((m) => m[1] ?? ''); }
function duration(m: string) { return [...m.matchAll(/<note>([\s\S]*?)<\/note>/g)].reduce((s, n) => s + Number((n[1] ?? '').match(/<duration>(\d+)<\/duration>/)?.[1] ?? 0), 0); }

test('U12 has overview, four lessons and checkpoint in order', async () => {
  for (const [i, key] of (Object.keys(files) as (keyof typeof files)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*2$/m);
    assert.match(data, /^unit:\s*12$/m);
    assert.match(data, new RegExp(`^order:\\s*${i}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f2-u12-check$/m);
});

test('U12 preserves the official Hito 2 inference and does not create Hito 3', async () => {
  const overview = await page('overview');
  const checkpoint = await page('checkpoint');
  for (const md of [overview, checkpoint]) assert.match(md, /Leer y reproducir material rítmico nuevo sin depender de que el patrón haya sido previamente memorizado/);
  assert.match(overview, /Oído\/escritura aporta información diagnóstica adicional, pero \*\*no crea un segundo examen\*\*/);
  assert.match(checkpoint, /No es un examen acumulativo de todos los contenidos de Fase 2/);
  assert.match(await page('l4'), /no crea un segundo examen ni el Hito 3/);
});

test('U12 keeps first-sight assets exclusive to their intended encounter', async () => {
  const overview = await page('overview');
  const l1 = await page('l1');
  const l2 = await page('l2');
  const l3 = await page('l3');
  const l4 = await page('l4');
  const checkpoint = await page('checkpoint');
  assert.match(l2, /f2-u12-l2-muestra-a-4-4\.musicxml/);
  assert.match(l3, /f2-u12-l3-muestra-b-6-8\.musicxml/);
  assert.match(checkpoint, /f2-u12-check-muestra-c-4-4\.musicxml/);
  assert.match(checkpoint, /f2-u12-check-muestra-d-6-8\.musicxml/);
  for (const md of [overview, l1, l2, l3, l4]) {
    assert.doesNotMatch(md, /f2-u12-check-muestra-c-4-4\.musicxml/);
    assert.doesNotMatch(md, /f2-u12-check-muestra-d-6-8\.musicxml/);
  }
  for (const md of [l2, l3, checkpoint]) assert.match(md, /data-score-first-sight="true"/);
  assert.doesNotMatch(l2, /data-score-feedback="after-attempt"/);
  assert.doesNotMatch(l3, /data-score-feedback="after-attempt"/);
});

test('U12 four original scores are metrically closed and percussion-safe', async () => {
  const expectations = { a: [48, 48, 48, 48], b: [36, 36, 36, 36], c: [48, 48, 48, 48], d: [36, 36, 36, 36] } as const;
  for (const key of Object.keys(scores) as (keyof typeof scores)[]) {
    const xml = await readFile(scores[key], 'utf8');
    assert.deepEqual(measures(xml).map(duration), expectations[key]);
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.match(xml, /<midi-channel>10<\/midi-channel>/);
    assert.match(xml, /<midi-unpitched>39<\/midi-unpitched>/);
    assert.match(xml, /<staff-lines>5<\/staff-lines>/);
    assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);
  }
  assert.match(await readFile(scores.a, 'utf8'), /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(await readFile(scores.c, 'utf8'), /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(await readFile(scores.b, 'utf8'), /<beats>6<\/beats><beat-type>8<\/beat-type>/);
  assert.match(await readFile(scores.d, 'utf8'), /<beats>6<\/beats><beat-type>8<\/beat-type>/);
});

test('U12 diagnostic task is additional evidence and bridge keeps Phase 3 boundaries', async () => {
  const l4 = await page('l4');
  assert.match(l4, /data-pattern="10100110"/);
  assert.match(l4, /1 0 1 0 \| 0 1 1 0/);
  assert.match(l4, /ESCUCHA \/ MEMORIA \/ ESCRITURA \/ EJECUCIÓN/);
  assert.match(l4, /análisis y forma/);
  assert.match(l4, /transcripción progresivamente más estructurada/);
  assert.match(l4, /Esto es un \*\*puente\*\*, no una declaración de que F3\/F4\/E6 ya sean funcionales/);
});

test('U12 checkpoint uses approved evidence dimensions and non-automatic decision language', async () => {
  const checkpoint = await page('checkpoint');
  for (const heading of ['INFERENCIA', 'EVIDENCIA CENTRAL', 'TAREA Y CONDICIONES', 'INTERPRETACIÓN MULTIDIMENSIONAL', 'DECISIÓN']) assert.match(checkpoint, new RegExp(heading));
  for (const term of ['pulso y subdivisión', 'continuidad', 'precisión de ataques, silencios y duraciones', 'recuperación tras error localizado', 'comprensión suficiente']) assert.match(checkpoint, new RegExp(term));
  assert.match(checkpoint, /Cumplir este mínimo \*\*no convierte automáticamente C1–C3, D1–D5 o F1–F2 en FUNCIONALES\*\*/);
  assert.match(checkpoint, /CONTINUAR/);
  assert.match(checkpoint, /CONTINUAR \+ CORRECTIVO/);
  assert.match(checkpoint, /REDUCIR NOVEDAD/);
  assert.match(checkpoint, /DETENER CARGA/);
  assert.match(checkpoint, /Fase 2 puede cerrarse y Fase 3 gana el centro de gravedad/);
});

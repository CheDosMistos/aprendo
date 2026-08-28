import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve('src/courses/bateria/content/pages');
const files = {
  overview: 'f2-u11-overview.md',
  l1: 'f2-u11-l1-escuchar-escribir-tocar-comparar.md',
  l2: 'f2-u11-l2-ver-contar-tocar-escuchar.md',
  l3: 'f2-u11-l3-aplicar-sin-borrar-la-linea.md',
  l4: 'f2-u11-l4-transformar-conservando-identidad.md',
  checkpoint: 'f2-u11-checkpoint-puerta-integracion.md',
} as const;
const scorePath = path.resolve('public/bateria/notation/f2/u11/f2-u11-linea-integracion-4-4.musicxml');
async function page(name: keyof typeof files) { return readFile(path.join(root, files[name]), 'utf8'); }
function fm(md: string) { return md.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function measures(xml: string) { return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((m) => m[1] ?? ''); }
function duration(m: string) { return [...m.matchAll(/<note>([\s\S]*?)<\/note>/g)].reduce((s, n) => s + Number((n[1] ?? '').match(/<duration>(\d+)<\/duration>/)?.[1] ?? 0), 0); }

test('U11 has overview, four lessons and checkpoint in order', async () => {
  for (const [i, key] of (Object.keys(files) as (keyof typeof files)[]).entries()) {
    const data = fm(await page(key));
    assert.match(data, /^phase:\s*2$/m);
    assert.match(data, /^unit:\s*11$/m);
    assert.match(data, new RegExp(`^order:\\s*${i}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f2-u11-check$/m);
});

test('U11 preserves both approved representation cycles and keeps Hito 2 for U12', async () => {
  const overview = await page('overview');
  assert.match(overview, /ESCUCHAR → ESCRIBIR → TOCAR → COMPARAR/);
  assert.match(overview, /VER → CONTAR\/CANTAR → TOCAR → ESCUCHAR/);
  assert.match(overview, /E6 transcripción estructurada extensa no es foco/);
  assert.match(overview, /5\/4, 7\/8, quintillos y 3:2 son sólo ventanas opcionales/);
  const checkpoint = await page('checkpoint');
  assert.match(checkpoint, /No sustituye el Hito 2 de U12/);
  assert.match(checkpoint, /material rítmico nuevo no memorizado previamente/);
});

test('U11 auditory tasks use hidden-answer patterns and checkpoint stimulus is independent', async () => {
  const l1 = await page('l1');
  assert.match(l1, /data-pattern="10110100"/);
  assert.match(l1, /data-pattern="11010110"/);
  assert.match(l1, /ESCUCHA \/ MEMORIA \/ ESCRITURA \/ EJECUCIÓN/);
  const checkpoint = await page('checkpoint');
  assert.match(checkpoint, /data-pattern="10011100"/);
  assert.doesNotMatch(l1, /10011100/);
});

test('U11 score is original, metrically closed and uses only familiar notation', async () => {
  const xml = await readFile(scorePath, 'utf8');
  const bars = measures(xml);
  assert.equal(bars.length, 4);
  assert.deepEqual(bars.map(duration), [48, 48, 48, 48]);
  assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(xml, /<staff-lines>5<\/staff-lines>/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);
  for (const key of ['l2', 'l3', 'l4', 'checkpoint'] as const) {
    const md = await page(key);
    assert.match(md, /data-score-feedback="after-attempt"/);
    assert.doesNotMatch(md, /data-score-first-sight="true"/);
  }
});

test('U11 applies B7 only after reading and distinguishes textural from rhythmic transformation', async () => {
  const l3 = await page('l3');
  assert.match(l3, /LA LÍNEA RÍTMICA MANDA; LA TEXTURA DE MANOS SIRVE A LA LECTURA/);
  assert.match(l3, /COMPRENDO LA LÍNEA → APLICO UNA TEXTURA → LA ESTRUCTURA SOBREVIVE/);
  const l4 = await page('l4');
  assert.match(l4, /Transformación textural/);
  assert.match(l4, /Transformación rítmica relacionada/);
  assert.match(l4, /No la llames “la misma línea”/);
  assert.match(l4, /no es composición formal ni desarrollo motívico profundo de Fase 3/i);
});

test('U11 checkpoint uses the approved inference chain and limits conclusions to observed skills', async () => {
  const checkpoint = await page('checkpoint');
  for (const heading of ['INFERENCIA', 'EVIDENCIA A', 'EVIDENCIA B', 'TAREA Y CONDICIONES', 'DECISIÓN']) assert.match(checkpoint, new RegExp(heading));
  assert.match(checkpoint, /Una muestra parcial sólo actualiza las habilidades realmente observadas/);
  assert.match(checkpoint, /completar U11 en superación del Hito 2/);
  assert.match(checkpoint, /CONTINUAR/);
  assert.match(checkpoint, /CONTINUAR \+ CORRECTIVO/);
  assert.match(checkpoint, /REDUCIR NOVEDAD/);
  assert.match(checkpoint, /DETENER CARGA/);
});

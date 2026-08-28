import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pages = {
  overview: 'f2-u10-overview.md',
  l1: 'f2-u10-l1-cada-pulso-a-2-y-4.md',
  l2: 'f2-u10-l2-half-time-1-y-3.md',
  l3: 'f2-u10-l3-gap-un-compas.md',
  l4: 'f2-u10-l4-elegir-referencia-minima-util.md',
  checkpoint: 'f2-u10-checkpoint-puerta-referencia-interna.md',
} as const;
const contentRoot = path.resolve('src/courses/bateria/content/pages');
const scorePath = path.resolve('public/bateria/notation/f2/u10/f2-u10-linea-controlada-4-4.musicxml');
const metronomePath = path.resolve('src/platform/components/MetronomeCompact.astro');

async function readPage(name: keyof typeof pages) { return readFile(path.join(contentRoot, pages[name]), 'utf8'); }
function frontmatter(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function measures(xml: string) { return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((m) => m[1] ?? ''); }
function metricDuration(measure: string) {
  return [...measure.matchAll(/<note>([\s\S]*?)<\/note>/g)].reduce((sum, match) => {
    const body = match[1] ?? '';
    if (body.includes('<grace')) return sum;
    return sum + Number(body.match(/<duration>(\d+)<\/duration>/)?.[1] ?? 0);
  }, 0);
}

test('Phase 2 U10 keeps reduced reference as the only dominant novelty and orders four lessons plus checkpoint', async () => {
  const expected = [0, 1, 2, 3, 4, 5];
  for (const [index, name] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const markdown = await readPage(name);
    const fm = frontmatter(markdown);
    assert.match(fm, /^phase:\s*2$/m);
    assert.match(fm, /^unit:\s*10$/m);
    assert.match(fm, new RegExp(`^order:\\s*${expected[index]}$`, 'm'));
  }
  const overview = await readPage('overview');
  assert.match(overview, /la cantidad de información temporal que entrega el metrónomo/i);
  assert.match(overview, /No se entra en click reducido por calendario/i);
  assert.match(overview, /DECISIÓN CURRICULAR RAZONADA INFORMADA POR EVIDENCIA EXTRAPOLADA/);
  assert.match(overview, /C6|desplazamiento sistemático del click/);
});

test('U10 uses one deliberately controlled 4/4 reading rather than adding notation difficulty', async () => {
  const xml = await readFile(scorePath, 'utf8');
  const bars = measures(xml);
  assert.equal(bars.length, 4);
  assert.deepEqual(bars.map(metricDuration), [48, 48, 48, 48]);
  assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(xml, /<staff-lines>5<\/staff-lines>/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.doesNotMatch(xml, /<time-modification>|<grace\b|<tremolo\b/);

  for (const name of ['l1', 'l2', 'l3', 'l4', 'checkpoint'] as const) {
    const markdown = await readPage(name);
    assert.ok(markdown.includes('data-score-src="/bateria/notation/f2/u10/f2-u10-linea-controlada-4-4.musicxml"'));
    assert.ok(markdown.includes('data-score-feedback="after-attempt"'));
    assert.ok(!markdown.includes('data-score-first-sight="true"'));
  }
});

test('compact metronome exposes explicit reduced-reference modes and keeps them scoped to 4/4', async () => {
  const source = await readFile(metronomePath, 'utf8');
  assert.match(source, /data-reference/);
  assert.match(source, /value="all"/);
  assert.match(source, /value="two-four"/);
  assert.match(source, /value="half-time"/);
  assert.match(source, /value="gap-one-bar"/);
  assert.match(source, /meterSelect\.value==='4\/4'/);
  assert.match(source, /barIndex%2===0/);
  assert.match(source, /tick\.visualIndex===1\|\|tick\.visualIndex===3/);
  assert.match(source, /tick\.visualIndex===0\|\|tick\.visualIndex===2/);
  assert.match(source, /reference:ReferenceMode/);
});

test('U10 distinguishes tempo change from reference-density change and preserves conditional C5', async () => {
  const l2 = await readPage('l2');
  assert.match(l2, /No uses el botón ÷2 como sustituto/);
  assert.match(l2, /mantiene el BPM interno y reduce la densidad de referencia/);
  const l3 = await readPage('l3');
  assert.match(l3, /GAP → HALF-TIME O CLICK COMPLETO → CORRECTIVO → RETEST/);
  const l4 = await readPage('l4');
  assert.match(l4, /no implica C5 funcional/i);
  const checkpoint = await readPage('checkpoint');
  assert.match(checkpoint, /INFERENCIA/);
  assert.match(checkpoint, /EVIDENCIA/);
  assert.match(checkpoint, /TAREA/);
  assert.match(checkpoint, /CONDICIONES/);
  assert.match(checkpoint, /DECISIÓN/);
  assert.match(checkpoint, /Completar el checkpoint no convierte C5 en `FUNCIONAL`/);
  assert.match(checkpoint, /Puente a U11/);
});

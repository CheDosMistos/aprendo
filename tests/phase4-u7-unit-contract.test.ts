import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const variationPath = path.resolve('public/bateria/notation/f4/u7/f4-u7-l2-kick-variation-b.musicxml');
const phrasePath = path.resolve('public/bateria/notation/f4/u7/f4-u7-l3-aaba-phrase.musicxml');
const pages = {
  overview: 'f4-u7-overview.md',
  l1: 'f4-u7-l1-sostener-groove-a.md',
  l2: 'f4-u7-l2-variacion-bombo.md',
  l3: 'f4-u7-l3-aaba-variar-volver.md',
  l4: 'f4-u7-l4-grabar-comparar.md',
  checkpoint: 'f4-u7-checkpoint-h5-minimo.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F4 U7 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*7$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-7$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u7-check$/m);
});

test('overview makes H5 minimum explicit and keeps competent H5 H4 and H7 open', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /Mantiene grooves básicos estables/i);
  assert.match(overview, /Variación B/i);
  assert.match(overview, /A–A–B–A/i);
  assert.match(overview, /no certifica H5 COMPETENTE\/FUNCIONAL, H4 COMPETENTE\/FUNCIONAL ni H7/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 reuses the known four-limb groove and adds no rhythmic material', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /f4-u5-l4-four-limb-bridge-a\.musicxml/);
  assert.match(l1, /No hay material rítmico nuevo/i);
  assert.match(l1, /Modo interpretación/i);
  assert.match(l1, /Modo laboratorio/i);
  assert.match(l1, /Recompón el groove completo pronto/i);
});

test('L2 changes exactly one kick event and keeps H7 separate', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /f4-u7-l2-kick-variation-b\.musicxml/);
  assert.match(l2, /ride: ocho corcheas/i);
  assert.match(l2, /caja: 2 y 4/i);
  assert.match(l2, /bombo: 1, 3 y & de 3/i);
  assert.match(l2, /pie izquierdo: chick en 2 y 4/i);
  assert.match(l2, /sólo se añade una nota de bombo en el & de 3/i);
  assert.match(l2, /U7 no certifica H7/i);
  assert.match(l2, /120 BPM como referencia técnica del curso/i);
});

test('L3 makes the variation formal and requires return to A', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /f4-u7-l3-aaba-phrase\.musicxml/);
  assert.match(l3, /A–A–B–A/i);
  assert.match(l3, /GROOVE → VARIACIÓN → RETORNO/i);
  assert.match(l3, /tiempo 1 del compás 4/i);
  assert.match(l3, /recompón A–A–B–A inmediatamente/i);
});

test('L4 uses recording as targeted feedback, not a global score', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /f4-u5-l4-four-limb-bridge-a\.musicxml/);
  assert.match(l4, /f4-u7-l3-aaba-phrase\.musicxml/);
  assert.match(l4, /Elige 1–2 prioridades/i);
  assert.match(l4, /OBSERVACIÓN → HIPÓTESIS → CAMBIO DE UNA VARIABLE → NUEVA TOMA/i);
  assert.match(l4, /segunda variación dinámica/i);
  assert.match(l4, /no es requisito del checkpoint/i);
});

test('checkpoint certifies H5 minimum only and preserves later-unit boundaries', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /Mantiene grooves básicos estables/i);
  assert.match(cp, /f4-u5-l4-four-limb-bridge-a\.musicxml/);
  assert.match(cp, /f4-u7-l2-kick-variation-b\.musicxml/);
  assert.match(cp, /f4-u7-l3-aaba-phrase\.musicxml/);
  assert.match(cp, /vuelves a A tras la variación/i);
  assert.match(cp, /H5 — COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /H4 — COMPETENTE\/FUNCIONAL global/i);
  assert.match(cp, /H7 — independencia/i);
  assert.match(cp, /H6 — fills/i);
  assert.match(cp, /B8\/G5 — orquestación focal de U8/i);
  assert.match(cp, /No existe BPM de aprobado/i);
  assert.match(cp, /La perfección no es requisito/i);
});

test('Variation B score is original, complete and adds one kick to Groove A', async () => {
  const xml = await readFile(variationPath, 'utf8');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.match(xml, /<instrument-name>Ride Cymbal 1<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Snare Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Pedal Hi-Hat<\/instrument-name>/);
  assert.match(xml, /<midi-unpitched>51<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>39<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>36<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>44<\/midi-unpitched>/);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 8);
  assert.equal((xml.match(/<instrument id="P1-I2"\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 3);
  assert.equal((xml.match(/<instrument id="P1-I4"\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<backup><duration>48<\/duration><\/backup>/g) ?? []).length, 2);
  assert.equal((xml.match(/<rest\/>/g) ?? []).length, 2);
});

test('AABA score has four complete measures, B only in measure 3, and return A in measure 4', async () => {
  const xml = await readFile(phrasePath, 'utf8');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.equal((xml.match(/<measure number=/g) ?? []).length, 4);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 32);
  assert.equal((xml.match(/<instrument id="P1-I2"\/>/g) ?? []).length, 8);
  assert.equal((xml.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 9);
  assert.equal((xml.match(/<instrument id="P1-I4"\/>/g) ?? []).length, 8);
  assert.equal((xml.match(/<backup><duration>48<\/duration><\/backup>/g) ?? []).length, 8);
  const m3 = xml.match(/<measure number="3">([\s\S]*?)<\/measure>/)?.[1] ?? '';
  const m4 = xml.match(/<measure number="4">([\s\S]*?)<\/measure>/)?.[1] ?? '';
  assert.equal((m3.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 3);
  assert.equal((m4.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 2);
  assert.match(m3, /B — bombo extra en &amp; de 3/);
  assert.match(m4, /A — retorno/);
});

test('U6 remains H4-minimum-only after U7 adds H5 certification', async () => {
  const u6 = plain(await readFile(path.join(pagesRoot, 'f4-u6-checkpoint-h4-minimo.md'), 'utf8'));
  assert.match(u6, /H5 — COMPETENTE\/FUNCIONAL/i);
  assert.match(u6, /H7 — independencia/i);
});
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const scorePath = path.resolve('public/bateria/notation/f4/u6/f4-u6-l3-four-limb-b.musicxml');
const pages = {
  overview: 'f4-u6-overview.md',
  l1: 'f4-u6-l1-patron-completo.md',
  l2: 'f4-u6-l2-diagnostico-extremidad.md',
  l3: 'f4-u6-l3-una-capa-cambia.md',
  l4: 'f4-u6-l4-recuperacion-transferencia.md',
  checkpoint: 'f4-u6-checkpoint-h4-minimo.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F4 U6 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*6$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-6$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u6-check$/m);
});

test('overview makes H4 minimum explicit and separates it from H7', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /Coordina patrones sencillos sin perder pulso/i);
  assert.match(overview, /Patrón A/i);
  assert.match(overview, /Patrón B/i);
  assert.match(overview, /Sólo cambia una capa/i);
  assert.match(overview, /U6 no certifica H7/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 reuses U5 four-limb material rather than duplicating a score', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /f4-u5-l4-four-limb-bridge-a\.musicxml/);
  assert.match(l1, /No hay material rítmico nuevo/i);
  assert.match(l1, /Recompón las cuatro extremidades pronto/i);
  assert.match(l1, /práctica por partes es un correctivo/i);
});

test('L2 diagnoses a specific limb or transition and has no score', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /ANTICIPA \/ ARRASTRA \/ DESAPARECE \/ DUPLICA/i);
  assert.match(l2, /PATRÓN COMPLETO → localizar unión → aislar sólo si hace falta → practicar unión → RECOMPONER/i);
  assert.match(l2, /síntoma observado/i);
  assert.match(l2, /hipótesis de causa/i);
  assert.doesNotMatch(l2, /data-notation-score|\.musicxml/);
});

test('L3 changes only the left-foot layer and keeps H7 open', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /f4-u6-l3-four-limb-b\.musicxml/);
  assert.match(l3, /ride: ocho corcheas/i);
  assert.match(l3, /caja: 2 y 4/i);
  assert.match(l3, /bombo: 1 y 3/i);
  assert.match(l3, /pie izquierdo: chick en negras 1–2–3–4/i);
  assert.match(l3, /sólo cambia el pie izquierdo/i);
  assert.match(l3, /U6 no certifica H7/i);
  assert.match(l3, /120 BPM como referencia técnica del curso/i);
});

test('L4 tests retrieval and transfer by fixed blocks, not free variation', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /f4-u5-l4-four-limb-bridge-a\.musicxml/);
  assert.match(l4, /f4-u6-l3-four-limb-b\.musicxml/);
  assert.match(l4, /no practiques inmediatamente el patrón que vas a probar/i);
  assert.match(l4, /Transferencia por bloques/i);
  assert.match(l4, /Alternar dos patrones fijos/i);
  assert.match(l4, /No certifica H7/i);
});

test('checkpoint certifies H4 minimum but not competent H4 H5 or H7', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /Coordina patrones sencillos sin perder pulso/i);
  assert.match(cp, /f4-u5-l4-four-limb-bridge-a\.musicxml/);
  assert.match(cp, /f4-u6-l3-four-limb-b\.musicxml/);
  assert.match(cp, /No es obligatorio ejecutar A→B sin pausa/i);
  assert.match(cp, /H4 — COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /H5 — COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /H7 — independencia/i);
  assert.match(cp, /No existe BPM de aprobado/i);
  assert.match(cp, /La perfección no es requisito/i);
});

test('Pattern B score is original, reference-tempo compliant and metrically complete in three voices', async () => {
  const xml = await readFile(scorePath, 'utf8');
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
  assert.equal((xml.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<instrument id="P1-I4"\/>/g) ?? []).length, 4);
  assert.equal((xml.match(/<backup><duration>48<\/duration><\/backup>/g) ?? []).length, 2);
  assert.equal((xml.match(/<voice>1<\/voice>/g) ?? []).length, 8);
  assert.equal((xml.match(/<voice>2<\/voice>/g) ?? []).length, 4);
  assert.equal((xml.match(/<voice>3<\/voice>/g) ?? []).length, 4);
  assert.doesNotMatch(xml, /<rest\/>/);
});

test('U5 checkpoint still does not certify H4 minimum after U6 is added', async () => {
  const u5 = plain(await readFile(path.join(pagesRoot, 'f4-u5-checkpoint-primer-groove-estable.md'), 'utf8'));
  assert.match(u5, /no certifica H4 MÍNIMO/i);
  assert.match(u5, /H5 — COMPETENTE\/FUNCIONAL/i);
});

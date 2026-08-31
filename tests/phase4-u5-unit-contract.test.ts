import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f4/u5');
const pages = {
  overview: 'f4-u5-overview.md',
  l1: 'f4-u5-l1-esqueleto-tres-extremidades.md',
  l2: 'f4-u5-l2-coincidencias-diagnostico.md',
  l3: 'f4-u5-l3-continuidad-recuperacion.md',
  l4: 'f4-u5-l4-puente-cuatro-extremidades.md',
  checkpoint: 'f4-u5-checkpoint-primer-groove-estable.md',
} as const;
const scores = {
  base: 'f4-u5-l1-groove-base-a.musicxml',
  fourBars: 'f4-u5-l3-groove-base-a-4bars.musicxml',
  fourLimbs: 'f4-u5-l4-four-limb-bridge-a.musicxml',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
async function score(key: keyof typeof scores) { return readFile(path.join(notationRoot, scores[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }
function measures(xml: string) { return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((match) => match[1]); }

test('F4 U5 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*5$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-5$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u5-check$/m);
});

test('overview defines a neutral three-limb groove and keeps H4 uncertified', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /PATRÓN APRENDIDO ≠ GROOVE ESTABLE/i);
  assert.match(overview, /hi-hat cerrado en corcheas/i);
  assert.match(overview, /caja en 2 y 4/i);
  assert.match(overview, /bombo en 1 y 3/i);
  assert.match(overview, /tres extremidades activas/i);
  assert.match(overview, /No se atribuye a una canción, baterista, estilo o método/i);
  assert.match(overview, /no certifica H4 MÍNIMO/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 builds Groove Base A by layers without left-foot motion', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /f4-u5-l1-groove-base-a\.musicxml/);
  assert.match(l1, /voz de tiempo.*hi-hat cerrado en ocho corcheas/is);
  assert.match(l1, /voz de soporte.*bombo en 1 y 3, caja en 2 y 4/is);
  assert.match(l1, /No hay pie izquierdo en movimiento/i);
  assert.match(l1, /práctica por partes sirve para diagnosticar.*no es el destino final/is);
  assert.match(l1, /No existe BPM de aprobado/i);
});

test('L2 isolates only failing coincidences and returns to the whole groove', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /1: hi-hat \+ bombo/i);
  assert.match(l2, /2: hi-hat \+ caja/i);
  assert.match(l2, /los & mantienen sólo la mano de tiempo/i);
  assert.match(l2, /Recompón inmediatamente el compás completo/i);
  assert.match(l2, /usar partes cuando reduzcan una complejidad relevante y volver pronto al conjunto/i);
  assert.doesNotMatch(l2, /data-notation-score|\.musicxml/);
});

test('L3 turns one bar into four-bar continuity and recovery', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /f4-u5-l3-groove-base-a-4bars\.musicxml/);
  assert.match(l3, /repite el mismo Groove Base A durante cuatro compases/i);
  assert.match(l3, /No hay variaciones/i);
  assert.match(l3, /Modo laboratorio/i);
  assert.match(l3, /Modo interpretación/i);
  assert.match(l3, /no obliga siempre a parar/i);
});

test('L4 is optional four-limb exposure and does not certify H4', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /AMPLIACIÓN — no requisito del checkpoint U5/i);
  assert.match(l4, /f4-u5-l4-four-limb-bridge-a\.musicxml/);
  assert.match(l4, /mano derecha.*ride en corcheas/is);
  assert.match(l4, /bombo en 1\/3 y caja en 2\/4/is);
  assert.match(l4, /pie izquierdo.*chick de hi-hat en 2 y 4/is);
  assert.match(l4, /no certifica H4 MÍNIMO ni H7/i);
});

test('checkpoint evaluates a local first groove without overstating H4 or H5', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /primer groove estable en la condición practicada de tres extremidades/i);
  assert.match(cp, /f4-u5-l1-groove-base-a\.musicxml/);
  assert.match(cp, /f4-u5-l3-groove-base-a-4bars\.musicxml/);
  assert.match(cp, /no certifica H4 MÍNIMO/i);
  assert.match(cp, /H5 — COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /H7 — independencia/i);
  assert.match(cp, /No existe BPM de aprobado/i);
  assert.match(cp, /La perfección no es requisito para continuar/i);
});

test('Groove Base A score is original, complete and has three sounding limbs', async () => {
  const xml = await score('base');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<instrument-name>Closed Hi-Hat<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Snare Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
  assert.match(xml, /<midi-unpitched>42<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>39<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>36<\/midi-unpitched>/);
  assert.doesNotMatch(xml, /Pedal Hi-Hat|Ride Cymbal/i);
  const ms = measures(xml);
  assert.equal(ms.length, 1);
  assert.equal((ms[0].match(/<instrument id="P1-I1"\/>/g) ?? []).length, 8);
  assert.equal((ms[0].match(/<instrument id="P1-I2"\/>/g) ?? []).length, 2);
  assert.equal((ms[0].match(/<instrument id="P1-I3"\/>/g) ?? []).length, 2);
  assert.match(ms[0], /<backup><duration>48<\/duration><\/backup>/);
  assert.equal((ms[0].match(/<voice>1<\/voice>/g) ?? []).length, 8);
  assert.equal((ms[0].match(/<voice>2<\/voice>/g) ?? []).length, 4);
});

test('four-bar score repeats the same complete groove without variations', async () => {
  const xml = await score('fourBars');
  const ms = measures(xml);
  assert.equal(ms.length, 4);
  for (const measure of ms) {
    assert.equal((measure.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 8);
    assert.equal((measure.match(/<instrument id="P1-I2"\/>/g) ?? []).length, 2);
    assert.equal((measure.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 2);
    assert.match(measure, /<backup><duration>48<\/duration><\/backup>/);
  }
});

test('four-limb bridge score contains ride, snare, kick and pedal hi-hat in three voices', async () => {
  const xml = await score('fourLimbs');
  assert.match(xml, /<instrument-name>Ride Cymbal 1<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Snare Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Pedal Hi-Hat<\/instrument-name>/);
  assert.match(xml, /<midi-unpitched>51<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>44<\/midi-unpitched>/);
  const ms = measures(xml);
  assert.equal(ms.length, 1);
  assert.equal((ms[0].match(/<instrument id="P1-I1"\/>/g) ?? []).length, 8);
  assert.equal((ms[0].match(/<instrument id="P1-I2"\/>/g) ?? []).length, 2);
  assert.equal((ms[0].match(/<instrument id="P1-I3"\/>/g) ?? []).length, 2);
  assert.equal((ms[0].match(/<instrument id="P1-I4"\/>/g) ?? []).length, 2);
  assert.equal((ms[0].match(/<backup><duration>48<\/duration><\/backup>/g) ?? []).length, 2);
  assert.equal((ms[0].match(/<voice>1<\/voice>/g) ?? []).length, 8);
  assert.equal((ms[0].match(/<voice>2<\/voice>/g) ?? []).length, 4);
  assert.equal((ms[0].match(/<voice>3<\/voice>/g) ?? []).length, 4);
  assert.equal((ms[0].match(/<rest\/>/g) ?? []).length, 2);
});

test('U4 remains an H3 checkpoint and does not become groove certification', async () => {
  const u4 = plain(await readFile(path.join(pagesRoot, 'f4-u4-checkpoint-hihat-pie-disponible.md'), 'utf8'));
  assert.match(u4, /H3 MÍNIMO/);
  assert.match(u4, /H5 — groove funcional/i);
  assert.match(u4, /No es requisito para iniciar U5/i);
});

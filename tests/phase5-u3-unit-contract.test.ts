import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const scorePath = path.resolve('public/bateria/notation/f5/u3/f5-u3-l1-eighth-backbeat-core.musicxml');
const pages = {
  overview: 'f5-u3-overview.md',
  l1: 'f5-u3-l1-backbeat-corcheas.md',
  l2: 'f5-u3-l2-energia-articulacion-dinamica.md',
  l3: 'f5-u3-l3-punk-continuidad-economia.md',
  l4: 'f5-u3-l4-pieza-a-energia-forma.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F5 U3 has overview and four lessons in order with no invented checkpoint', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*5$/m);
    assert.match(frontmatter, /^unit:\s*3$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-5-unidad-3$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  const joined = (await Promise.all(keys.map(page))).join('\n');
  assert.doesNotMatch(joined, /^kind:\s*checkpoint$/m);
});

test('overview makes I2 H5 dominant and rejects style clichés', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /Novedad dominante: I2 \/ H5/i);
  assert.match(overview, /ESTILO ≠ PATRÓN/i);
  assert.match(overview, /arquetipo pedagógico/i);
  assert.match(overview, /ENERGÍA ≠ BPM ALTO ≠ VOLUMEN MÁXIMO/i);
  assert.match(overview, /Punk no se define aquí como/i);
  assert.match(overview, /No exige doble pedal, blast beat ni patrones rápidos de bombo/i);
  assert.match(overview, /no declara rock, pop o punk dominados/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 uses one original two-bar eighth-note backbeat score and documents source limits', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /f5-u3-l1-eighth-backbeat-core\.musicxml/);
  assert.match(l1, /hi-hat cerrado: corcheas continuas/i);
  assert.match(l1, /caja: 2 y 4/i);
  assert.match(l1, /bombo: 1 y 3/i);
  assert.match(l1, /arquetipo pedagógico de entrada/i);
  assert.match(l1, /no convierten el ejercicio en un estándar universal de rock/i);
  assert.match(l1, /Vic Firth/i);
  assert.match(l1, /Berklee Online/i);
});

test('L2 changes expressive energy without changing rhythmic vocabulary', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /ENERGÍA ≠ BPM ALTO ≠ VOLUMEN MÁXIMO/i);
  assert.match(l2, /A: mf/i);
  assert.match(l2, /B: f/i);
  assert.match(l2, /El ritmo principal permanece igual/i);
  assert.match(l2, /No cambies simultáneamente bombo, fill, tempo y articulación/i);
  assert.match(l2, /Intentar “sonar rock” golpeando más fuerte con todo el cuerpo/i);
});

test('L3 teaches punk as continuity and economy, not speed', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /Marky Ramone/i);
  assert.match(l3, /Sex Pistols/i);
  assert.match(l3, /no define punk como “tocar muy rápido”/i);
  assert.match(l3, /8 compases/i);
  assert.match(l3, /economía de movimiento/i);
  assert.match(l3, /Fill A conocido/i);
  assert.match(l3, /doble-time preparado/i);
  assert.match(l3, /no forma parte del mínimo/i);
});

test('L4 integrates Piece A and Chart A while keeping metal optional', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /f5-u1-piece-a-form-i\.musicxml/);
  assert.match(l4, /Chart A — navegación/i);
  assert.match(l4, /INTRO.*mp/is);
  assert.match(l4, /A1.*mf/is);
  assert.match(l4, /B1.*f/is);
  assert.match(l4, /TIEMPO → FORMA → FEEL → DINÁMICA → CUE → DETALLE/i);
  assert.match(l4, /Ventana metal — AMPLIACIÓN/i);
  assert.match(l4, /No añadas:[\s\S]*doble pedal/i);
  assert.match(l4, /no declara rock, pop o punk dominados/i);
});

test('U3 core score is original, audible, metrically complete and two identical bars', async () => {
  const xml = await readFile(scorePath, 'utf8');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.match(xml, /<instrument-name>Closed Hi-Hat<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Snare Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
  assert.match(xml, /<midi-unpitched>42<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>39<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>36<\/midi-unpitched>/);
  assert.equal((xml.match(/<measure number=/g) ?? []).length, 2);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 16);
  assert.equal((xml.match(/<instrument id="P1-I2"\/>/g) ?? []).length, 4);
  assert.equal((xml.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 4);
  assert.equal((xml.match(/<backup><duration>48<\/duration><\/backup>/g) ?? []).length, 2);
});

test('U2 D7 checkpoint remains prepared-condition only after U3', async () => {
  const u2 = plain(await readFile(path.join(pagesRoot, 'f5-u2-checkpoint-d7-minimo.md'), 'utf8'));
  assert.match(u2, /D7 MÍNIMO en condición preparada/i);
  assert.match(u2, /D7 COMPETENTE\/FUNCIONAL/i);
  assert.match(u2, /I4 COMPETENTE\/FUNCIONAL/i);
});
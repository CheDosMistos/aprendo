import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const scorePath = path.resolve('public/bateria/notation/f4/u10/f4-u10-hito5-integration.musicxml');
const pages = {
  overview: 'f4-u10-overview.md',
  l1: 'f4-u10-l1-recuperar-cadena.md',
  l2: 'f4-u10-l2-variacion-retorno.md',
  l3: 'f4-u10-l3-fill-retorno.md',
  l4: 'f4-u10-l4-ensayo-grabacion.md',
  checkpoint: 'f4-u10-checkpoint-hito5.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

const HITO = 'Mantener un groove básico estable mientras introduce pequeñas variaciones y fills sin perder forma ni pulso.';

test('F4 U10 has overview, four lessons and Hito 5 checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*10$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-10$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u10-check$/m);
});

test('overview preserves the literal Hito 5 and adds no new advanced gate', async () => {
  const overview = plain(await page('overview'));
  assert.ok(overview.includes(HITO));
  assert.match(overview, /INTEGRAR NO ES HACERLO MÁS DIFÍCIL/i);
  assert.match(overview, /configuración y escucha segura de U1/i);
  assert.match(overview, /Variación B de U7/i);
  assert.match(overview, /Fill A y retorno al 1 de U9/i);
  assert.match(overview, /independencia H7/i);
  assert.match(overview, /5\/4 o 7\/8/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 recovers three known components instead of reteaching the phase', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /RECUPERAR → DIAGNOSTICAR → CORREGIR UNA VARIABLE → RECOMPONER/i);
  assert.match(l1, /f4-u5-l4-four-limb-bridge-a\.musicxml/);
  assert.match(l1, /f4-u7-l2-kick-variation-b\.musicxml/);
  assert.match(l1, /f4-u9-l1-one-beat-fill-return\.musicxml/);
  assert.match(l1, /Un fallo local no invalida un cierre anterior/i);
  assert.equal((l1.match(/data-notation-score/g) ?? []).length, 3);
});

test('L2 isolates H5 before the fill is added', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /GROOVE → PEQUEÑA VARIACIÓN → GROOVE/i);
  assert.match(l2, /f4-u7-l3-aaba-phrase\.musicxml/);
  assert.match(l2, /bombo en & de 3/i);
  assert.match(l2, /No añadas Fill A/i);
  assert.match(l2, /No existe BPM de aprobado/i);
});

test('L3 isolates H6 with the known one-beat fill', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /GROOVE → FILL → 1 → GROOVE/i);
  assert.match(l3, /f4-u9-l1-one-beat-fill-return\.musicxml/);
  assert.match(l3, /Fill A ocupa sólo 4 &/i);
  assert.match(l3, /El Hito necesita un fill breve, no el fill más difícil/i);
  assert.match(l3, /No añadas Variación B durante este correctivo/i);
});

test('L4 integrates the exact known functions and uses recording for diagnosis', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /f4-u10-hito5-integration\.musicxml/);
  assert.match(l4, /A → VARIACIÓN → A → FILL → A/i);
  assert.match(l4, /bombo añadido en & de 3/i);
  assert.match(l4, /Fill A: groove en tiempos 1–3 y fill 4 &/i);
  assert.match(l4, /PULSO \/ SUBDIVISIÓN \/ GROOVE \/ VARIACIÓN \/ FILL \/ 1 \/ BALANCE \/ RECUPERACIÓN \/ TENSIÓN/i);
  assert.match(l4, /El Hito 5 no es una prueba de independencia H7/i);
  assert.match(l4, /No existe BPM de aprobado/i);
});

test('checkpoint preserves literal Hito and multidimensional minimum', async () => {
  const cp = plain(await page('checkpoint'));
  assert.ok(cp.includes(HITO));
  assert.match(cp, /f4-u10-hito5-integration\.musicxml/);
  assert.match(cp, /A → VARIACIÓN → A → FILL → A/i);
  assert.match(cp, /no se exige mantener el pie izquierdo durante el fill/i);
  assert.match(cp, /explicas al menos un material previo/i);
  assert.match(cp, /grabación o evidencia equivalente/i);
  assert.match(cp, /H4 COMPETENTE\/FUNCIONAL global/i);
  assert.match(cp, /H5 COMPETENTE\/FUNCIONAL global/i);
  assert.match(cp, /H6 COMPETENTE\/FUNCIONAL global/i);
  assert.match(cp, /No existe BPM de aprobado/i);
});

test('integrated Hito score is five complete measures with known layers and one fill', async () => {
  const xml = await readFile(scorePath, 'utf8');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.equal((xml.match(/<measure number="/g) ?? []).length, 5);
  assert.equal((xml.match(/<backup><duration>48<\/duration><\/backup>/g) ?? []).length, 10);
  assert.match(xml, /<instrument-name>Ride Cymbal 1<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Snare Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>High Tom<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Pedal Hi-Hat<\/instrument-name>/);
  assert.match(xml, /<midi-unpitched>51<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>39<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>48<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>36<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>44<\/midi-unpitched>/);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 38);
  assert.equal((xml.match(/<instrument id="P1-I2"\/>/g) ?? []).length, 10);
  assert.equal((xml.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 1);
  assert.equal((xml.match(/<instrument id="P1-I4"\/>/g) ?? []).length, 11);
  assert.equal((xml.match(/<instrument id="P1-I5"\/>/g) ?? []).length, 9);
  assert.equal((xml.match(/<lyric><text>R<\/text><\/lyric>/g) ?? []).length, 1);
  assert.equal((xml.match(/<lyric><text>L<\/text><\/lyric>/g) ?? []).length, 1);
  assert.match(xml, /<measure number="5">[\s\S]*?<lyric><text>1<\/text><\/lyric>/);
});

test('U9 checkpoint remains H6-minimum-only when U10 integrates Hito 5', async () => {
  const u9 = plain(await readFile(path.join(pagesRoot, 'f4-u9-checkpoint-h6-minimo.md'), 'utf8'));
  assert.match(u9, /H6 MÍNIMO/i);
  assert.match(u9, /H6 COMPETENTE\/FUNCIONAL/i);
  assert.match(u9, /U9 NO certifica H7/i);
});
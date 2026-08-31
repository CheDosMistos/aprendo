import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f4/u9');
const pages = {
  overview: 'f4-u9-overview.md',
  l1: 'f4-u9-l1-fill-a-un-tiempo.md',
  l2: 'f4-u9-l2-fill-b-dos-tiempos.md',
  l3: 'f4-u9-l3-misma-duracion-otra-orquestacion.md',
  l4: 'f4-u9-l4-recuperacion-ventana-h7.md',
  checkpoint: 'f4-u9-checkpoint-h6-minimo.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F4 U9 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*9$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-9$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u9-check$/m);
});

test('overview makes H6 dominant and keeps H7 as a window only', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /Novedad dominante: H6 — transición funcional/i);
  assert.match(overview, /FILL = TRANSICIÓN, NO EXHIBICIÓN/i);
  assert.match(overview, /Fill A — 1 tiempo/i);
  assert.match(overview, /Fill B — 2 tiempos/i);
  assert.match(overview, /GROOVE → FILL → 1 → GROOVE/i);
  assert.match(overview, /puede certificar H6 MÍNIMO/i);
  assert.match(overview, /no certifica H6 COMPETENTE\/FUNCIONAL ni H7/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 defines a one-beat fill and makes the following 1 mandatory', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /f4-u9-l1-one-beat-fill-return\.musicxml/);
  assert.match(l1, /4: caja — R/i);
  assert.match(l1, /tom agudo — L/i);
  assert.match(l1, /siguiente evento obligatorio: tiempo 1/i);
  assert.match(l1, /la versión CORE no exige un ostinato continuo del pie izquierdo/i);
  assert.match(l1, /Si el fill sale pero el siguiente 1 desaparece/i);
  assert.match(l1, /No existe BPM de aprobado/i);
});

test('L2 extends duration using known U2 U8 hand vocabulary', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /f4-u9-l2-two-beat-fill-return\.musicxml/);
  assert.match(l2, /3 &:? 4 & → 1|3 & 4 & → 1/i);
  assert.match(l2, /tom agudo — R/i);
  assert.match(l2, /caja — L/i);
  assert.match(l2, /tom grave — R/i);
  assert.match(l2, /mismo tipo de movimiento de corcheas y sticking R\/L trabajado en U2\/U8/i);
  assert.match(l2, /No existe BPM de aprobado/i);
});

test('L3 changes orchestration without changing rhythm duration or landing', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /MISMO RITMO \+ MISMA DURACIÓN \+ MISMO 1 → CAMBIO TÍMBRICO LIMITADO/i);
  assert.match(l3, /f4-u9-l2-two-beat-fill-return\.musicxml/);
  assert.match(l3, /Cambia sólo 1–2 ataques/i);
  assert.match(l3, /ACENTO ≠ SUPERFICIE/i);
  assert.match(l3, /DURACIÓN \/ PULSO \/ TIMBRE \/ MOVIMIENTO \/ 1 \/ RECUPERACIÓN/i);
  assert.equal((l3.match(/data-notation-score/g) ?? []).length, 1);
});

test('L4 prioritizes recovery and labels H7 as optional exposure', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /NO CONVERTIR UN ERROR DEL FILL EN LA PÉRDIDA DEL COMPÁS SIGUIENTE/i);
  assert.match(l4, /f4-u9-l2-two-beat-fill-return\.musicxml/);
  assert.match(l4, /f4-u9-l4-left-foot-window\.musicxml/);
  assert.match(l4, /AMPLIACIÓN — ventana H7/i);
  assert.match(l4, /pedal hi-hat en negras continuas/i);
  assert.match(l4, /U9 NO certifica H7/i);
  assert.match(l4, /Una exposición no equivale a una competencia funcional/i);
  assert.equal((l4.match(/data-notation-score/g) ?? []).length, 2);
});

test('checkpoint certifies H6 minimum only and requires the return to groove', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /H6 MÍNIMO/i);
  assert.match(cp, /Inserta fills sencillos sin perder el pulso/i);
  assert.match(cp, /GROOVE → FILL → 1 → GROOVE/i);
  assert.match(cp, /No necesitas ejecutar los dos/i);
  assert.match(cp, /f4-u9-l1-one-beat-fill-return\.musicxml/);
  assert.match(cp, /f4-u9-l2-two-beat-fill-return\.musicxml/);
  assert.match(cp, /H6 COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /U9 NO certifica H7/i);
  assert.match(cp, /No existe BPM de aprobado/i);
  assert.equal((cp.match(/data-notation-score/g) ?? []).length, 2);
});

test('CORE scores contain the following measure and omit Pedal Hi-Hat', async () => {
  const l1 = await readFile(path.join(notationRoot, 'f4-u9-l1-one-beat-fill-return.musicxml'), 'utf8');
  const l2 = await readFile(path.join(notationRoot, 'f4-u9-l2-two-beat-fill-return.musicxml'), 'utf8');
  for (const xml of [l1, l2]) {
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.match(xml, /<sound tempo="120"\/>/);
    assert.match(xml, /<measure number="1">/);
    assert.match(xml, /<measure number="2">/);
    assert.match(xml, /<lyric><text>1<\/text><\/lyric>/);
    assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
    assert.doesNotMatch(xml, /<instrument-name>Pedal Hi-Hat<\/instrument-name>/);
    assert.equal((xml.match(/<backup><duration>48<\/duration><\/backup>/g) ?? []).length, 2);
  }
  assert.match(l1, /<instrument-name>High Tom<\/instrument-name>/);
  assert.equal((l1.match(/<lyric><text>R<\/text><\/lyric>/g) ?? []).length, 1);
  assert.equal((l1.match(/<lyric><text>L<\/text><\/lyric>/g) ?? []).length, 1);
  assert.match(l2, /<instrument-name>High Tom<\/instrument-name>/);
  assert.match(l2, /<instrument-name>Low Tom<\/instrument-name>/);
  assert.equal((l2.match(/<lyric><text>R<\/text><\/lyric>/g) ?? []).length, 2);
  assert.equal((l2.match(/<lyric><text>L<\/text><\/lyric>/g) ?? []).length, 2);
});

test('H7 window score adds one continuous quarter-note left-foot layer', async () => {
  const xml = await readFile(path.join(notationRoot, 'f4-u9-l4-left-foot-window.musicxml'), 'utf8');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO — AMPLIACIÓN/);
  assert.match(xml, /<instrument-name>Pedal Hi-Hat<\/instrument-name>/);
  assert.match(xml, /<midi-unpitched>44<\/midi-unpitched>/);
  assert.equal((xml.match(/<instrument id="P1-I6"\/>/g) ?? []).length, 8);
  assert.equal((xml.match(/<voice>3<\/voice>/g) ?? []).length, 8);
  assert.equal((xml.match(/<backup><duration>48<\/duration><\/backup>/g) ?? []).length, 4);
});

test('U8 checkpoint remains explicitly pre-H6 after U9', async () => {
  const u8 = plain(await readFile(path.join(pagesRoot, 'f4-u8-checkpoint-g5-b8-transferencia.md'), 'utf8'));
  assert.match(u8, /H6 — fills/i);
  assert.match(u8, /H7 — independencia/i);
});
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const scorePath = path.resolve('public/bateria/notation/f4/u8/f4-u8-l2-orchestration-feet.musicxml');
const pages = {
  overview: 'f4-u8-overview.md',
  l1: 'f4-u8-l1-recuperar-identidad-superficies.md',
  l2: 'f4-u8-l2-pies-base-orquestacion.md',
  l3: 'f4-u8-l3-elegir-superficies.md',
  l4: 'f4-u8-l4-motivo-propio-al-kit.md',
  checkpoint: 'f4-u8-checkpoint-g5-b8-transferencia.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F4 U8 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*8$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-8$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u8-check$/m);
});

test('overview makes B8 G5 dominant and keeps H6 H7 outside U8', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /Novedad dominante: B8 \/ G5/i);
  assert.match(overview, /Una frase conocida debe seguir siendo reconocible/i);
  assert.match(overview, /bombo en 1 y 3/i);
  assert.match(overview, /chick de hi-hat de pie en 2 y 4/i);
  assert.match(overview, /no certifica B8 COMPETENTE, G5 COMPETENTE, H6 ni H7/i);
  assert.match(overview, /ACENTO ≠ SUPERFICIE/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 reuses verified U2 timbre scores and adds no feet', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /f4-u2-l3-accent-timbre\.musicxml/);
  assert.match(l1, /f4-u2-l4-three-surfaces\.musicxml/);
  assert.match(l1, /ocho corcheas/i);
  assert.match(l1, /sticking alternado R\/L/i);
  assert.match(l1, /Hoy no añadas pies todavía/i);
  assert.match(l1, /ACENTO ≠ SUPERFICIE/i);
});

test('L2 adds only the known foot base under the known hand orchestration', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /f4-u8-l2-orchestration-feet\.musicxml/);
  assert.match(l2, /ocho corcheas exactamente como U2\.L4/i);
  assert.match(l2, /bombo: 1 y 3/i);
  assert.match(l2, /pedal hi-hat: 2 y 4/i);
  assert.match(l2, /Los pies no reciben vocabulario nuevo/i);
  assert.match(l2, /No existe BPM de aprobado/i);
});

test('L3 requires a musical reason and preserves accent-surface distinction', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /f4-u2-l3-accent-timbre\.musicxml/);
  assert.match(l3, /f4-u2-l4-three-surfaces\.musicxml/);
  assert.match(l3, /TIMBRE \/ CLARIDAD \/ MOVIMIENTO \/ DINÁMICA \/ FUNCIÓN \/ COSTE FÍSICO/i);
  assert.match(l3, /Cambiar sticking deliberadamente es una decisión de B8/i);
  assert.match(l3, /un único acento/i);
  assert.match(l3, /No hace falta crear un nuevo MusicXML/i);
});

test('L4 transfers a real previous personal motif without inventing its score', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /tu motivo es el material fuente/i);
  assert.match(l4, /Inventar uno nuevo y presentarlo como tu composición anterior rompería la continuidad/i);
  assert.match(l4, /1–2 ataques/i);
  assert.match(l4, /VERSIÓN BASE → VERSIÓN ORQUESTADA → VERSIÓN BASE/i);
  assert.match(l4, /bombo 1 y 3/i);
  assert.match(l4, /chick de hi-hat 2 y 4/i);
  assert.match(l4, /U8 no la certifica como fill H6/i);
  assert.doesNotMatch(l4, /data-notation-score/);
});

test('checkpoint certifies G5 minimum and transfer evidence without H6 H7', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /G5 MÍNIMO/i);
  assert.match(cp, /Distribuye una frase conocida por superficies/i);
  assert.match(cp, /B8 en transferencia al kit/i);
  assert.match(cp, /f4-u2-l4-three-surfaces\.musicxml/);
  assert.match(cp, /f4-u8-l2-orchestration-feet\.musicxml/);
  assert.match(cp, /B8 COMPETENTE\/FUNCIONAL global/i);
  assert.match(cp, /G5 COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /H6 — fills/i);
  assert.match(cp, /H7 — independencia/i);
  assert.match(cp, /No existe BPM de aprobado/i);
});

test('U8 score preserves U2 hand identity and adds the known two-foot base', async () => {
  const xml = await readFile(scorePath, 'utf8');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.match(xml, /<instrument-name>Snare Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>High Tom<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Low Tom<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Pedal Hi-Hat<\/instrument-name>/);
  assert.match(xml, /<midi-unpitched>39<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>48<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>43<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>36<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>44<\/midi-unpitched>/);
  assert.equal((xml.match(/<voice>1<\/voice>/g) ?? []).length, 8);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 4);
  assert.equal((xml.match(/<instrument id="P1-I2"\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<instrument id="P1-I4"\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<instrument id="P1-I5"\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<accent\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<lyric><text>R<\/text><\/lyric>/g) ?? []).length, 4);
  assert.equal((xml.match(/<lyric><text>L<\/text><\/lyric>/g) ?? []).length, 4);
  assert.equal((xml.match(/<backup><duration>48<\/duration><\/backup>/g) ?? []).length, 2);
});

test('U7 remains H5-minimum-only when U8 adds orchestration', async () => {
  const u7 = plain(await readFile(path.join(pagesRoot, 'f4-u7-checkpoint-h5-minimo.md'), 'utf8'));
  assert.match(u7, /H5 — COMPETENTE\/FUNCIONAL/i);
  assert.match(u7, /H7 — independencia/i);
  assert.match(u7, /B8\/G5 — orquestación focal de U8/i);
});
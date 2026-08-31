import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const scorePath = path.resolve('public/bateria/notation/f5/u1/f5-u1-piece-a-form-i.musicxml');
const pages = {
  overview: 'f5-u1-overview.md',
  l1: 'f5-u1-l1-recuperar-sin-reaprender.md',
  l2: 'f5-u1-l2-mapa-pieza-a.md',
  l3: 'f5-u1-l3-unir-secciones.md',
  l4: 'f5-u1-l4-toma-continua-recuperacion.md',
  checkpoint: 'f5-u1-checkpoint-repertorio-a.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F5 U1 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*5$/m);
    assert.match(frontmatter, /^unit:\s*1$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-5-unidad-1$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f5-u1-check$/m);
});

test('overview makes duration form continuity dominant without inventing a style', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /Novedad dominante: duración \+ forma \+ continuidad/i);
  assert.match(overview, /NO REAPRENDER\. SOSTENER DURANTE MÁS TIEMPO/i);
  assert.match(overview, /INTRO 4 → A 8 → B 8 → OUTRO 4/i);
  assert.match(overview, /esqueleto formal mínimo/i);
  assert.match(overview, /No pretende representar ningún estilo concreto/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 recovers Hito 5 without invalidating the previous closure', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /f4-u10-hito5-integration\.musicxml/);
  assert.match(l1, /Un fallo local hoy no invalida un cierre anterior/i);
  assert.match(l1, /SÍNTOMA → HIPÓTESIS → PRUEBA → CORRECCIÓN → RECOMPONER/i);
  assert.match(l1, /CORE 3 extremidades/i);
  assert.match(l1, /CORE 4 extremidades/i);
  assert.match(l1, /No existe BPM de aprobado/i);
});

test('L2 teaches form and D7 preparation through a minimal formal skeleton', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /f5-u1-piece-a-form-i\.musicxml/);
  assert.match(l2, /esqueleto formal mínimo/i);
  assert.match(l2, /INTRO 4 → A 8 → B 8 → OUTRO 4/i);
  assert.match(l2, /24 compases de 4\/4/i);
  assert.match(l2, /TIEMPO → FORMA → ENTRADA → DETALLE/i);
  assert.match(l2, /U1 sólo prepara D7/i);
  assert.match(l2, /120 BPM únicamente como metadato técnico/i);
  assert.match(l2, /No existe BPM de aprobado/i);
});

test('L3 uses whole part correction and recombines quickly', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /INTRO → A/i);
  assert.match(l3, /A → B/i);
  assert.match(l3, /B → OUTRO/i);
  assert.match(l3, /No practiques 24 compases completos para corregir un fallo de dos compases/i);
  assert.match(l3, /BLOQUE LARGO → LOCALIZAR FALLO → 1–2 COMPASES ANTES\/DESPUÉS → CORREGIR → BLOQUE DE 8 → PIEZA/i);
  assert.match(l3, /FORMA → TRANSICIÓN → RETORNO/i);
});

test('L4 uses interpretation mode recording and recovery rather than perfection', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /UN ERROR LOCAL NO DEBE CONVERTIRSE AUTOMÁTICAMENTE EN PÉRDIDA DE FORMA/i);
  assert.match(l4, /LO QUE CREO QUE HAGO ↔ LO QUE REALMENTE SUENA/i);
  assert.match(l4, /PULSO \/ FORMA \/ TRANSICIONES \/ BALANCE \/ RECUPERACIÓN \/ TENSIÓN/i);
  assert.match(l4, /120 BPM únicamente como metadato técnico/i);
  assert.match(l4, /No existe BPM de aprobado/i);
});

test('checkpoint keeps Hito 6 I4 D7 and global H5 H6 outside U1 certification', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /NO es Hito 6/i);
  assert.match(cp, /NO certifica I4 COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /D7 COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /H5 COMPETENTE\/FUNCIONAL global/i);
  assert.match(cp, /H6 COMPETENTE\/FUNCIONAL global/i);
  assert.match(cp, /estilo concreto/i);
  assert.match(cp, /No existe BPM de aprobado/i);
});

test('Piece A is a 24-measure original formal skeleton with section cues, one known fill and one known variation', async () => {
  const xml = await readFile(scorePath, 'utf8');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /Pieza A: Forma I — esqueleto formal/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.equal((xml.match(/<measure number="/g) ?? []).length, 24);
  assert.equal((xml.match(/<note>/g) ?? []).length, 98);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 48);
  assert.equal((xml.match(/<instrument id="P1-I2"\/>/g) ?? []).length, 1);
  assert.equal((xml.match(/<instrument id="P1-I3"\/>/g) ?? []).length, 49);
  assert.match(xml, /<instrument-name>Snare Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>High Tom<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
  assert.match(xml, /<midi-unpitched>39<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>48<\/midi-unpitched>/);
  assert.match(xml, /<midi-unpitched>36<\/midi-unpitched>/);
  for (const section of ['INTRO', 'A', 'B', 'OUTRO']) assert.match(xml, new RegExp(`<words>${section}<\\/words>`));
  assert.equal((xml.match(/<lyric><text>R<\/text><\/lyric>/g) ?? []).length, 1);
  assert.equal((xml.match(/<lyric><text>L<\/text><\/lyric>/g) ?? []).length, 1);
  assert.equal((xml.match(/<lyric><text>&amp;<\/text><\/lyric>/g) ?? []).length, 1);
  assert.match(xml, /<measure number="12">[\s\S]*?<lyric><text>R<\/text><\/lyric>[\s\S]*?<lyric><text>L<\/text><\/lyric>[\s\S]*?<\/measure>/);
  assert.match(xml, /<measure number="13">[\s\S]*?<words>B<\/words>[\s\S]*?<\/measure>/);
});

test('F4 Hito 5 remains literal and does not become a F5 certification', async () => {
  const u10 = plain(await readFile(path.join(pagesRoot, 'f4-u10-checkpoint-hito5.md'), 'utf8'));
  assert.match(u10, /Mantener un groove básico estable mientras introduce pequeñas variaciones y fills sin perder forma ni pulso/i);
  assert.match(u10, /H5 COMPETENTE\/FUNCIONAL global/i);
  assert.match(u10, /H6 COMPETENTE\/FUNCIONAL global/i);
});
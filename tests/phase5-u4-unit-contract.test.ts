import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f5/u4');
const pages = {
  overview: 'f5-u4-overview.md',
  l1: 'f5-u4-l1-pulso-rejilla-ternaria.md',
  l2: 'f5-u4-l2-shuffle-core-backbeat-balance.md',
  l3: 'f5-u4-l3-pieza-b-escuchar-antes-mirar.md',
  l4: 'f5-u4-l4-pieza-b-shuffle-forma-recuperacion.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F5 U4 has overview and four lessons in order with no invented checkpoint', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*5$/m);
    assert.match(frontmatter, /^unit:\s*4$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-5-unidad-4$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  const joined = (await Promise.all(keys.map(page))).join('\n');
  assert.doesNotMatch(joined, /^kind:\s*checkpoint$/m);
});

test('overview preserves approved U4 boundaries and listening-first repertoire B route', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /cambiar el feel manteniendo pulso y forma/i);
  assert.match(overview, /SHUFFLE ≠ “CORCHEAS ESCRITAS DE OTRA MANERA”/i);
  assert.match(overview, /CORE — blues \/ shuffle/i);
  assert.match(overview, /AMPLIACIÓN — half-time shuffle/i);
  assert.match(overview, /Pieza B — ruta predominantemente auditiva/i);
  assert.match(overview, /no crea un checkpoint nuevo/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 separates ternary subdivision from 12/8 and cites verified sources', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /f5-u4-l1-triplet-grid\.musicxml/);
  assert.match(l1, /tres partes iguales/i);
  assert.match(l1, /12\/8 ≠ shuffle/i);
  assert.match(l1, /compuesto cuaternario/i);
  assert.match(l1, /Berklee Online/i);
  assert.match(l1, /musictheory\.net/i);
  assert.match(l1, /No afirman que todo shuffle tenga exactamente la misma microtemporización/i);
});

test('L2 teaches shuffle as feel plus balance and keeps binary-to-shuffle comparison controlled', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /f5-u4-l2-shuffle-core\.musicxml/);
  assert.match(l2, /primera y tercera parte de cada grupo ternario/i);
  assert.match(l2, /rejilla pedagógica explícita/i);
  assert.match(l2, /inter-dynamics/i);
  assert.match(l2, /CORCHEAS RECTAS → SHUFFLE → CORCHEAS RECTAS/i);
  assert.match(l2, /No se presenta como una ley de microtiming/i);
});

test('L3 is deliberately score-free and makes a provisional map from listening', async () => {
  const l3 = plain(await page('l3'));
  assert.doesNotMatch(l3, /data-notation-score/);
  assert.match(l3, /predominantemente auditiva/i);
  assert.match(l3, /La ausencia de una partitura en esta página es intencional/i);
  assert.match(l3, /mapa provisional/i);
  assert.match(l3, /síntoma → hipótesis → prueba → correctivo → nueva pasada/i);
});

test('L4 reveals original Piece B map after the listening-first lesson and keeps half-time optional', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /f5-u4-piece-b-form-i\.musicxml/);
  assert.match(l4, /INTRO 4 → A 8 → B 4 → A' 4 → OUTRO 4/i);
  assert.match(l4, /Total: 24 compases/i);
  assert.match(l4, /PULSO → FORMA → FEEL → BALANCE → DETALLE/i);
  assert.match(l4, /AMPLIACIÓN — half-time shuffle/i);
  assert.match(l4, /no crea un checkpoint adicional/i);
  assert.match(l4, /no declara blues dominado/i);
});

test('U4 notation is original, audible and uses explicit 3:2 timing where needed', async () => {
  const grid = await readFile(path.join(notationRoot, 'f5-u4-l1-triplet-grid.musicxml'), 'utf8');
  const core = await readFile(path.join(notationRoot, 'f5-u4-l2-shuffle-core.musicxml'), 'utf8');
  const piece = await readFile(path.join(notationRoot, 'f5-u4-piece-b-form-i.musicxml'), 'utf8');
  for (const xml of [grid, core, piece]) {
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.match(xml, /<sound tempo="120"\/>/);
    assert.match(xml, /<midi-unpitched>42<\/midi-unpitched>/);
  }
  for (const xml of [grid, core]) {
    assert.match(xml, /<actual-notes>3<\/actual-notes>/);
    assert.match(xml, /<normal-notes>2<\/normal-notes>/);
  }
  assert.equal((grid.match(/<measure number=/g) ?? []).length, 1);
  assert.equal((core.match(/<measure number=/g) ?? []).length, 2);
  assert.equal((piece.match(/<measure number=/g) ?? []).length, 24);
  assert.match(piece, /INTRO · mp/);
  assert.match(piece, /A · mf/);
  assert.match(piece, /B · f/);
  assert.match(piece, /A' · mf/);
  assert.match(piece, /OUTRO · mp/);
});

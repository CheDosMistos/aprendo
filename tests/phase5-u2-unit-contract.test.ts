import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const pages = {
  overview: 'f5-u2-overview.md',
  l1: 'f5-u2-l1-partitura-vs-chart.md',
  l2: 'f5-u2-l2-forma-entradas-dinamica.md',
  l3: 'f5-u2-l3-cues-conocidos.md',
  l4: 'f5-u2-l4-navegacion-chart-recuperacion.md',
  checkpoint: 'f5-u2-checkpoint-d7-minimo.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F5 U2 has overview, four lessons and checkpoint 5A in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*5$/m);
    assert.match(frontmatter, /^unit:\s*2$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-5-unidad-2$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f5-u2-check$/m);
});

test('overview makes D7 chart navigation dominant and preserves the decision hierarchy', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /Novedad dominante: D7/i);
  assert.match(overview, /UN CHART NO TE DICE CADA GOLPE/i);
  assert.match(overview, /TIEMPO → FORMA → ENTRADA → FIGURE\/CUE → DETALLE/i);
  assert.match(overview, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/i);
  assert.match(overview, /puede certificar D7 MÍNIMO en condición preparada/i);
  assert.match(overview, /No existe BPM de aprobado/i);
});

test('L1 compares the U1 score with Chart A and removes written detail deliberately', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /f5-u1-piece-a-form-i\.musicxml/);
  assert.match(l1, /esqueleto formal mínimo/i);
  assert.match(l1, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/i);
  assert.match(l1, /El chart no dicta/i);
  assert.match(l1, /ocho compases/i);
  assert.match(l1, /TIEMPO → FORMA → ENTRADA → DETALLE/i);
});

test('L2 uses form anticipation and relational dynamics without turning volume into tempo', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /SECCIÓN ACTUAL → SIGUIENTE SECCIÓN → EVENTO QUE DEBO ANTICIPAR/i);
  assert.match(l2, /mp \/ mf \/ f/i);
  assert.match(l2, /relaciones entre secciones/i);
  assert.match(l2, /Más fuerte no significa más tenso ni más rápido/i);
  assert.match(l2, /INTRO → A/i);
  assert.match(l2, /A → B/i);
});

test('L3 reuses known Fill A and Variation B as chart cues and prioritizes continuation', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /compás 12: Fill A/i);
  assert.match(l3, /compás 16: Variación B/i);
  assert.match(l3, /GROOVE → ANTICIPAR → EVENTO CONOCIDO → CONTINUAR/i);
  assert.match(l3, /No inventes un fill más difícil/i);
  assert.match(l3, /TIEMPO → FORMA → SIGUIENTE ENTRADA → DETALLE/i);
});

test('L4 makes Chart A the only written aid in the main take and teaches recovery', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /sólo Chart A como ayuda escrita principal/i);
  assert.match(l4, /score completo puede consultarse durante laboratorio/i);
  assert.match(l4, /PERDER UN DETALLE NO OBLIGA A PERDER LA PIEZA/i);
  assert.match(l4, /SÍNTOMA → HIPÓTESIS → PRUEBA → CORRECCIÓN → RECOMPONER/i);
  assert.match(l4, /menos preparación previa/i);
  assert.match(l4, /entrada desde una sección diferente/i);
  assert.match(l4, /click menos presente/i);
});

test('checkpoint certifies D7 minimum only in a prepared condition', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /D7 MÍNIMO en condición preparada/i);
  assert.match(cp, /sigue indicaciones elementales de forma y entradas/i);
  assert.match(cp, /score completo de U1 no visible durante la toma principal/i);
  assert.match(cp, /TIEMPO → FORMA → ENTRADA → FIGURE\/CUE → DETALLE/i);
  assert.match(cp, /D7 COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /sight-reading a primera vista/i);
  assert.match(cp, /I4 COMPETENTE\/FUNCIONAL/i);
  assert.match(cp, /No existe BPM de aprobado/i);
});

test('U2 creates no new MusicXML and keeps U1 Piece A as the only score reference', async () => {
  const all = await Promise.all(Object.keys(pages).map((key) => page(key as keyof typeof pages)));
  const joined = all.join('\n');
  const scoreRefs = joined.match(/data-score-src="([^"]+)"/g) ?? [];
  assert.equal(scoreRefs.length, 1);
  assert.match(scoreRefs[0]!, /\/bateria\/notation\/f5\/u1\/f5-u1-piece-a-form-i\.musicxml/);
  assert.doesNotMatch(joined, /\/bateria\/notation\/f5\/u2\//);
});

test('U1 remains repertorio A in development and does not become D7 functional retroactively', async () => {
  const u1 = plain(await readFile(path.join(pagesRoot, 'f5-u1-checkpoint-repertorio-a.md'), 'utf8'));
  assert.match(u1, /NO es Hito 6/i);
  assert.match(u1, /D7 COMPETENTE\/FUNCIONAL/i);
});
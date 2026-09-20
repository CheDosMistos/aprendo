import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f5/u5');
const pages = {
  overview: 'f5-u5-overview.md',
  l1: 'f5-u5-l1-rejilla-semicorcheas.md',
  l2: 'f5-u5-l2-notas-principales-textura.md',
  l3: 'f5-u5-l3-h7-capa-fija-voz-variable.md',
  l4: 'f5-u5-l4-pocket-integracion-musical.md',
  check: 'f5-u5-checkpoint-h7-minimo.md',
} as const;
async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F5 U5 has overview, four lessons and Checkpoint 5B in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*5$/m);
    assert.match(frontmatter, /^unit:\s*5$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-5-unidad-5$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('check')), /^kind:\s*checkpoint$/m);
});

test('overview makes independence contextual and protects specialization boundary', async () => {
  const text = plain(await page('overview'));
  assert.match(text, /Novedad dominante: independencia contextual dentro del groove/i);
  assert.doesNotMatch(text, /independencia avanzada como novedad dominante/i);
  assert.match(text, /INDEPENDENCIA ≠ AÑADIR CAPAS/i);
  assert.match(text, /a menudo.*feel de semicorchea/is);
  assert.match(text, /Ghost notes: textura, no puerta/i);
  assert.match(text, /no.*linear drumming.*sinónimo de funk/is);
  assert.match(text, /especialización en independencia.*fuera del tronco/i);
  assert.match(text, /no crean tres bloques técnicos diarios nuevos/i);
  assert.match(text, /sustituya una tarea secundaria/i);
  assert.match(text, /No existe BPM de aprobado/i);
});

test('L1 treats sixteenth notes as a grid rather than a genre definition', async () => {
  const text = plain(await page('l1'));
  assert.match(text, /f5-u5-l1-sixteenth-grid\.musicxml/);
  assert.match(text, /SEMICORCHEA ≠ FUNK/i);
  assert.match(text, /metadato técnico del reproductor/i);
  assert.match(text, /Berklee Online/i);
});

test('L2 makes ghost notes subordinate to pulse, backbeat and dynamic hierarchy', async () => {
  const text = plain(await page('l2'));
  assert.match(text, /f5-u5-l2-dynamic-hierarchy\.musicxml/);
  assert.match(text, /sin acento.*textura\/ghost-tap/is);
  assert.match(text, /BACKBEAT CLARO > TEXTURA SUAVE/i);
  assert.match(text, /PAS.*Ghost Note Funk/is);
  assert.match(text, /La evaluación de esta unidad no las exige/i);
});

test('L3 changes one voice while time and backbeat remain fixed', async () => {
  const text = plain(await page('l3'));
  assert.match(text, /f5-u5-l3-h7-context\.musicxml/);
  assert.match(text, /hi-hat en corcheas.*backbeat.*2 y 4/is);
  assert.match(text, /Sólo cambia el bombo/i);
  assert.match(text, /no es la definición de independencia ni de funk/i);
  assert.match(text, /prepara el nivel MÍNIMO de independencia/i);
  assert.doesNotMatch(text, /independencia avanzada funcional/i);
});

test('L4 integrates independence without changing Piece B style or adding maintenance debt', async () => {
  const text = plain(await page('l4'));
  assert.match(text, /A 4 compases → B 4 → A 4 → B 4/i);
  assert.match(text, /Pocket como relación/i);
  assert.match(text, /No conviertas su shuffle en funk/i);
  assert.match(text, /no añadas automáticamente un bloque separado/i);
  assert.match(text, /ocupa tiempo que habría ido a otra tarea secundaria/i);
  assert.match(text, /No existe BPM de aprobado/i);
});

test('unit evaluation certifies minimum independence only', async () => {
  const text = plain(await page('check'));
  assert.match(text, /independencia MÍNIMO: mantiene un ostinato simple mientras otra voz varía/i);
  assert.match(text, /f5-u5-checkpoint-h7\.musicxml/);
  assert.match(text, /NO CERTIFICA[\s\S]*independencia a cuatro extremidades avanzada/i);
  assert.match(text, /ghost notes como requisito/i);
  assert.match(text, /No existe BPM de aprobado/i);
  assert.match(text, /no crea mantenimiento paralelo/i);
});

test('U5 notation is original, 120-reference, five-line and metrically bounded', async () => {
  const files = ['f5-u5-l1-sixteenth-grid.musicxml','f5-u5-l2-dynamic-hierarchy.musicxml','f5-u5-l3-h7-context.musicxml','f5-u5-checkpoint-h7.musicxml'];
  for (const file of files) {
    const xml = await readFile(path.join(notationRoot, file), 'utf8');
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.match(xml, /<staff-lines>5<\/staff-lines>/);
    assert.match(xml, /<sound tempo="120"\/>/);
  }
  const grid = await readFile(path.join(notationRoot, files[0]), 'utf8');
  assert.equal((grid.match(/<type>16th<\/type>/g) ?? []).length, 16);
  const texture = await readFile(path.join(notationRoot, files[1]), 'utf8');
  assert.match(texture, /Sin acento = textura suave; acento = backbeat/);
  assert.equal((texture.match(/<accent\/>/g) ?? []).length, 2);
  assert.doesNotMatch(texture, /parentheses="yes"/);
  const h7 = await readFile(path.join(notationRoot, files[2]), 'utf8');
  const check = await readFile(path.join(notationRoot, files[3]), 'utf8');
  assert.equal((h7.match(/<measure number=/g) ?? []).length, 2);
  assert.equal((check.match(/<measure number=/g) ?? []).length, 2);
});

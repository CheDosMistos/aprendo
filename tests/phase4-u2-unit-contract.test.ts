import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f4/u2');
const pages = {
  overview: 'f4-u2-overview.md',
  l1: 'f4-u2-l1-linea-base-caja-real.md',
  l2: 'f4-u2-l2-dos-superficies-rl.md',
  l3: 'f4-u2-l3-acento-timbre.md',
  l4: 'f4-u2-l4-identidad-superficies-retorno.md',
  checkpoint: 'f4-u2-checkpoint-misma-idea-superficies.md',
} as const;
const scores = [
  'f4-u2-l1-base-snare.musicxml',
  'f4-u2-l2-rl-two-surfaces.musicxml',
  'f4-u2-l3-accent-timbre.musicxml',
  'f4-u2-l4-three-surfaces.musicxml',
] as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
async function score(file: typeof scores[number]) { return readFile(path.join(notationRoot, file), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F4 U2 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*2$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-2$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u2-check$/m);
});

test('U2 is true within-phrase manual transfer and does not duplicate U1', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /algunos ataques cambian de lugar dentro de la propia frase/i);
  assert.match(overview, /Cuando la superficie es nueva, el ritmo debe ser viejo/i);
  assert.match(overview, /No estamos aprendiendo un ritmo nuevo/i);
});

test('U2 keeps B8 and G5 dependency boundary explicit', async () => {
  const all = plain((await Promise.all((Object.keys(pages) as (keyof typeof pages)[]).map(page))).join('\n'));
  assert.match(all, /componente manual de B8/i);
  assert.match(all, /no declara G5 MÍNIMO/i);
  assert.match(all, /No certifica H4, G5 MÍNIMO completo ni B8-kit competente/i);
  assert.doesNotMatch(all, /G5 (?:queda|está) (?:aprobado|dominado|certificado)/i);
});

test('L1 uses known material and one-variable diagnosis', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /material debe ser deliberadamente fácil de recordar/i);
  assert.match(l1, /TIEMPO \/ STICKING \/ SUPERFICIE \/ MOVIMIENTO/);
  assert.match(l1, /Cambia una sola variable/i);
  assert.match(l1, /No hay BPM de aprobado/i);
});

test('L2 distributes R and L without feet or a new rhythm', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /repartir ataques dentro de la frase/i);
  assert.match(l2, /La novedad es espacial\/tímbrica\. El ritmo sigue siendo el mismo/i);
  assert.match(l2, /No se usa bombo ni hi-hat de pie/i);
  assert.match(l2, /No demuestra todavía coordinación H4 ni G5 MÍNIMO completo/i);
});

test('L3 distinguishes accent, dynamics and timbre', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /ACENTO ≠ SUPERFICIE/);
  assert.match(l3, /acento: jerarquía dinámica\/articulatoria/i);
  assert.match(l3, /dinámica: nivel relativo/i);
  assert.match(l3, /timbre\/superficie/i);
  assert.match(l3, /No estás estudiando todavía el vocabulario estilístico de ghost notes/i);
});

test('L4 preserves traceable identity and return without certifying H4/G5', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /TRAZABILIDAD TÍMBRICA/);
  assert.match(l4, /RITMO \/ STICKING \/ ACENTOS \/ SILENCIOS \/ CONTORNO DINÁMICO/);
  assert.match(l4, /Usa sólo una regla por intento/i);
  assert.match(l4, /vuelve a la versión base en caja/i);
  assert.match(l4, /No certifica H4, G5 MÍNIMO completo ni B8-kit competente/i);
});

test('checkpoint advances to U3/U4 without hidden feet, groove or independence requirements', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /MÍNIMO PARA AVANZAR A U3\/U4/);
  assert.match(cp, /al menos dos superficies manuales/i);
  assert.match(cp, /TIEMPO \/ ACCESO \/ SUPERFICIE \/ STICKING \/ DINÁMICA/);
  for (const excluded of ['H2 — técnica de bombo', 'H3 — hi-hat de pie', 'H4 — coordinación de cuatro extremidades', 'H5 — groove', 'H6 — fills', 'G5 MÍNIMO completo', 'B8-kit competente']) {
    assert.match(cp, new RegExp(excluded));
  }
  assert.match(cp, /Cierre registrado ≠ competencia demostrada/i);
});

test('all four U2 scores are original, complete 4/4 eighth-note measures and use hands only', async () => {
  for (const file of scores) {
    const xml = await score(file);
    assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
    assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
    assert.equal((xml.match(/<duration>6<\/duration>/g) ?? []).length, 8, `${file} must contain exactly eight eighth-note durations`);
    assert.doesNotMatch(xml, /Bass Drum|Kick|Hi-Hat Foot|Pedal Hi-Hat/i);
    assert.doesNotMatch(xml, /pas\.org|Percussive Arts Society/i);
  }
});

test('score instrumentation increases progressively without adding a new rhythmic skeleton', async () => {
  const l1 = await score(scores[0]);
  const l2 = await score(scores[1]);
  const l3 = await score(scores[2]);
  const l4 = await score(scores[3]);
  assert.equal((l1.match(/<score-instrument /g) ?? []).length, 1);
  assert.equal((l2.match(/<score-instrument /g) ?? []).length, 2);
  assert.equal((l3.match(/<score-instrument /g) ?? []).length, 2);
  assert.equal((l4.match(/<score-instrument /g) ?? []).length, 3);
  for (const xml of [l1, l2, l3, l4]) assert.equal((xml.match(/<lyric>/g) ?? []).length, 8);
});

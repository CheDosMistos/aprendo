import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pageRoot = path.resolve('src/courses/bateria/content/pages');
const pages = {
  overview: 'f3-u11-overview.md',
  l1: 'f3-u11-l1-del-audio-al-mapa.md',
  l2: 'f3-u11-l2-oido-tonal-util.md',
  l3: 'f3-u11-l3-acordes-centro-tonal-tension-resolucion.md',
  l4: 'f3-u11-l4-bajo-bateria-relacion-no-copia.md',
  l5: 'f3-u11-l5-take-five-repertorio-documentado.md',
  checkpoint: 'f3-u11-checkpoint-ficha-analisis-integrado.md',
} as const;
async function page(name: keyof typeof pages) { return readFile(path.join(pageRoot, pages[name]), 'utf8'); }
function frontmatter(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function attr(markdown: string, name: string) { return markdown.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? ''; }

const splitBars = (value: string) => value.split('|').filter(Boolean);
const allBinary8 = (bars: string[]) => bars.every((bar) => /^[01]{8}$/.test(bar));

test('U11 has overview, five lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const fm = frontmatter(await page(key));
    assert.match(fm, /^phase:\s*3$/m); assert.match(fm, /^unit:\s*11$/m);
    assert.match(fm, /^unitSlug:\s*fase-3-unidad-11$/m); assert.match(fm, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(frontmatter(await page('checkpoint')), /^contentId:\s*bat-f3-u11-check$/m);
});

test('U11 keeps theory useful, pad-compatible and below kit interpretation', async () => {
  const overview = await page('overview');
  assert.match(overview, /intervalo, escala, acorde y centro tonal al nivel útil para un batería/i);
  assert.match(overview, /coincidencia y complemento entre bajo y batería/i);
  assert.match(overview, /NO SE EXIGE[\s\S]*Tocar canciones completas en kit/i);
  assert.doesNotMatch(overview, /I4/);
});

test('L1 form source is original, internally consistent and exposes a hidden map', async () => {
  const l1 = await page('l1');
  assert.match(l1, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(l1, /data-rhythm-form/);
  for (const name of ['data-low-pattern', 'data-mid-pattern', 'data-high-pattern']) {
    const value = attr(l1, name); assert.equal(value.length, 64); assert.match(value, /^[01]+$/);
  }
  assert.equal(attr(l1, 'data-block-lengths'), '2|2|2|2');
  assert.equal(attr(l1, 'data-block-labels'), 'A|B|A’|C');
});

test('L2 and L3 use original tonal data with no external audio files', async () => {
  const l2 = await page('l2'); const l3 = await page('l3');
  assert.equal((l2.match(/data-musical-context/g) ?? []).length, 2);
  assert.match(l2, /data-melody="60,62,67,60"/);
  assert.match(l2, /data-melody="60,62,64,65,67,69,71,72"/);
  assert.match(l3, /data-chords="60,64,67\|65,69,72\|67,71,74\|60,64,67"/);
  assert.match(l3, /I–IV–V–I/);
  assert.doesNotMatch(`${l2}\n${l3}`, /<audio\b|\.mp3|\.wav/i);
});

test('L4 bass-drums example has aligned four-bar layers and rejects copy-as-rule', async () => {
  const l4 = await page('l4');
  const roots = splitBars(attr(l4, 'data-bass-roots'));
  const bass = splitBars(attr(l4, 'data-bass-patterns'));
  const drums = splitBars(attr(l4, 'data-drum-patterns'));
  assert.equal(roots.length, 4); assert.equal(bass.length, 4); assert.equal(drums.length, 4);
  assert.ok(allBinary8(bass)); assert.ok(allBinary8(drums));
  assert.match(l4, /“el bombo toca lo mismo que el bajo”/);
  assert.match(l4, /coincidencia[\s\S]*complemento[\s\S]*continuidad[\s\S]*señal formal/i);
});

test('Take Five is linked as documented repertoire without reproducing a local score', async () => {
  const l5 = await page('l5');
  assert.match(l5, /## EJEMPLO DOCUMENTADO/); assert.match(l5, /## EJEMPLO ANALÍTICO/);
  assert.match(l5, /Paul Desmond/); assert.match(l5, /Joe Morello/); assert.match(l5, /Eugene Wright/); assert.match(l5, /5\/4/);
  assert.match(l5, /https:\/\/www\.youtube\.com\/watch\?v=QsHc2IGmk60/);
  assert.match(l5, /davebrubeckjazz\.com/); assert.match(l5, /blogs\.loc\.gov/);
  assert.doesNotMatch(l5, /data-notation-score|\.musicxml/);
  assert.match(l5, /No reproduce aquí la partitura, el audio master ni una transcripción extensa/);
});

test('checkpoint contains aligned eight-bar harmony, bass and drum evidence', async () => {
  const cp = await page('checkpoint');
  const chords = splitBars(attr(cp, 'data-chords'));
  const roots = splitBars(attr(cp, 'data-bass-roots'));
  const bass = splitBars(attr(cp, 'data-bass-patterns'));
  const drums = splitBars(attr(cp, 'data-drum-patterns'));
  assert.equal(chords.length, 8); assert.equal(roots.length, 8); assert.equal(bass.length, 8); assert.equal(drums.length, 8);
  assert.ok(allBinary8(bass)); assert.ok(allBinary8(drums));
  assert.match(cp, /bloque A — compases 1–4/); assert.match(cp, /bloque B — compases 5–8/);
  assert.match(cp, /No es requisito para U12/);
});

test('MusicalContextWidgets is generic, layer-aware and non-grading', async () => {
  const widget = await readFile(path.resolve('src/courses/bateria/components/MusicalContextWidgets.astro'), 'utf8');
  assert.match(widget, /\[data-musical-context\]/);
  assert.match(widget, /dataset\.melody/); assert.match(widget, /dataset\.chords/);
  assert.match(widget, /dataset\.bassRoots/); assert.match(widget, /dataset\.bassPatterns/); assert.match(widget, /dataset\.drumPatterns/);
  assert.match(widget, /Escuchar mezcla/); assert.match(widget, /Sólo armonía/); assert.match(widget, /Sólo bajo/); assert.match(widget, /Sólo batería/);
  assert.match(widget, /Mostrar referencia/); assert.match(widget, /data-context-listen-count|contextListenCount/);
  assert.doesNotMatch(widget, /grader|score\s*=|\bcorrect\b|\bincorrect\b/i);
  const layout = await readFile(path.resolve('src/courses/bateria/components/CourseArticleLayout.astro'), 'utf8');
  assert.match(layout, /MusicalContextWidgets/);
});

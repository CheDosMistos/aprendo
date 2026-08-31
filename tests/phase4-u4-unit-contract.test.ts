import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f4/u4');
const pages = {
  overview: 'f4-u4-overview.md',
  l1: 'f4-u4-l1-abrir-cerrar-chick.md',
  l2: 'f4-u4-l2-mecanica-presion-opciones.md',
  l3: 'f4-u4-l3-chick-ostinato-simple.md',
  l4: 'f4-u4-l4-referencia-pie-manos.md',
  checkpoint: 'f4-u4-checkpoint-hihat-pie-disponible.md',
} as const;
const scores = {
  pulse: 'f4-u4-l3-foot-hihat-pulse.musicxml',
  handsFoot: 'f4-u4-l4-hands-foot-reference.musicxml',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
async function score(key: keyof typeof scores) { return readFile(path.join(notationRoot, scores[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }
function measures(xml: string) { return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((match) => match[1]); }
function durations(measure: string) { return [...measure.matchAll(/<duration>(\d+)<\/duration>/g)].map((match) => Number(match[1])); }

test('F4 U4 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*4$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-4$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u4-check$/m);
});

test('overview keeps H3 parallel to H2 and defines the approved minimum', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /H2 bombo y H3 hi-hat de pie ramas paralelas/i);
  assert.match(overview, /mantener aperturas\/cierres u ostinatos simples/i);
  assert.match(overview, /Heel-up y heel-down.*TRADICIÓN PEDAGÓGICA \/ OPCIONES TÉCNICAS/i);
  assert.match(overview, /no certifica H4/i);
  assert.match(overview, /no exige bombo/i);
});

test('L1 isolates open close chick and rejects universal hardware settings', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /ABRE \/ CIERRA \/ ESCUCHA \/ PREPARA/);
  assert.match(l1, /SONIDO \/ CIERRE \/ RETORNO \/ EQUILIBRIO \/ TENSIÓN/);
  assert.match(l1, /No fijamos una separación, presión ni recorrido universales/i);
  assert.match(l1, /sigue el manual del instrumento/i);
  assert.match(l1, /dolor persistente, hormigueo, entumecimiento, pérdida de fuerza\/control o movimientos involuntarios persistentes/i);
  assert.doesNotMatch(l1, /data-notation-score|\.musicxml/);
});

test('L2 treats heel choices as pedagogy and partial opening as expansion', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /heel-down y heel-up son TRADICIÓN PEDAGÓGICA \/ OPCIONES TÉCNICAS/i);
  assert.match(l2, /Zildjian Education presenta ambas/i);
  assert.match(l2, /no demuestra superioridad científica/i);
  assert.match(l2, /CONTROL \/ SONIDO \/ BALANCE \/ ESFUERZO \/ RETORNO/);
  assert.match(l2, /AMPLIACIÓN — rango parcialmente abierto/i);
  assert.match(l2, /no una lección de openings estilísticos ni un requisito de H3 MÍNIMO/i);
  assert.doesNotMatch(l2, /data-notation-score|\.musicxml/);
});

test('L3 makes quarter-note foot ostinato essential and 2/4 optional', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /f4-u4-l3-foot-hihat-pulse\.musicxml/);
  assert.match(l3, /A — ESENCIAL AHORA.*cuatro negras/is);
  assert.match(l3, /B — AMPLIACIÓN.*tiempos 2 y 4/is);
  assert.match(l3, /No hay manos ni bombo/i);
  assert.match(l3, /2 y 4 no es una etiqueta estilística/i);
  assert.match(l3, /No existe BPM de aprobado/i);
});

test('L4 layers known hands with left foot but does not certify H4', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /f4-u4-l4-hands-foot-reference\.musicxml/);
  assert.match(l4, /voz manual.*ocho corcheas alternadas R\/L/is);
  assert.match(l4, /voz de pie.*cuatro negras/is);
  assert.match(l4, /No hay bombo/);
  assert.match(l4, /no hace falta haber completado H2/i);
  assert.match(l4, /no certifica H4 ni H7/i);
});

test('checkpoint certifies only H3 minimum and leaves later skills open', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /H3 MÍNIMO/);
  assert.match(cp, /f4-u4-l3-foot-hihat-pulse\.musicxml/);
  assert.match(cp, /f4-u4-l4-hands-foot-reference\.musicxml/);
  assert.match(cp, /negras = ESENCIAL AHORA/i);
  assert.match(cp, /tiempos 2 y 4 = AMPLIACIÓN/i);
  assert.match(cp, /No existe BPM de aprobado/i);
  for (const excluded of ['H2 — técnica de bombo', 'H4 — coordinación básica de cuatro extremidades', 'H5 — groove funcional', 'H7 — independencia', 'foot splash funcional', 'ostinatos variados o rápidos']) {
    assert.match(cp, new RegExp(excluded, 'i'));
  }
  assert.match(cp, /No es requisito para iniciar U5/i);
  assert.match(cp, /La perfección no es requisito para continuar/i);
});

test('foot pulse score is original, metrically complete and contains pedal hi-hat only', async () => {
  const xml = await score('pulse');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<instrument-name>Pedal Hi-Hat<\/instrument-name>/);
  assert.match(xml, /<midi-unpitched>44<\/midi-unpitched>/);
  assert.doesNotMatch(xml, /Snare Drum|Bass Drum/i);
  const ms = measures(xml);
  assert.equal(ms.length, 2);
  assert.deepEqual(durations(ms[0]), [12, 12, 12, 12]);
  assert.deepEqual(durations(ms[1]), [12, 12, 12, 12]);
  assert.equal((ms[0].match(/<instrument id="P1-I1"\/>/g) ?? []).length, 4);
  assert.equal((ms[1].match(/<instrument id="P1-I1"\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<notehead>x<\/notehead>/g) ?? []).length, 6);
});

test('hands foot score uses two complete voices and contains no kick', async () => {
  const xml = await score('handsFoot');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<instrument-name>Snare Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Pedal Hi-Hat<\/instrument-name>/);
  assert.doesNotMatch(xml, /Bass Drum/i);
  const ms = measures(xml);
  assert.equal(ms.length, 1);
  assert.equal((ms[0].match(/<instrument id="P1-I1"\/>/g) ?? []).length, 8);
  assert.equal((ms[0].match(/<instrument id="P1-I2"\/>/g) ?? []).length, 4);
  assert.match(ms[0], /<backup><duration>48<\/duration><\/backup>/);
  assert.equal((ms[0].match(/<voice>1<\/voice>/g) ?? []).length, 8);
  assert.equal((ms[0].match(/<voice>2<\/voice>/g) ?? []).length, 4);
  assert.equal((xml.match(/<notehead>normal<\/notehead>/g) ?? []).length, 8);
  assert.equal((xml.match(/<notehead>x<\/notehead>/g) ?? []).length, 4);
});

test('U3 remains an H2-only checkpoint when U4 introduces left foot', async () => {
  const u3 = plain(await readFile(path.join(pagesRoot, 'f4-u3-checkpoint-bombo-primera-voz-pie.md'), 'utf8'));
  assert.match(u3, /H2 MÍNIMO/);
  assert.match(u3, /H3 — hi-hat de pie/);
  assert.match(u3, /H4 — coordinación básica de cuatro extremidades/);
});

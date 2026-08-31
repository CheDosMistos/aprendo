import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notationRoot = path.resolve('public/bateria/notation/f4/u3');
const pages = {
  overview: 'f4-u3-overview.md',
  l1: 'f4-u3-l1-pedal-primer-golpe.md',
  l2: 'f4-u3-l2-mecanica-sonido-opciones.md',
  l3: 'f4-u3-l3-negras-corcheas-consistencia.md',
  l4: 'f4-u3-l4-sustitucion-manos-bombo.md',
  checkpoint: 'f4-u3-checkpoint-bombo-primera-voz-pie.md',
} as const;
const scores = {
  pulse: 'f4-u3-l3-kick-pulse.musicxml',
  substitution: 'f4-u3-l4-kick-substitution.musicxml',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
async function score(key: keyof typeof scores) { return readFile(path.join(notationRoot, scores[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }
function measures(xml: string) { return [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)].map((match) => match[1]); }
function durations(measure: string) { return [...measure.matchAll(/<duration>(\d+)<\/duration>/g)].map((match) => Number(match[1])); }

test('F4 U3 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*3$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-3$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u3-check$/m);
});

test('overview makes H2 minimum and non-dogmatic pedal boundary explicit', async () => {
  const overview = plain(await page('overview'));
  assert.match(overview, /Cuando el pie es nuevo, el ritmo debe ser viejo/i);
  assert.match(overview, /MÍNIMO de H2 no es velocidad/i);
  assert.match(overview, /golpes controlados y consistentes en patrones básicos/i);
  assert.match(overview, /no demuestra que heel-down, heel-up, heel-toe, slide.*universalmente superior/i);
  assert.match(overview, /no certifica H4/i);
});

test('L1 teaches single hit return and one-variable setup without universal geometry', async () => {
  const l1 = plain(await page('l1'));
  assert.match(l1, /GOLPE \/ VUELTA \/ PREPARA/);
  assert.match(l1, /No existe una altura de asiento, un ángulo de rodilla\/tobillo o una tensión de muelle universalmente correctos/i);
  assert.match(l1, /SONIDO \/ RETORNO \/ EQUILIBRIO \/ TENSIÓN/);
  assert.match(l1, /modifica sólo una cosa/i);
  assert.match(l1, /dolor persistente, hormigueo, entumecimiento, pérdida de fuerza\/control o movimientos involuntarios persistentes/i);
  assert.doesNotMatch(l1, /data-notation-score|\.musicxml/);
});

test('L2 presents heel mechanics and beater contact as options, not scientific hierarchy', async () => {
  const l2 = plain(await page('l2'));
  assert.match(l2, /TRADICIÓN PEDAGÓGICA \/ OPCIONES TÉCNICAS/);
  assert.match(l2, /heel-down y heel-up/i);
  assert.match(l2, /no demuestra que heel-down, heel-up, heel-toe, slide.*universalmente superior/i);
  assert.match(l2, /CONTROL \/ SONIDO \/ BALANCE \/ ESFUERZO/);
  assert.match(l2, /deja que la maza se separe del parche/i);
  assert.match(l2, /maza permanezca contra el parche/i);
  assert.match(l2, /no como evidencia experimental de superioridad/i);
  assert.doesNotMatch(l2, /data-notation-score|\.musicxml/);
});

test('L3 uses simple kick quarters and eighths without BPM as pass mark', async () => {
  const l3 = plain(await page('l3'));
  assert.match(l3, /f4-u3-l3-kick-pulse\.musicxml/);
  assert.match(l3, /compás A — cuatro negras de bombo/i);
  assert.match(l3, /compás B — ocho corcheas de bombo/i);
  assert.match(l3, /TIEMPO \/ SONIDO \/ RETORNO \/ TENSIÓN \/ EQUILIBRIO/);
  assert.match(l3, /BPM es una condición de práctica, no una nota/i);
});

test('L4 substitutes rather than layers and explicitly avoids H4 certification', async () => {
  const l4 = plain(await page('l4'));
  assert.match(l4, /f4-u3-l4-kick-substitution\.musicxml/);
  assert.match(l4, /no se añade como una capa extra: sustituye/i);
  assert.match(l4, /A → B → A/);
  assert.match(l4, /no se añaden ataques/i);
  assert.match(l4, /no certifica H4/i);
  assert.match(l4, /distingues sustitución de superposición/i);
});

test('checkpoint certifies only H2 minimum and leaves later kit skills open', async () => {
  const cp = plain(await page('checkpoint'));
  assert.match(cp, /MÍNIMO PARA AVANZAR/);
  assert.match(cp, /f4-u3-l3-kick-pulse\.musicxml/);
  assert.match(cp, /f4-u3-l4-kick-substitution\.musicxml/);
  assert.match(cp, /no existe BPM de aprobado/i);
  for (const excluded of ['H3 — hi-hat de pie', 'H4 — coordinación básica de cuatro extremidades', 'H5 — groove', 'H7 — independencia', 'dobles rápidos', 'doble pedal', 'heel-toe o slide funcional']) {
    assert.match(cp, new RegExp(excluded, 'i'));
  }
  assert.match(cp, /No es requisito para pasar a U4\/U5/i);
  assert.match(cp, /La perfección no es requisito para continuar/i);
});

test('kick pulse score is original, metrically complete and kick-only', async () => {
  const xml = await score('pulse');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
  assert.doesNotMatch(xml, /Snare Drum|Hi-Hat|Pedal Hi-Hat/i);
  const ms = measures(xml);
  assert.equal(ms.length, 2);
  assert.deepEqual(durations(ms[0]), [12, 12, 12, 12]);
  assert.deepEqual(durations(ms[1]), [6, 6, 6, 6, 6, 6, 6, 6]);
  assert.equal((xml.match(/<notehead>normal<\/notehead>/g) ?? []).length, 12);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 12);
});

test('substitution score preserves eight eighth-note attacks while changing only two to kick', async () => {
  const xml = await score('substitution');
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /<instrument-name>Snare Drum<\/instrument-name>/);
  assert.match(xml, /<instrument-name>Bass Drum<\/instrument-name>/);
  assert.doesNotMatch(xml, /Hi-Hat|Pedal Hi-Hat/i);
  const ms = measures(xml);
  assert.equal(ms.length, 2);
  for (const m of ms) assert.deepEqual(durations(m), [6, 6, 6, 6, 6, 6, 6, 6]);
  assert.equal((ms[0].match(/<instrument id="P1-I1"\/>/g) ?? []).length, 8);
  assert.equal((ms[0].match(/<instrument id="P1-I2"\/>/g) ?? []).length, 0);
  assert.equal((ms[1].match(/<instrument id="P1-I1"\/>/g) ?? []).length, 6);
  assert.equal((ms[1].match(/<instrument id="P1-I2"\/>/g) ?? []).length, 2);
  assert.equal((xml.match(/<notehead>normal<\/notehead>/g) ?? []).length, 16);
  assert.doesNotMatch(xml, /<chord\s*\/>/);
});

test('U2 manual boundary remains intact when U3 introduces kick', async () => {
  const u2 = plain(await readFile(path.join(pagesRoot, 'f4-u2-checkpoint-misma-idea-superficies.md'), 'utf8'));
  assert.match(u2, /MÍNIMO PARA AVANZAR A U3\/U4/);
  assert.match(u2, /H2 — técnica de bombo/);
  assert.match(u2, /sin exigir todavía pies, groove o cuatro extremidades/i);
});

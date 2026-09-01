import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notation = path.resolve('public/bateria/notation/f5/u11/f5-u11-pieza-c-reference.musicxml');
const pages = {
  overview: 'f5-u11-overview.md',
  l1: 'f5-u11-l1-pieza-c-forma-primer-mapa.md',
  l2: 'f5-u11-l2-aprendizaje-hibrido-fuentes.md',
  l3: 'f5-u11-l3-simulacion-sesion-informacion-parcial.md',
  l4: 'f5-u11-l4-grabacion-recuperacion-segunda-toma.md',
  check: 'f5-u11-checkpoint-i3-funcional.md',
} as const;
async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F5 U11 has overview, four lessons and Checkpoint 5D in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const f = fm(await page(key));
    assert.match(f, /^phase:\s*5$/m);
    assert.match(f, /^unit:\s*11$/m);
    assert.match(f, /^unitSlug:\s*fase-5-unidad-11$/m);
    assert.match(f, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('check')), /^kind:\s*checkpoint$/m);
});

test('overview defines original Piece C and hybrid-learning boundaries', async () => {
  const t = plain(await page('overview'));
  assert.match(t, /Pieza C es una pieza original de 32 compases en 4\/4/i);
  assert.match(t, /INTRO 4 → A 8 → B 8 → A' 8 → OUTRO 4/i);
  assert.match(t, /NINGUNA FUENTE ES “LA MÚSICA ENTERA”/i);
  assert.match(t, /TIEMPO → FORMA → ENTRADAS → GROOVE\/FEEL → DINÁMICA → FIGURES\/FILLS → DETALLE/i);
  assert.match(t, /No existe BPM de aprobado/i);
});

test('L1 listens first, embeds the original formal reference and preserves the 32-bar map', async () => {
  const t = plain(await page('l1'));
  assert.match(t, /f5-u11-pieza-c-reference\.musicxml/);
  assert.match(t, /ESCUCHAR PRIMERO ≠ ADIVINAR TODO/i);
  assert.match(t, /INTRO 4 → A 8 → B 8 → A' 8 → OUTRO 4/i);
  assert.match(t, /Total: 32 compases de 4\/4/i);
  assert.match(t, /La pregunta no es “¿copié el playback\?”/i);
});

test('L2 assigns distinct roles to listening, chart, memory and analysis', async () => {
  const t = plain(await page('l2'));
  assert.match(t, /APRENDIZAJE HÍBRIDO ≠ MIRAR TODO A LA VEZ/i);
  assert.match(t, /Escucha — ¿qué relación musical percibo\?/i);
  assert.match(t, /Chart — ¿dónde estoy y qué viene después\?/i);
  assert.match(t, /Memoria — ¿qué necesito recuperar sin apoyo\?/i);
  assert.match(t, /Análisis — ¿dónde está el verdadero riesgo\?/i);
});

test('L3 treats partial information as a prepared musical task, not blind improvisation', async () => {
  const t = plain(await page('l3'));
  assert.match(t, /INFORMACIÓN PARCIAL ≠ IMPROVISACIÓN A CIEGAS/i);
  assert.match(t, /TIEMPO → FORMA → ENTRADA\/CUE → DINÁMICA → GROOVE → DETALLE/i);
  assert.match(t, /ventana de interacción, no certificación de I6 funcional/i);
  assert.match(t, /No se evalúa densidad ni BPM/i);
});

test('L4 uses recording as feedback and one localized diagnostic chain', async () => {
  const t = plain(await page('l4'));
  assert.match(t, /GRABACIÓN = FEEDBACK\. UNA TOMA FAVORABLE ≠ COMPETENCIA RETENIDA/i);
  assert.match(t, /UNA DIMENSIÓN CRÍTICA PRIMERO/i);
  assert.match(t, /síntoma → hipótesis → prueba → correctivo → recomposición/i);
  assert.match(t, /Toma 2 — condiciones comparables/i);
  assert.match(t, /No se exige producción profesional, una toma perfecta ni BPM prefijado/i);
});

test('Checkpoint 5D certifies I3 functional but not I4 global or Hito 6', async () => {
  const t = plain(await page('check'));
  assert.match(t, /I3 COMPETENTE\/FUNCIONAL: aprende una pieza adecuada combinando escucha, lectura, memoria y análisis/i);
  assert.match(t, /FUNCIONAL ≠ PERFECTO\. FUNCIONAL ≠ UNA TOMA BUENA/i);
  assert.match(t, /I4 COMPETENTE\/FUNCIONAL global en varias piezas/i);
  assert.match(t, /Hito 6/i);
  assert.match(t, /No existe BPM de aprobado/i);
});

test('U11 Piece C reference is original, five-line, 120 BPM and exactly 32 complete 4/4 measures', async () => {
  const x = await readFile(notation, 'utf8');
  assert.match(x, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(x, /esqueleto formal-sonoro/i);
  assert.match(x, /<staff-lines>5<\/staff-lines>/);
  assert.match(x, /<sound tempo="120"\/>/);
  assert.match(x, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.equal((x.match(/<measure number=/g) ?? []).length, 32);
  assert.match(x, /INTRO — 4 compases/);
  assert.match(x, />A — 8 compases</);
  assert.match(x, />B — 8 compases</);
  assert.match(x, />A' — 8 compases</);
  assert.match(x, /OUTRO — 4 compases/);
  assert.match(x, />CIERRE</);
  assert.doesNotMatch(x, /<time-modification>/);
});

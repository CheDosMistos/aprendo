import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const pages = {
  overview: 'f5-u12-overview.md',
  l1: 'f5-u12-l1-protocolo-evidencia-condiciones.md',
  l2: 'f5-u12-l2-piezas-a-b-dos-rutas.md',
  l3: 'f5-u12-l3-pieza-c-evidencia-hibrida.md',
  l4: 'f5-u12-l4-portfolio-recuperacion-decision.md',
  check: 'f5-u12-checkpoint-hito6.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }
const hito6 = /Interpretar varias piezas completas de dificultad adecuada manteniendo estructura, tiempo, dinámica y recuperación ante errores/i;

test('F5 U12 has overview, four lessons and final checkpoint in order', async () => {
  for (const [order, key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) {
    const f = fm(await page(key));
    assert.match(f, /^phase:\s*5$/m);
    assert.match(f, /^unit:\s*12$/m);
    assert.match(f, /^unitSlug:\s*fase-5-unidad-12$/m);
    assert.match(f, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('check')), /^kind:\s*checkpoint$/m);
});

test('overview preserves the literal Hito 6 and the three-piece operationalization', async () => {
  const t = plain(await page('overview'));
  assert.match(t, hito6);
  assert.match(t, /tres piezas completas de dificultad adecuada/i);
  assert.match(t, /Pieza A/i);
  assert.match(t, /Pieza B/i);
  assert.match(t, /Pieza C/i);
  assert.match(t, /decisión curricular del curso, no un estándar científico ni una regla universal/i);
  assert.match(t, /no tienen que tocarse en una única sesión/i);
  assert.match(t, /al menos dos familias estilísticas/i);
  assert.match(t, /No existe BPM de aprobado/i);
});

test('L1 requires declared conditions and safe session load without a mandatory numeric average', async () => {
  const t = plain(await page('l1'));
  assert.match(t, /EVIDENCIA SIN CONDICIONES DECLARADAS = EVIDENCIA DIFÍCIL DE INTERPRETAR/i);
  assert.match(t, /PIEZA → CONDICIONES → EVIDENCIA → DIMENSIÓN CRÍTICA → RECUPERACIÓN → DECISIÓN/i);
  assert.match(t, /COMPARABLE ≠ IDÉNTICO/i);
  assert.match(t, /CARGA AUDITIVA = NIVEL × DURACIÓN/i);
  assert.match(t, /No existe BPM de aprobado ni media numérica obligatoria/i);
});

test('L2 preserves A chart/backbeat and B listening/shuffle as two different routes', async () => {
  const t = plain(await page('l2'));
  assert.match(t, /Pieza A: ruta guiada por chart dentro de una familia de backbeat/i);
  assert.match(t, /Pieza B: ruta predominantemente auditiva dentro de una familia shuffle/i);
  assert.match(t, /USAR CHART ≠ NO SABER LA PIEZA/i);
  assert.match(t, /SHUFFLE ≠ CORCHEAS RECTAS CON OTRO NOMBRE/i);
  assert.match(t, /BACKBEAT BINARIO ↔ SHUFFLE \/ SUBDIVISIÓN TERNARIA/i);
  assert.match(t, /No hagas una media numérica entre ambas/i);
});

test('L3 reuses Checkpoint 5D, hybrid sources, H8 and separated evidence', async () => {
  const t = plain(await page('l3'));
  assert.match(t, /RECUPERACIÓN ACTIVA ANTES DE REESTUDIO/i);
  assert.match(t, /COMBINAR FUENTES ≠ DEPENDER DE TODAS TODO EL TIEMPO/i);
  assert.match(t, /FORMA → TIEMPO → CONTINUIDAD → DINÁMICA → RECUPERACIÓN → SONIDO\/BALANCE → DETALLE/i);
  assert.match(t, /Checkpoint 5D ya certificó I3 COMPETENTE\/FUNCIONAL/i);
  assert.match(t, /Segunda evidencia separada/i);
  assert.match(t, /No existe BPM de aprobado/i);
});

test('L4 uses a qualitative portfolio, a critical dimension and the standard correction chain', async () => {
  const t = plain(await page('l4'));
  assert.match(t, /PORTFOLIO ≠ MEDIA NUMÉRICA DE TRES TOMAS/i);
  assert.match(t, /error local/i);
  assert.match(t, /problema de pieza/i);
  assert.match(t, /problema transversal/i);
  assert.match(t, /síntoma → hipótesis → prueba → correctivo → recomposición/i);
  assert.match(t, /AVANZAR/i);
  assert.match(t, /MANTENER/i);
  assert.match(t, /CORREGIR/i);
  assert.match(t, /REDUCIR CARGA/i);
});

test('final checkpoint preserves Hito 6, boundaries and non-universal three-piece rule', async () => {
  const t = plain(await page('check'));
  assert.match(t, hito6);
  assert.match(t, /TRES PIEZAS ES UNA DECISIÓN CURRICULAR DE ESTE CURSO, NO UN ESTÁNDAR CIENTÍFICO NI UNA REGLA UNIVERSAL/i);
  assert.match(t, /no tienen que tocarse en una única sesión/i);
  assert.match(t, /No todas las competencias H5–H8, I2–I4, C y F3 tienen que mostrar el mismo nivel simultáneamente/i);
  assert.match(t, /RECUPERACIÓN ANTE ERRORES ES PARTE DEL HITO, NO UNA EXCEPCIÓN A OCULTAR/i);
  assert.match(t, /tres tomas perfectas/i);
  assert.match(t, /BPM prefijado/i);
  assert.match(t, /complejidad estilística artificial/i);
  assert.match(t, /No significa ser un baterista avanzado/i);
});

test('U12 deliberately introduces no new notation embed', async () => {
  for (const key of Object.keys(pages) as (keyof typeof pages)[]) {
    assert.doesNotMatch(await page(key), /data-notation-score|\/bateria\/notation\/f5\/u12\//i);
  }
});

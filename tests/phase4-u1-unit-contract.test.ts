import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve('src/courses/bateria/content/pages');
const pages = {
  overview: 'f4-u1-overview.md',
  l1: 'f4-u1-l1-antes-primer-golpe.md',
  l2: 'f4-u1-l2-asiento-equilibrio-alcance.md',
  l3: 'f4-u1-l3-escuchar-superficies.md',
  l4: 'f4-u1-l4-transferencia-cero.md',
  checkpoint: 'f4-u1-checkpoint-kit-listo-transferir.md',
} as const;

async function page(key: keyof typeof pages) { return readFile(path.join(root, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }

test('F4 U1 has overview, four lessons and checkpoint in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*4$/m);
    assert.match(frontmatter, /^unit:\s*1$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-4-unidad-1$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('checkpoint')), /^kind:\s*checkpoint$/m);
  assert.match(fm(await page('checkpoint')), /^contentId:\s*bat-f4-u1-check$/m);
});

test('F4 U1 preserves the approved transfer principle and keeps U1 bounded', async () => {
  const overview = await page('overview');
  assert.match(overview, /No reiniciar\. Transferir\./i);
  assert.match(overview, /U1 no enseña todavía groove, fills ni técnica específica de bombo o hi-hat/i);
  assert.match(overview, /No existe un ángulo universal de rodilla, una altura de caja perfecta ni una geometría que debas copiar/i);
});

test('L1 installs hearing and load safety before pedal technique', async () => {
  const l1 = await page('l1');
  assert.match(l1, /nivel × duración × repetición de exposición/i);
  assert.match(l1, /usa protección auditiva adecuada en contextos ruidosos/i);
  assert.match(l1, /en electrónica, revisa también el nivel que llega a tus oídos/i);
  assert.match(l1, /Hoy no practicas técnica de pedal/i);
  assert.match(l1, /Dolor persistente, hormigueo, entumecimiento o pérdida de fuerza\/control/i);
});

test('L2 uses observable ergonomics instead of universal geometry', async () => {
  const l2 = await page('l2');
  assert.match(l2, /Un ajuste sólo cuenta como mejora si mejora la tarea/i);
  assert.match(l2, /No se fijan centímetros, grados de rodilla ni alturas universales/i);
  assert.match(l2, /PROBLEMA → CAMBIO → EFECTO/);
  assert.match(l2, /Heel-up, heel-down y otras técnicas pertenecen a U3\/U4/i);
  assert.match(l2, /cambia una sola variable de montaje/i);
});

test('L3 keeps rhythm constant and compares one surface at a time', async () => {
  const l3 = await page('l3');
  assert.match(l3, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO — LABORATORIO DE SUPERFICIES/);
  assert.match(l3, /misma célula completa en una superficie cada vez/i);
  assert.match(l3, /No hay BPM de aprobado/i);
  assert.match(l3, /Eso es evidencia inicial de \*\*A8\*\*, no dominio de orquestación/i);
  assert.doesNotMatch(l3, /data-notation-score|\.musicxml/);
});

test('L4 is zero transfer with known material and a four-way diagnosis', async () => {
  const l4 = await page('l4');
  assert.match(l4, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO — TRANSFERENCIA CERO/);
  assert.match(l4, /que ya conozcas/i);
  assert.match(l4, /ACCESO \/ SUPERFICIE \/ MOVIMIENTO \/ TIEMPO/);
  assert.match(l4, /Mueve \*\*la célula completa\*\* a un tom u otra superficie manual/i);
  assert.match(l4, /Todavía no alternes caja\/tom dentro de la misma frase/i);
  for (const id of ['H2 bombo', 'H3 hi-hat de pie', 'H4 coordinación de cuatro extremidades', 'H5 groove', 'H6 fills', 'G5 orquestación creativa']) {
    assert.match(l4, new RegExp(id));
  }
});

test('checkpoint tests H1 readiness without hidden later-phase requirements', async () => {
  const cp = await page('checkpoint');
  assert.match(cp, /MÍNIMO PARA AVANZAR A U2/);
  assert.match(cp, /asiento y piezas principales están ajustados de forma sostenible/i);
  assert.match(cp, /estrategia básica de escucha segura/i);
  assert.match(cp, /célula manual ya conocida en caja y en otra superficie/i);
  assert.match(cp, /ACCESO \/ SUPERFICIE \/ MOVIMIENTO \/ TIEMPO/);
  assert.match(cp, /no exige[\s\S]*H2[\s\S]*H3[\s\S]*H4[\s\S]*H5[\s\S]*H6/i);
  assert.match(cp, /No demuestra automáticamente H1 MÍNIMO/i);
  assert.match(cp, /COMPETENTE no es requisito para entrar en U2/i);
});

test('F4 U1 creates no posture grader, medical diagnosis or mandatory photo workflow', async () => {
  const all = (await Promise.all((Object.keys(pages) as (keyof typeof pages)[]).map(page))).join('\n');
  assert.doesNotMatch(all, /data-(?:posture|ergonomic|medical|hearing)-grader/i);
  assert.doesNotMatch(all, /sube una foto|debes subir.*foto|foto obligatoria/i);
  assert.doesNotMatch(all, /diagnosticamos|diagnóstico médico/i);
});

test('Phase 3 Hito 4 remains intact when Phase 4 U1 is introduced', async () => {
  const f3 = await readFile(path.join(root, 'f3-u12-hito-4-autor-ritmico.md'), 'utf8');
  assert.match(f3, /Crear, escribir, tocar y explicar una breve pieza rítmica propia empleando desarrollo motívico y al menos una transformación consciente/);
  assert.match(f3, /Fase 4 — Transferencia al kit se activa cuando exista kit/);
});

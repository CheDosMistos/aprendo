import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const pages = {
  overview: 'f5-u6-overview.md',
  l1: 'f5-u6-l1-sonido-consistencia-balance.md',
  l2: 'f5-u6-l2-afinacion-amortiguacion-comparada.md',
  l3: 'f5-u6-l3-click-backing-monitorizacion.md',
  l4: 'f5-u6-l4-grabacion-ab-feedback.md',
  check: 'f5-u6-checkpoint-h8-minimo.md',
} as const;
async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot, pages[key]), 'utf8'); }
function fm(markdown: string) { return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown: string) { return markdown.replace(/[*_`]/g, ''); }

test('F5 U6 has overview, four lessons and Checkpoint 5C in order', async () => {
  const keys = Object.keys(pages) as (keyof typeof pages)[];
  for (const [order, key] of keys.entries()) {
    const frontmatter = fm(await page(key));
    assert.match(frontmatter, /^phase:\s*5$/m);
    assert.match(frontmatter, /^unit:\s*6$/m);
    assert.match(frontmatter, /^unitSlug:\s*fase-5-unidad-6$/m);
    assert.match(frontmatter, new RegExp(`^order:\\s*${order}$`, 'm'));
  }
  assert.match(fm(await page('check')), /^kind:\s*checkpoint$/m);
});

test('overview keeps H8 functional and separates source authority', async () => {
  const text = plain(await page('overview'));
  assert.match(text, /Novedad dominante: H8 funcional/i);
  assert.match(text, /H8 MÍNIMO: reconoce diferencias básicas de sonido y registra su ejecución/i);
  assert.match(text, /SONIDO FUNCIONAL ≠ INGENIERÍA DE AUDIO/i);
  assert.match(text, /SALUD — NIOSH/i);
  assert.match(text, /TRADICIÓN TÉCNICA \/ FABRICANTE/i);
  assert.match(text, /REFERENCIA INSTITUCIONAL DE PRÁCTICA/i);
  assert.match(text, /No existe BPM de aprobado/i);
});

test('L1 establishes comparable sound and one-variable diagnosis', async () => {
  const text = plain(await page('l1'));
  assert.match(text, /misma posición del dispositivo de grabación/i);
  assert.match(text, /CONSISTENCIA ≠ TOCAR SIEMPRE EN EL CENTRO/i);
  assert.match(text, /SÍNTOMA → HIPÓTESIS → UNA PRUEBA/i);
  assert.match(text, /1–2 problemas prioritarios/i);
  assert.match(text, /NIOSH/i);
});

test('L2 uses manufacturer guidance without prescribing a universal tuning pitch', async () => {
  const text = plain(await page('l2'));
  assert.match(text, /AFINACIÓN ≠ BUSCAR UNA NOTA UNIVERSAL/i);
  assert.match(text, /TRADICIÓN TÉCNICA \/ GUÍA DE FABRICANTE/i);
  assert.match(text, /No adoptamos como norma universal ninguna nota concreta/i);
  assert.match(text, /cambio pequeño y reversible/i);
  assert.match(text, /MEJORA PARA ESTA TAREA \/ EMPEORA \/ NO ESTÁ CLARO/i);
});

test('L3 integrates click and backing as monitored references rather than volume targets', async () => {
  const text = plain(await page('l3'));
  assert.match(text, /CLICK ≠ ALGO QUE HAY QUE PERSEGUIR/i);
  assert.match(text, /mínimo nivel que permita seguir la referencia/i);
  assert.match(text, /C4 ya estaba activo antes de U6/i);
  assert.match(text, /Berklee Online/i);
  assert.match(text, /no requisitos de Checkpoint 5C/i);
});

test('L4 uses the course recording protocol as A B evidence', async () => {
  const text = plain(await page('l4'));
  assert.match(text, /UNA PREGUNTA > DIEZ IMPRESIONES/i);
  assert.match(text, /30–60 s/i);
  assert.match(text, /1–2 prioridades/i);
  assert.match(text, /Toma B/i);
  assert.match(text, /evidencia de preferencia/i);
  assert.match(text, /smartphone\/micrófono integrado/i);
});

test('Checkpoint 5C certifies H8 minimum only', async () => {
  const text = plain(await page('check'));
  assert.match(text, /H8 MÍNIMO: reconoce diferencias básicas de sonido y registra su ejecución/i);
  assert.match(text, /aplica al menos un ajuste básico razonado y reversible/i);
  assert.match(text, /MANTENER.*REVERTIR.*INCONCLUSO/is);
  assert.match(text, /NO CERTIFICA[\s\S]*afinación profesional/i);
  assert.match(text, /No existe BPM de aprobado/i);
});

test('U6 intentionally introduces no new notation asset', async () => {
  for (const key of Object.keys(pages) as (keyof typeof pages)[]) {
    assert.doesNotMatch(await page(key), /data-notation-score/);
  }
});

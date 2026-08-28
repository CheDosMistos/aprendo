import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u7-overview.md');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U7 overview generalizes compound meter without changing the approved scope', async () => {
  const markdown = await readFile(overviewPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u7-overview\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*7\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-7\s*$/m);
  assert.match(data, /^slug:\s*fase-2-unidad-7-introduccion\s*$/m);
  assert.match(data, /^kind:\s*unit\s*$/m);
  assert.match(data, /^order:\s*0\s*$/m);
  assert.match(data, /^duration:\s*Unidad flexible · 4 lecciones \+ checkpoint\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D4', 'E1', 'E2', 'E5', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U7 overview`);
  }
  assert.doesNotMatch(competencies, /\bD5\b/);

  assert.match(markdown, /6\/8 = 2×3, 9\/8 = 3×3 Y 12\/8 = 4×3/i);
  assert.match(markdown, /lo \*\*generaliza\*\*/i);
  assert.match(markdown, /Métrica simple:[\s\S]{0,160}dos partes iguales/i);
  assert.match(markdown, /Métrica compuesta:[\s\S]{0,160}tres partes iguales/i);
  assert.match(markdown, /AGRUPACIÓN \/ REAGRUPACIÓN ≠ CAMBIO DE COMPÁS/);
});

test('Phase 2 U7 overview keeps E5 explicitly initial and bounded', async () => {
  const markdown = await readFile(overviewPath, 'utf8');

  assert.match(markdown, /E5 entra sólo de forma inicial/i);
  assert.match(markdown, /ejemplos claros y breves/i);
  assert.match(markdown, /No significa todavía:[\s\S]*reconocimiento métrico general en repertorio ambiguo/i);
  assert.match(markdown, /análisis formal profundo/i);
  assert.match(markdown, /declarar E5 globalmente `FUNCIONAL` por completar U7/i);
});

test('Phase 2 U7 overview fixes the four-lesson route and protects later-unit boundaries', async () => {
  const markdown = await readFile(overviewPath, 'utf8');

  assert.match(markdown, /1\. \*\*9\/8: tres pulsos compuestos\*\*/);
  assert.match(markdown, /2\. \*\*12\/8: cuatro pulsos compuestos\*\*/);
  assert.match(markdown, /3\. \*\*Simple o compuesto: justificar la jerarquía\*\*/);
  assert.match(markdown, /4\. \*\*Leer, escuchar, clasificar y explicar\*\*/);
  assert.match(markdown, /5\. \*\*Puerta de generalización compuesta\*\*/);

  assert.match(markdown, /sextillos y ornamentación escrita como vocabulario central — U8/);
  assert.match(markdown, /primera vista formal D5 — U9/);
  assert.match(markdown, /click reducido, half-time o gaps — U10/);
  assert.match(markdown, /shuffle\/jazz como objetivo estilístico/);
  assert.match(markdown, /kit o coordinación de cuatro extremidades/);
  assert.match(markdown, /polirritmia, polimetría o modulación métrica/);
});

test('Phase 2 U7 overview preserves notation, playback and evaluation contracts without adding lesson artifacts', async () => {
  const markdown = await readFile(overviewPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0);
  assert.match(markdown, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(markdown, /<time>` debe codificar 9\/8 o 12\/8 real/);
  assert.match(markdown, /después del intento propio/i);
  assert.match(markdown, /♩\. = X/);
  assert.match(markdown, /BPM queda registrado como \*\*condición\*\*/i);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  for (const decision of ['CONTINUAR', 'CONTINUAR + CORRECTIVO', 'REDUCIR NOVEDAD', 'DETENER CARGA']) {
    assert.match(markdown, new RegExp(decision.replace('+', '\\+')));
  }
  assert.match(markdown, /no actualiza automáticamente/i);
});

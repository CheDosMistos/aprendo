import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u3-l4-oir-escribir-transformar-duracion.md');
const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u3-overview.md');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U3 L4 changes representation without introducing a new rhythmic vocabulary', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u3-l4\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*3\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-3\s*$/m);
  assert.match(data, /^slug:\s*oir-escribir-y-transformar-duracion\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*4\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  for (const competency of ['C1', 'C2', 'D2', 'D6', 'E2', 'E3', 'E4', 'F1', 'F2', 'K2', 'K4', 'K5', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in the U3 L4 contract`);
  }

  assert.match(markdown, /Primero identifica qué ataques oyes\. Después decide qué información aporta la notación sobre la duración/i);
  assert.match(markdown, /oír que \*\*no existe un segundo ataque\*\* no demuestra por sí solo si esa posición está escrita como una ligadura o como un silencio/i);
  assert.match(markdown, /El audio informa sobre ataques; la notación añade información sobre duración escrita/i);
  assert.doesNotMatch(data, /\bB7\b/);
});

test('Phase 2 U3 L4 uses one protected recovery score and bounded original dictation stimuli with real durations', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1, 'L4 should reuse L3 only for retrieval, not introduce an unnecessary new score');
  assert.match(markdown, /data-score-src="\/bateria\/notation\/f2\/u3\/f2-u3-l3-sincopa-i\.musicxml"/);
  assert.match(markdown, /data-score-feedback="after-attempt"/);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.match(markdown, /data-score-source-label="MusicXML — fuente del ejercicio"/);

  const dictations = [...markdown.matchAll(/<div data-rhythm-dictation([^>]*)><\/div>/g)];
  assert.equal(dictations.length, 3, 'L4 should keep the hearing transfer short and diagnostic');

  const attrs = dictations.map((match) => match[1]);
  assert.match(attrs[0], /data-bpm="56"/);
  assert.match(attrs[0], /data-subdivision="2"/);
  assert.match(attrs[0], /data-pattern="10"/);
  assert.match(attrs[1], /data-pattern="11"/);
  assert.match(attrs[2], /data-bpm="54"/);
  assert.match(attrs[2], /data-subdivision="2"/);
  assert.match(attrs[2], /data-pattern="0101"/);

  assert.match(markdown, /un pulso: hay un ataque en 1 y no existe un nuevo ataque/i);
  assert.match(markdown, /dos pulsos: ataques en &amp; de 1 y &amp; de 2/i);
  assert.doesNotMatch(markdown, /data-duration|>1 compás</i, 'Lesson content must not hard-code a dictation duration that can contradict the widget');
});

test('Phase 2 U3 L4 preserves the approved six-block shape and diagnoses representation changes separately', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación — 3 min',
    '## 2. OÍR → IDENTIFICAR — 5–6 min',
    '## 3. OÍR → ESCRIBIR — 5–6 min',
    '## 4. ESCRIBIR → TOCAR — 5–6 min',
    '## 5. TRANSFORMAR — 3–4 min',
    '## 6. Registro — 2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing approved block: ${heading}`);
  }

  assert.match(markdown, /primera discrepancia:[\s\S]*oído, memoria, notación, pulso, duración, ejecución o técnica/i);
  assert.match(markdown, /cambia una sola variable/i);
  assert.match(markdown, /No corrijas todas las categorías a la vez/i);
  assert.match(markdown, /Si has cambiado además dinámica, sticking, tempo y acentos/i);
});

test('Phase 2 U3 L4 keeps evaluation non-automatic and points only to the U3 checkpoint', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const overview = await readFile(overviewPath, 'utf8');

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige un BPM concreto/i);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /no declara E4 FUNCIONAL de forma global/i);
  assert.match(markdown, /El siguiente paso es \*\*20\.U3\.CP — Puerta de duración y síncopa I\*\*/i);
  assert.match(markdown, /no un examen de perfección/i);

  assert.match(overview, /Oír, escribir y transformar duración/);
  assert.match(overview, /Puerta de duración y síncopa I/);
  assert.match(overview, /U4 conserva/);
});

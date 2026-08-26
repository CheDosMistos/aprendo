import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u1-l2-fluidez-binaria.md');
const scorePath = path.resolve('public/bateria/notation/f2/u1/f2-u1-rejilla-binaria-silencios.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U1 L2 keeps binary reading as the dominant task without adding rudiments', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u1-l2\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*1\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-1\s*$/m);
  assert.match(data, /^slug:\s*fluidez-binaria-sin-memorizar-dibujos\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*2\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  for (const competency of ['C1', 'C2', 'D1', 'E1', 'E2', 'F1', 'K3', 'K5', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in the L2 contract`);
  }

  assert.match(markdown, /no memorices un dibujo con un nombre/i);
  assert.match(markdown, /rejilla temporal/i);
  assert.match(markdown, /silencio.*misma rejilla/is);
  assert.match(markdown, /No introduce síncopa estructurada/i);
  assert.match(markdown, /GUIADO[\s\S]*CON PISTAS[\s\S]*SIN PISTAS/);
  assert.match(markdown, /partitura \*\*sigue visible\*\*/i);
  assert.match(markdown, /SIN PISTAS.*no significa tocar la página completa de memoria/is);
});

test('Phase 2 U1 L2 uses one new original score plus L1 retrieval and does not claim formal first sight', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const score = await readFile(scorePath, 'utf8');

  await access(scorePath);
  assert.match(markdown, /f2-u1-lectura-entrada-a\.musicxml/);
  assert.match(markdown, /f2-u1-rejilla-binaria-silencios\.musicxml/);
  assert.equal((markdown.match(/f2-u1-rejilla-binaria-silencios\.musicxml/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0, 'L2 practice is not a formal first-sight sample');
  assert.match(markdown, /data-score-source-label="MusicXML — fuente del ejercicio"/);
  assert.match(markdown, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.doesNotMatch(score, /<rest\/><duration>1<\/duration><type>16th<\/type>/, 'Sixteenth-note rests belong to later density work, not this L2 score');
});

test('Phase 2 U1 L2 preserves the approved five-block timing and hearing transfer', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación — 3 min',
    '## 2. NÚCLEO — 10–12 min',
    '## 3. Retirada de ayuda — 5–6 min',
    '## 4. Oído — 3–4 min',
    '## 5. Registro — 2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing approved block: ${heading}`);
  }

  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 2, 'Expected two brief hearing cells');
  assert.match(markdown, /Escucha antes de mirar la respuesta/i);
  assert.match(markdown, /escuchar → localizar en la rejilla → vocalizar\/tocar → explicar/i);
  assert.match(markdown, /No evalúes esta microtarea por rapidez/i);
});

test('Phase 2 U1 L2 advancement remains evidence-based and does not use BPM as a gate', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige un BPM concreto/i);
  assert.match(markdown, /Completar la sesión \*\*no actualiza automáticamente\*\*/i);
  assert.match(markdown, /principal variable limitante/i);
  assert.match(markdown, /no concluyas automáticamente que D1 ha fallado/i);
});

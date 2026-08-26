import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u2-l1-rejilla-cuatro-posiciones.md');
const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u2-overview.md');
const scorePath = path.resolve('public/bateria/notation/f2/u2/f2-u2-rejilla-cuatro-posiciones.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U2 L1 opens the four-slot sixteenth grid as the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u2-l1\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*2\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-2\s*$/m);
  assert.match(data, /^slug:\s*la-rejilla-de-cuatro-posiciones\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*1\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  for (const competency of ['C1', 'C2', 'D1', 'E2', 'E3', 'F1', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in the U2 L1 contract`);
  }
  assert.doesNotMatch(data, /\bC3\b/, 'C3 belongs to U2 L2, not the dominant novelty of L1');
  assert.doesNotMatch(data, /\bB7\b/, 'Rudimental application belongs later in U2');

  assert.match(markdown, /El silencio elimina un ataque, no la posición temporal/i);
  assert.match(markdown, /1 e & a/);
  assert.match(markdown, /cuatro posiciones igual(?:es|mente espaciadas)/i);
  assert.match(markdown, /silencios de semicorchea como parte central/i);
  assert.match(markdown, /no convertimos la síncopa estructurada, las ligaduras o los puntillos en el nuevo concepto/i);
  assert.match(markdown, /GUIADO[\s\S]*CON PISTAS[\s\S]*SIN PISTAS/);
  assert.match(markdown, /SIN PISTAS.*no significa tocar de memoria/is);
});

test('Phase 2 U2 L1 uses one original U2 score with real sixteenth rests and keeps U1 retrieval separate', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const score = await readFile(scorePath, 'utf8');

  await access(scorePath);
  assert.match(markdown, /f2-u1-rejilla-binaria-silencios\.musicxml/);
  assert.match(markdown, /f2-u2-rejilla-cuatro-posiciones\.musicxml/);
  assert.equal((markdown.match(/f2-u2-rejilla-cuatro-posiciones\.musicxml/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0, 'U2 L1 practice is not a formal first-sight checkpoint');
  assert.match(markdown, /data-score-feedback="after-attempt"/);
  assert.match(markdown, /data-score-source-label="MusicXML — fuente del ejercicio"/);
  assert.match(markdown, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(score, /<rest\/><duration>1<\/duration><voice>1<\/voice><type>16th<\/type>/, 'U2 L1 must genuinely introduce sixteenth-note rests');
  assert.doesNotMatch(score, /<tie\b|<tied\b|<dot\/>/, 'Ties and dots are reserved for U3');
});

test('Phase 2 U2 L1 preserves the approved five-block lesson shape and four-slot hearing transfer', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación U1 — 3 min',
    '## 2. NÚCLEO — 10–12 min',
    '## 3. Retirada de ayuda — 5–6 min',
    '## 4. Oído breve — 3–4 min',
    '## 5. Registro — 2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing approved block: ${heading}`);
  }

  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 1, 'L1 uses one brief discrimination task');
  assert.match(markdown, /data-subdivision="4"/);
  assert.match(markdown, /data-pattern="1011101110111011"/);
  assert.match(markdown, /difieren \*\*en una sola posición de semicorchea\*\*/i);
  assert.match(markdown, /ESCUCHAR → LOCALIZAR → IMITAR → EXPLICAR/);
  assert.match(markdown, /No evalúes esta tarea por velocidad de respuesta/i);
});

test('Phase 2 U2 L1 advancement is evidence-based and hands C3 to L2 instead of smuggling it into L1', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const overview = await readFile(overviewPath, 'utf8');

  assert.match(markdown, /INFERENCIA:[\s\S]*EVIDENCIA:[\s\S]*TAREA:[\s\S]*CONDICIONES:[\s\S]*DECISIÓN:/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige un BPM concreto/i);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /La siguiente lección abrirá C3 de forma prudente/i);
  assert.match(markdown, /cambiar entre 2 y 4 subdivisiones por pulso/i);

  assert.match(overview, /20\.U2\.L1 — La rejilla de cuatro posiciones/);
  assert.match(overview, /20\.U2\.L2 — Silencios y cambio 2 ↔ 4 sin perder el pulso/);
  assert.match(overview, /20\.U2\.L3 — Oír, imitar y escribir la rejilla/);
  assert.match(overview, /20\.U2\.L4 — Doubles\/diddles sin alterar la línea/);
  assert.match(overview, /20\.U2\.CP — Puerta de semicorcheas y silencios/);
  assert.match(overview, /U3 conserva/i);
});

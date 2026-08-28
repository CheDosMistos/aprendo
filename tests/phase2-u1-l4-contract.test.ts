import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u1-l4-oido-escritura-primera-vista.md');
const firstSightPath = path.resolve('public/bateria/notation/f2/u1/f2-u1-primera-vista-l4.musicxml');
const pagesDir = path.resolve('src/courses/bateria/content/pages');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

async function countPageReferences(fragment: string): Promise<number> {
  const entries = await readdir(pagesDir, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const content = await readFile(path.join(pagesDir, entry.name), 'utf8');
    count += (content.match(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
  }
  return count;
}

test('Phase 2 U1 L4 is a representation-transfer lesson with no new PAS and no formal D5 assignment', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u1-l4\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*1\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-1\s*$/m);
  assert.match(data, /^slug:\s*oido-escritura-y-primera-vista\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*4\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  for (const competency of ['C1', 'C2', 'D1', 'D6', 'E2', 'E3', 'E4', 'F1', 'K4', 'K5', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in the L4 contract`);
  }
  assert.doesNotMatch(data, /\bD5\b/, 'U1 may preview new-reading procedure but formal D5 starts in U9');

  assert.match(markdown, /no añade una nueva figura ni un nuevo rudimento/i);
  assert.match(markdown, /ESCUCHAR → RETENER\/CANTAR → ESCRIBIR → LEER → TOCAR → COMPROBAR/);
  assert.match(markdown, /VENTANA CURRICULAR/);
  assert.match(markdown, /No se registra todavía como evidencia formal D5/i);
  assert.match(markdown, /U9.*introduce.*formalmente D5|D5.*se introduce.*formalmente en U9/i);
  assert.match(markdown, /ESENCIAL AHORA:/);
  assert.match(markdown, /AMPLIACIÓN:/);
  assert.match(markdown, /AVANZADO:/);
});

test('Phase 2 U1 L4 preserves the approved six-block structure and keeps the window optional', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Dictado corto — 4–5 min',
    '## 2. Escritura — 4–5 min',
    '## 3. Ventana temprana de lectura nueva — 6–8 min',
    '## 4. Recuperación — 4–5 min',
    '## 5. AMPLIACIÓN / VENTANA',
    '## 6. Registro — 2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing approved block: ${heading}`);
  }

  assert.match(markdown, /Duración curricular: 0–3 min/);
  assert.match(markdown, /no activa un temporizador de práctica propio/i);
  assert.match(markdown, /3 \+ 3 \+ 2/);
  assert.match(markdown, /siguen siendo 4\/4/i);
  assert.match(markdown, /agrupación/i);
  assert.match(markdown, /no 7\/8, no polirritmia y no polimetría/i);
  assert.match(markdown, /No lo evalúes ni lo uses como requisito/i);
});

test('Phase 2 U1 L4 uses real dictation: listen, retain, write, then reveal', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 2, 'L4 should contain two short dictation cells');
  assert.match(markdown, /Escuchar dictado/);
  assert.match(markdown, /canta o retén la célula antes de escribir/i);
  assert.match(markdown, /solo entonces pulsa \*\*Mostrar respuesta\*\*/i);
  assert.match(markdown, /Puedes repetir el estímulo/i);
  assert.match(markdown, /no una prueba estandarizada de memoria/i);
  assert.match(markdown, /data-pattern="10100110"/);
  assert.match(markdown, /data-pattern="01101001"/);
});

test('Phase 2 U1 L4 writing task closes 4/4 without advancing sixteenth-note rests', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /una célula propia de un solo compás en 4\/4/i);
  assert.match(markdown, /duración total/i);
  assert.match(markdown, /ataques\/silencios/i);
  assert.match(markdown, /legibilidad/i);
  assert.match(markdown, /no conviertas los silencios de semicorchea en el nuevo problema/i);
  assert.match(markdown, /si debes corregir \*\*la ejecución\*\* o \*\*la escritura\*\*/i);
});

test('Phase 2 U1 L4 early new-reading window is exclusive, protected and not formal D5 evidence', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 1, 'L4 should use the protected first-encounter UI once');
  assert.match(markdown, /f2-u1-primera-vista-l4\.musicxml/);
  assert.equal(await countPageReferences('f2-u1-primera-vista-l4.musicxml'), 2, 'The exclusive L4 asset should only appear in the L4 score src and source URL');
  assert.match(markdown, /material exclusivo de esta ventana de lectura nueva/i);
  assert.match(markdown, /no debes escucharla antes del primer intento/i);
  assert.match(markdown, /protección sirve para enseñar el procedimiento.*sin convertir la muestra en una evaluación formal D5/is);
  assert.match(markdown, /Pulsa \*\*Finalizar intento\*\* antes de usar playback/i);
  assert.match(markdown, /\*\*PRECISIÓN:\*\*/);
  assert.match(markdown, /\*\*CONTINUIDAD \/ RECUPERACIÓN:\*\*/);
  assert.match(markdown, /no vuelvas a contarla como material nuevo/i);
  assert.match(markdown, /no actualiza D5/i);
});

test('Phase 2 U1 L4 protected MusicXML is original, metric-valid and stays inside U1 notation', async () => {
  const score = await readFile(firstSightPath, 'utf8');

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /No reproduce PAS ni material de métodos comerciales/);
  assert.match(score, /<sign>percussion<\/sign>/);
  assert.match(score, /<staff-lines>5<\/staff-lines>/);
  assert.match(score, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.equal((score.match(/<measure number=/g) ?? []).length, 4);
  assert.doesNotMatch(score, /<rest\s*\/>\s*<duration>1<\/duration>/, 'L4 must not introduce sixteenth-note rests ahead of U2');

  const measures = [...score.matchAll(/<measure number="\d+">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [index, measure] of measures.entries()) {
    const durations = [...measure[1].matchAll(/<duration>(\d+)<\/duration>/g)].map((match) => Number(match[1]));
    assert.equal(durations.reduce((sum, value) => sum + value, 0), 16, `Measure ${index + 1} must close at 16 divisions`);
  }
});

test('Phase 2 U1 L4 recovery is delayed practice, not another protected new-reading sample', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 2, 'L4 should contain one protected new-reading score and one recovery score');
  assert.match(markdown, /compases 7–8/i);
  assert.match(markdown, /f2-u1-rejilla-binaria-silencios\.musicxml/);
  assert.match(markdown, /data-score-feedback="after-attempt"/);
  assert.match(markdown, /sin practicarla inmediatamente antes/i);
  assert.match(markdown, /sin playback previo/i);
});

test('Phase 2 U1 L4 advancement prepares the checkpoint without creating a BPM or D5 gate', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /INFERENCIA:[\s\S]*EVIDENCIA:[\s\S]*TAREA:[\s\S]*CONDICIONES:[\s\S]*DECISIÓN:/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /Completar la sesión \*\*no actualiza automáticamente\*\* C1, C2, D1, D6, E2, E3 ni E4/i);
  assert.match(markdown, /Esta ventana tampoco actualiza D5/i);
  assert.match(markdown, /U9 introduce formalmente D5/i);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige un BPM concreto/i);
  assert.match(markdown, /checkpoint — Puerta de fluidez binaria/i);
});
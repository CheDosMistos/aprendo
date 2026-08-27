import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u3-l1-ataque-duracion-ligadura.md');
const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u3-overview.md');
const scorePath = path.resolve('public/bateria/notation/f2/u3/f2-u3-l1-ataque-duracion-ligaduras.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U3 L1 opens attack versus duration through ties as the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u3-l1\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*3\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-3\s*$/m);
  assert.match(data, /^slug:\s*ataque-y-duracion-la-ligadura-elimina-el-nuevo-ataque\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*1\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  for (const competency of ['C1', 'C2', 'D1', 'D2', 'E2', 'E3', 'F1', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U3 L1`);
  }
  assert.doesNotMatch(data, /\bC3\b/, 'C3 is maintenance at most and should not be a declared L1 target');
  assert.doesNotMatch(data, /\bB7\b/, 'Rudimental application is not the U3 L1 novelty');

  assert.match(markdown, /ATAQUE ≠ DURACIÓN ≠ PULSO/);
  assert.match(markdown, /la segunda parte de la ligadura ocupa tiempo, pero \*\*no crea un golpe nuevo\*\*/i);
  assert.match(markdown, /No introducimos todavía puntillos ni enseñamos la síncopa como concepto estructurado/i);
  assert.match(markdown, /sticking sólo sobre ataques reales/i);
  assert.match(markdown, /GUIADO[\s\S]*CON PISTAS[\s\S]*SIN PISTAS/);
  assert.match(markdown, /SIN PISTAS.*no significa tocar de memoria/is);
});

test('Phase 2 U3 L1 uses protected U2 retrieval plus one original tied-note score', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const score = await readFile(scorePath, 'utf8');

  await access(scorePath);
  assert.match(markdown, /f2-u2-rejilla-cuatro-posiciones\.musicxml/);
  assert.match(markdown, /f2-u3-l1-ataque-duracion-ligaduras\.musicxml/);
  assert.equal((markdown.match(/f2-u3-l1-ataque-duracion-ligaduras\.musicxml/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 2, 'retrieval and new tied score both protect playback until an attempt');
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0, 'L1 practice is not a formal first-sight checkpoint');
  assert.match(markdown, /data-score-source-label="MusicXML — fuente del ejercicio"/);
  assert.match(markdown, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.doesNotMatch(score, /<dot\s*\/>|<time-modification>|<tuplet\b/, 'dots and tuplets belong later');

  assert.equal((score.match(/<tie type="start"\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<tie type="stop"\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<tied type="start"\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<tied type="stop"\/>/g) ?? []).length, 4);

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const totalDuration = [...body.matchAll(/<duration>(\d+)<\/duration>/g)]
      .reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(totalDuration, 16, `Measure ${number} must fill exactly 4/4 at divisions=4`);
    for (const noteBody of [...body.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((match) => match[1]).filter((text) => text.includes('<unpitched>'))) {
      assert.match(noteBody, /<notehead>normal<\/notehead>/);
    }
  }
});

test('Phase 2 U3 L1 preserves the approved five-block shape and hearing only tests reattack', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación U2 — 3 min',
    '## 2. NÚCLEO — 10–12 min',
    '## 3. Ejecución — 5–6 min',
    '## 4. Oído breve — 3–4 min',
    '## 5. Registro — 2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing U3 L1 block: ${heading}`);
  }

  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 1);
  assert.match(markdown, /data-subdivision="2"/);
  assert.match(markdown, /data-pattern="10"/);
  assert.match(markdown, /uno o dos ataques dentro del pulso/i);
  assert.match(markdown, /el oído por sí solo no puede demostrar si una ausencia de reataque estaba escrita como ligadura o como silencio/i);
  assert.match(markdown, /ataque audible.*duración escrita.*no idénticas/is);
});

test('Phase 2 U3 L1 advancement is evidence-based and hands dots to L2', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const overview = await readFile(overviewPath, 'utf8');

  assert.match(markdown, /INFERENCIA:[\s\S]*EVIDENCIA:[\s\S]*TAREA:[\s\S]*CONDICIONES:[\s\S]*DECISIÓN:/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige cero errores, un BPM concreto/i);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /La siguiente lección introduce.*\*\*el puntillo\*\*/i);

  assert.match(overview, /Ataque y duración: la ligadura elimina el nuevo ataque/);
  assert.match(overview, /Puntillo: más duración sin más golpes/);
  assert.match(overview, /Síncopa I: ataque desplazado, marco estable/);
  assert.match(overview, /Oír, escribir y transformar duración/);
  assert.match(overview, /Puerta de duración y síncopa I/);
  assert.match(overview, /U4 conserva:/);
});

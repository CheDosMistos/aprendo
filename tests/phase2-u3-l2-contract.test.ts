import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u3-l2-puntillo-duracion.md');
const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u3-overview.md');
const scorePath = path.resolve('public/bateria/notation/f2/u3/f2-u3-l2-puntillo-duracion.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U3 L2 introduces dotted duration as the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u3-l2\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*3\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-3\s*$/m);
  assert.match(data, /^slug:\s*puntillo-mas-duracion-sin-mas-golpes\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*2\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  for (const competency of ['C1', 'C2', 'D2', 'D6', 'F1', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in the U3 L2 contract`);
  }

  assert.match(markdown, /El puntillo añade tiempo, no añade un golpe/i);
  assert.match(markdown, /corchea con puntillo = `2 \+ 1 = 3` posiciones/i);
  assert.match(markdown, /puntillo amplía una duración en la mitad del valor original/i);
  assert.match(markdown, /dentro del pulso/i);
  assert.match(markdown, /eso corresponde a L3/i);
  assert.doesNotMatch(data, /\bB7\b/);
});

test('Phase 2 U3 L2 MusicXML encodes dotted eighths correctly and closes every 4/4 measure', async () => {
  const score = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);

  const dottedEighths = score.match(/<duration>3<\/duration><type>eighth<\/type><dot\/><notehead>normal<\/notehead>/g) ?? [];
  assert.ok(dottedEighths.length >= 8, 'L2 should contain a useful bank of genuine dotted eighths');
  assert.equal((score.match(/<dot\/>/g) ?? []).length, dottedEighths.length, 'Every dot in this asset belongs to a duration=3 eighth note');

  assert.equal((score.match(/<tie type="start"\/>/g) ?? []).length, 2, 'Two known tied equivalents should appear for comparison');
  assert.equal((score.match(/<tie type="stop"\/>/g) ?? []).length, 2);
  assert.equal((score.match(/<tied type="start"\/>/g) ?? []).length, 2);
  assert.equal((score.match(/<tied type="stop"\/>/g) ?? []).length, 2);
  assert.doesNotMatch(score, /<time-modification>|<tuplet\b/);

  const notes = [...score.matchAll(/<note>([\s\S]*?)<\/note>/g)].filter(([, body]) => !body.includes('<rest/>'));
  assert.ok(notes.length > 0);
  for (const [, body] of notes) {
    assert.match(body, /<notehead>normal<\/notehead>/, 'Every sounded percussion note must have an explicit normal notehead');
  }

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const totalDuration = [...body.matchAll(/<duration>(\d+)<\/duration>/g)]
      .reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(totalDuration, 16, `Measure ${number} must fill exactly 4/4 at divisions=4`);
  }
});

test('Phase 2 U3 L2 preserves the approved five-block shape and uses writing as transfer', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación L1 — 3 min',
    '## 2. NÚCLEO — 10–12 min',
    '## 3. Comparación y retirada de ayuda — 5–6 min',
    '## 4. Escritura breve — 3–4 min',
    '## 5. Registro — 2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing approved block: ${heading}`);
  }

  assert.match(markdown, /GUIADO[\s\S]*CON PISTAS[\s\S]*SIN PISTAS/);
  assert.match(markdown, /SIN PISTAS` no significa tocar de memoria/i);
  assert.match(markdown, /Reescribe la misma duración[\s\S]*corchea ligada a semicorchea/i);
  assert.match(markdown, /mismo inicio de ataque[\s\S]*misma duración total de tres posiciones[\s\S]*mismo marco de 4\/4/i);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0, 'L2 transfer is writing/rewrite, not an unnecessary hearing task');
});

test('Phase 2 U3 L2 keeps playback after attempt and reserves structured syncopation for L3', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const overview = await readFile(overviewPath, 'utf8');

  assert.match(markdown, /f2-u3-l1-ataque-duracion-ligaduras\.musicxml/);
  assert.match(markdown, /f2-u3-l2-puntillo-duracion\.musicxml/);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.match(markdown, /data-score-source-label="MusicXML — fuente del ejercicio"/);

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige un BPM concreto/i);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /La siguiente lección introducirá \*\*Síncopa I\*\*/i);

  assert.match(overview, /Puntillo: más duración sin más golpes/);
  assert.match(overview, /Síncopa I: ataque desplazado, marco estable/);
  assert.match(overview, /U4 conserva/);
});

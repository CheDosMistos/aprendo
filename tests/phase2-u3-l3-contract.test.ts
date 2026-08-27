import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u3-l3-sincopa-i.md');
const overviewPath = path.resolve('src/courses/bateria/content/pages/f2-u3-overview.md');
const scorePath = path.resolve('public/bateria/notation/f2/u3/f2-u3-l3-sincopa-i.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U3 L3 introduces elementary syncopation as the single dominant novelty', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u3-l3\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*3\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-3\s*$/m);
  assert.match(data, /^slug:\s*sincopa-i-ataque-desplazado-marco-estable\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*3\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  for (const competency of ['C1', 'C2', 'D2', 'D6', 'F1', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in the U3 L3 contract`);
  }

  assert.match(markdown, /La síncopa modifica la relación entre ataque, duración y posiciones métricas; no mueve el 4\/4/i);
  assert.match(markdown, /posición débil[\s\S]*duración continúa[\s\S]*posición métrica más fuerte/i);
  assert.match(markdown, /no vamos a usar “síncopa” como sinónimo automático de cualquier offbeat/i);
  assert.match(markdown, /posición débil \+ duración que atraviesa una posición métrica fuerte/i);
  assert.match(markdown, /El pulso y la subdivisión siguen ocurriendo por debajo/i);
  assert.doesNotMatch(data, /\bB7\b/);
});

test('Phase 2 U3 L3 MusicXML closes every 4/4 measure and encodes weak-position durations across strong beats', async () => {
  const score = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);

  assert.equal((score.match(/<tie type="start"\/>/g) ?? []).length, 3, 'L3 should contain three explicit tied syncopation examples');
  assert.equal((score.match(/<tie type="stop"\/>/g) ?? []).length, 3);
  assert.equal((score.match(/<tied type="start"\/>/g) ?? []).length, 3);
  assert.equal((score.match(/<tied type="stop"\/>/g) ?? []).length, 3);
  assert.equal((score.match(/<duration>6<\/duration><type>quarter<\/type><dot\/><notehead>normal<\/notehead>/g) ?? []).length, 1, 'L3 reuses one dotted-quarter duration from L2 without making dots the new focus');
  assert.doesNotMatch(score, /<time-modification>|<tuplet\b/);
  assert.doesNotMatch(score, /<accent\b|<strong-accent\b|<dynamics\b/);

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

test('Phase 2 U3 L3 preserves the approved five-block shape and transforms one attack without adding U4 complexity', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación L1–L2 — 3 min',
    '## 2. NÚCLEO — 10–12 min',
    '## 3. Continuidad — 5–6 min',
    '## 4. Transformación — 3–4 min',
    '## 5. Registro — 2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing approved block: ${heading}`);
  }

  assert.match(markdown, /GUIADO[\s\S]*CON PISTAS[\s\S]*SIN PISTAS/);
  assert.match(markdown, /SIN PISTAS` no significa tocar de memoria/i);
  assert.match(markdown, /Cambia \*\*una sola variable\*\*: la posición de un ataque/i);
  assert.match(markdown, /Conserva la duración total de los dos pulsos/i);
  assert.match(markdown, /No añadas ahora acentos, paradiddles, doubles ni una segunda transformación/i);
  assert.match(markdown, /eso pertenece a U4/i);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0, 'L3 keeps hearing/writing transfer for L4 instead of adding a dictation task here');
});

test('Phase 2 U3 L3 keeps playback after attempt, uses original source links and preserves the L4/U4 boundaries', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const overview = await readFile(overviewPath, 'utf8');

  assert.match(markdown, /f2-u3-l2-puntillo-duracion\.musicxml/);
  assert.match(markdown, /f2-u3-l3-sincopa-i\.musicxml/);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 2);

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige cero errores, un BPM concreto/i);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /La siguiente lección cambiará de representación: \*\*oír, escribir y transformar duración\*\*/i);

  assert.match(overview, /Síncopa I: ataque desplazado, marco estable/);
  assert.match(overview, /Oír, escribir y transformar duración/);
  assert.match(overview, /U4 conserva/);
});

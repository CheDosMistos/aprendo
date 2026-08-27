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

test('Phase 2 U3 L3 introduces elementary syncopation while the 4/4 frame stays stable', async () => {
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

  assert.match(markdown, /La síncopa puede cambiar dónde sentimos tensión sin cambiar el pulso ni el compás/i);
  assert.match(markdown, /ataque en la segunda mitad del pulso \(`&`\)[\s\S]*continúa a través de la negra siguiente/i);
  assert.match(markdown, /No definimos “síncopa” como cualquier ataque débil aislado/i);
  assert.match(markdown, /U4 ampliará la variedad/i);
  assert.doesNotMatch(data, /\bB7\b/);
});

test('Phase 2 U3 L3 MusicXML encodes four transparent offbeat-to-strong-beat ties and exact 4/4', async () => {
  const score = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(score, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);

  assert.equal((score.match(/<tie type="start"\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<tie type="stop"\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<tied type="start"\/>/g) ?? []).length, 4);
  assert.equal((score.match(/<tied type="stop"\/>/g) ?? []).length, 4);
  assert.match(score, /<duration>2<\/duration><type>eighth<\/type><tie type="start"\/>/,
    'The syncopated event must begin as an offbeat eighth segment');
  assert.match(score, /<duration>4<\/duration><type>quarter<\/type><tie type="stop"\/>/,
    'The same event must continue across the following beat without reattack');
  assert.doesNotMatch(score, /<dot\/>|<time-modification>|<tuplet\b/,
    'L3 does not need a new dotted value or any tuplet vocabulary');

  const notes = [...score.matchAll(/<note>([\s\S]*?)<\/note>/g)].filter(([, body]) => !body.includes('<rest/>'));
  for (const [, body] of notes) {
    assert.match(body, /<notehead>normal<\/notehead>/);
  }

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const totalDuration = [...body.matchAll(/<duration>(\d+)<\/duration>/g)]
      .reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(totalDuration, 16, `Measure ${number} must fill exactly 4/4 at divisions=4`);
  }
});

test('Phase 2 U3 L3 preserves the approved lesson shape and separates continuity from accuracy', async () => {
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
  assert.match(markdown, /\*\*PRECISIÓN:\*\*[\s\S]*\*\*CONTINUIDAD:\*\*[\s\S]*\*\*RECUPERACIÓN:\*\*[\s\S]*\*\*COMPRENSIÓN:\*\*/);
  assert.match(markdown, /Un fallo de continuidad no es idéntico a un fallo conceptual/i);
});

test('Phase 2 U3 L3 transforms one attack without importing U4 complexity', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const overview = await readFile(overviewPath, 'utf8');

  assert.match(markdown, /Célula base — 1 pulso/i);
  assert.match(markdown, /silencio de corchea[\s\S]*corchea.*`&`/i);
  assert.match(markdown, /ligadura que continúe la duración a través de la negra siguiente/i);
  assert.match(markdown, /Cambia sólo la posición del ataque; no añadas acentos, dinámica, rudimentos ni otro compás/i);
  assert.match(markdown, /U4.*acentos.*dinámica.*aplicación/is);

  assert.match(markdown, /f2-u3-l2-puntillo-duracion\.musicxml/);
  assert.match(markdown, /f2-u3-l3-sincopa-i\.musicxml/);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0);

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige cero errores, un BPM fijo\/alto ni dominar una variedad amplia de síncopas/i);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /La siguiente lección cambiará de representación/i);
  assert.match(markdown, /OÍR → IDENTIFICAR → ESCRIBIR → TOCAR → TRANSFORMAR/);

  assert.match(overview, /Síncopa I: ataque desplazado, marco estable/);
  assert.match(overview, /Oír, escribir y transformar duración/);
  assert.match(overview, /U4 conserva/);
});

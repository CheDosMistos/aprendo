import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const checkpointPath = path.resolve('src/courses/bateria/content/pages/f2-u1-checkpoint-puerta-fluidez-binaria.md');
const scorePath = path.resolve('public/bateria/notation/f2/u1/f2-u1-checkpoint-a.musicxml');
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
    count += content.split(fragment).length - 1;
  }
  return count;
}

test('Phase 2 U1 checkpoint has the approved progression-only contract', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u1-check\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*1\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-1\s*$/m);
  assert.match(data, /^slug:\s*puerta-de-fluidez-binaria\s*$/m);
  assert.match(data, /^kind:\s*checkpoint\s*$/m);
  assert.match(data, /^order:\s*5\s*$/m);
  assert.match(data, /^duration:\s*8–12 min\s*$/m);
  assert.match(data, /^competencies:\s*\[C1, C2, D1, F1\]\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);
  assert.match(markdown, /no sirve para “aprobar U1”/i);
  assert.match(markdown, /C1\/C2\/D1\/F1 están suficientemente disponibles para aumentar densidad y variedad en U2/i);
  assert.match(markdown, /sin depender de memorizar patrones/i);
});

test('Phase 2 U1 checkpoint contains new reading, separated recovery, conceptual explanation and health/load', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  for (const heading of [
    '## 1. Muestra A — lectura nueva — 4–5 min',
    '## 2. Muestra B — recuperación — 2–3 min',
    '## 3. Pregunta conceptual — 1 min',
    '## 4. Salud, carga y decisión — 1–2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing checkpoint block: ${heading}`);
  }

  assert.match(markdown, /¿Dónde estás subdividiendo aunque haya silencio\?/);
  assert.match(markdown, /pulso y la subdivisión interna continúan/i);
  for (const signal of ['dolor', 'hormigueo', 'entumecimiento', 'pérdida de fuerza', 'deterioro técnico fuerte por fatiga', 'tensión persistente']) {
    assert.match(markdown, new RegExp(signal, 'i'), `Missing health/load signal: ${signal}`);
  }
});

test('Phase 2 U1 checkpoint first-sight asset is exclusive and playback-protected', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 1);
  assert.match(markdown, /f2-u1-checkpoint-a\.musicxml/);
  assert.equal(await countPageReferences('f2-u1-checkpoint-a.musicxml'), 2, 'Checkpoint asset must only appear as src + source URL in this checkpoint');
  assert.match(markdown, /exclusiva de este checkpoint/i);
  assert.match(markdown, /no la has practicado ni escuchado antes/i);
  assert.match(markdown, /Finalizar intento.*antes de usar playback/is);
  assert.match(markdown, /ya no es primera vista/i);
});

test('Phase 2 U1 checkpoint score is original, 4/4, metric-valid and inside U1 vocabulary', async () => {
  const score = await readFile(scorePath, 'utf8');

  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /No reproduce PAS ni material de métodos comerciales/);
  assert.match(score, /<sign>percussion<\/sign>/);
  assert.match(score, /<staff-lines>5<\/staff-lines>/);
  assert.match(score, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.equal((score.match(/<measure number=/g) ?? []).length, 4);
  assert.doesNotMatch(score, /<rest\s*\/>\s*<duration>1<\/duration>/, 'Checkpoint must not introduce sixteenth-note rests before U2');

  const measures = [...score.matchAll(/<measure number="\d+">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [index, measure] of measures.entries()) {
    const durations = [...measure[1].matchAll(/<duration>(\d+)<\/duration>/g)].map((match) => Number(match[1]));
    assert.equal(durations.reduce((sum, value) => sum + value, 0), 16, `Measure ${index + 1} must close at 16 divisions`);
  }
});

test('Phase 2 U1 checkpoint records precision, continuity, counting need and limiting variable separately', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.match(markdown, /\*\*PRECISIÓN:\*\*/);
  assert.match(markdown, /\*\*CONTINUIDAD \/ RECUPERACIÓN:\*\*/);
  assert.match(markdown, /\*\*NECESIDAD DE CONTEO:\*\*/);
  assert.match(markdown, /\*\*VARIABLE LIMITANTE:\*\*/);
  assert.match(markdown, /necesitarlo no es un fallo por sí mismo/i);
});

test('Phase 2 U1 checkpoint recovery is separated and does not masquerade as first sight', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 2);
  assert.match(markdown, /compases 5–6/i);
  assert.match(markdown, /f2-u1-rejilla-binaria-silencios\.musicxml/);
  assert.match(markdown, /data-score-feedback="after-attempt"/);
  assert.match(markdown, /sin practicarla inmediatamente antes/i);
  assert.match(markdown, /La recuperación informa sobre disponibilidad tras separación/i);
  assert.match(markdown, /no convierte todo el material anterior en “dominado”/i);
});

test('Phase 2 U1 checkpoint uses the approved evidence chain and four decisions without a BPM gate', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.match(markdown, /\*\*INFERENCIA:\*\*[\s\S]*\*\*EVIDENCIA:\*\*[\s\S]*\*\*TAREA:\*\*[\s\S]*\*\*CONDICIONES:\*\*[\s\S]*\*\*DECISIÓN:\*\*/);
  for (const decision of ['### CONTINUAR', '### CONTINUAR + CORRECTIVO', '### REDUCIR NOVEDAD', '### DETENER CARGA']) {
    assert.ok(markdown.includes(decision), `Missing decision: ${decision}`);
  }
  assert.match(markdown, /BPM describe la condición, no el nivel/i);
  assert.match(markdown, /No se exige:[\s\S]*tempo fijo o alto/i);
  assert.match(markdown, /No vuelvas automáticamente a toda Fase 1/i);
});

test('Phase 2 U1 checkpoint defines sufficient availability without perfection or automatic competency updates', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.match(markdown, /## Qué significa “suficientemente disponible”/);
  assert.match(markdown, /localizar pulso y subdivisión/i);
  assert.match(markdown, /tocar sin memorizar previamente toda la secuencia/i);
  assert.match(markdown, /mantener una continuidad razonable/i);
  assert.match(markdown, /recuperar después de un error pequeño/i);
  assert.match(markdown, /explicar ataques, silencios y subdivisión/i);
  assert.match(markdown, /Completar el checkpoint:.*no actualiza automáticamente C1\/C2\/D1\/F1/is);
  assert.match(markdown, /no.*superar ya el Hito 2 global de Fase 2/is);
});

test('Phase 2 U1 checkpoint bridges to U2 by controlling novelty rather than pass/fail identity', async () => {
  const markdown = await readFile(checkpointPath, 'utf8');

  assert.match(markdown, /## Puente a 20\.U2/);
  assert.match(markdown, /semicorcheas y silencios como lenguaje/i);
  assert.match(markdown, /abre U2 manteniendo visible la fragilidad localizada/i);
  assert.match(markdown, /no reinicies U1 completa/i);
  assert.match(markdown, /cuánta novedad tiene sentido introducir/i);
  assert.match(markdown, /no si eres o no “buen baterista”/i);
});

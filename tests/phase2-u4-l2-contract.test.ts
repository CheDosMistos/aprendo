import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u4-l2-misma-linea-otro-acento.md');
const baseScorePath = path.resolve('public/bateria/notation/f2/u4/f2-u4-l1-sincopa-ii.musicxml');
const accentScorePath = path.resolve('public/bateria/notation/f2/u4/f2-u4-l2-acentos.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function rhythmicSignature(xml: string): string[] {
  return [...xml.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)].map(([, number, measure]) => {
    const notes = [...measure.matchAll(/<note>([\s\S]*?)<\/note>/g)].map(([, body]) => {
      const rest = body.includes('<rest/>') ? 'R' : 'N';
      const duration = body.match(/<duration>(\d+)<\/duration>/)?.[1] ?? '?';
      const type = body.match(/<type>([^<]+)<\/type>/)?.[1] ?? '?';
      const ties = [...body.matchAll(/<tie type="(start|stop)"\/>/g)].map((match) => match[1]).join(',');
      return `${rest}:${duration}:${type}:${ties}`;
    });
    return `${number}|${notes.join('|')}`;
  });
}

test('Phase 2 U4 L2 adds accent as the dominant layer without assigning B7', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u4-l2\s*$/m);
  assert.match(data, /^unit:\s*4\s*$/m);
  assert.match(data, /^slug:\s*la-misma-linea-otro-acento\s*$/m);
  assert.match(data, /^order:\s*2\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);
  assert.match(data, /\bA5\b/);
  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  assert.doesNotMatch(competencies, /\bB7\b/);

  assert.match(markdown, /CAMBIAR EL ACENTO NO CAMBIA EL RITMO/);
  assert.match(markdown, /Un acento es énfasis relativo sobre un ataque que ya existe/i);
  assert.match(markdown, /acento no significa golpear al máximo/i);
  assert.match(markdown, /mapa temporal[\s\S]*mapa dinámico/i);
  assert.match(markdown, /error temporal[\s\S]*error dinámico/i);
  assert.match(markdown, /No añadas paradiddle, doubles ni otra textura de manos/i);
});

test('Phase 2 U4 L2 accent score is rhythmically identical to L1 and adds only controlled accent notation', async () => {
  const base = await readFile(baseScorePath, 'utf8');
  const accented = await readFile(accentScorePath, 'utf8');

  assert.deepEqual(rhythmicSignature(accented), rhythmicSignature(base), 'L2 must preserve the exact L1 attack/rest/duration/tie sequence');
  assert.equal((accented.match(/<accent\/>/g) ?? []).length, 8);
  assert.equal((accented.match(/<tie type="start"\/>/g) ?? []).length, 4);
  assert.equal((accented.match(/<tie type="stop"\/>/g) ?? []).length, 4);
  assert.doesNotMatch(accented, /<strong-accent\b|<dynamics\b|<time-modification>|<tuplet\b/);
  assert.match(accented, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);

  const measures = [...accented.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const total = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(total, 16, `Measure ${number} must remain complete 4/4`);
  }
});

test('Phase 2 U4 L2 keeps playback gated and uses a one-variable accent transformation', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación de la línea base — 3 min',
    '## 2. NÚCLEO — 10–12 min',
    '## 3. Control de sonido y ambas manos — 5–6 min',
    '## 4. Transformación — 3–4 min',
    '## 5. Registro — 2 min',
  ]) assert.ok(markdown.includes(heading), `Missing block: ${heading}`);

  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.match(markdown, /ataques, silencios, duraciones, pulso, subdivisión y 4\/4/);
  assert.match(markdown, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /No se exige cero errores, gran volumen, un BPM concreto/i);
  assert.match(markdown, /no actualiza automáticamente/i);
  assert.match(markdown, /la línea manda: aplicación B7 sobre lectura conocida/i);
});

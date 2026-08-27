import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagePath = path.resolve('src/courses/bateria/content/pages/f2-u4-checkpoint-puerta-sincopa-aplicada.md');
const scorePath = path.resolve('public/bateria/notation/f2/u4/f2-u4-checkpoint-a.musicxml');
const l4ScorePath = '/bateria/notation/f2/u4/f2-u4-l4-lectura-nueva.musicxml';

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function notes(xml: string): string[] {
  return [...xml.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((match) => match[1]);
}

test('Phase 2 U4 checkpoint targets D2 and C1-C3 without making B7 or D5 a hard gate', async () => {
  const markdown = await readFile(pagePath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u4-check\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*4\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-4\s*$/m);
  assert.match(data, /^slug:\s*puerta-de-sincopa-aplicada-y-continuidad\s*$/m);
  assert.match(data, /^kind:\s*checkpoint\s*$/m);
  assert.match(data, /^order:\s*5\s*$/m);
  assert.doesNotMatch(data, /\bB7\b/);
  assert.doesNotMatch(data, /\bD5\b/);

  for (const competency of ['C1', 'C2', 'C3', 'D2', 'D6', 'F1', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U4 checkpoint`);
  }

  assert.match(markdown, /¿D2 y C1–C3 están suficientemente disponibles para abrir U5/);
  assert.match(markdown, /B7 \*\*no es la inferencia principal de este checkpoint\*\*/);
  assert.match(markdown, /No se exige B7 funcional global para abrir U5/);
  assert.match(markdown, /primera vista sistemática seguirá siendo objetivo central de U9/i);
});

test('Phase 2 U4 checkpoint owns one exclusive first-sight asset distinct from L4', async () => {
  const markdown = await readFile(pagePath, 'utf8');
  await access(scorePath);

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 1);
  assert.match(markdown, /f2-u4-checkpoint-a\.musicxml/);
  assert.ok(!markdown.includes(l4ScorePath), 'Checkpoint must not reuse the U4 L4 first-sight asset');
  assert.match(markdown, /lectura breve \*\*nueva y exclusiva\*\*/);
  assert.match(markdown, /Una repetición posterior es práctica\/relectura, no una segunda muestra independiente de primera vista/);
});

test('Phase 2 U4 checkpoint MusicXML is exact 4/4 with controlled accents and no ternary or B7 notation', async () => {
  const xml = await readFile(scorePath, 'utf8');

  assert.match(xml, /<score-partwise version="4\.0">/);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(xml, /Asset exclusivo del checkpoint 20\.U4/);
  assert.match(xml, /<divisions>4<\/divisions>/);
  assert.match(xml, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(xml, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(xml, /<sound tempo="120"\/>/);

  const measures = [...xml.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const total = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(total, 16, `Measure ${number} must close exactly at 4/4 with divisions=4`);
  }

  assert.equal((xml.match(/<tie type="start"\/>/g) ?? []).length, 4);
  assert.equal((xml.match(/<tie type="stop"\/>/g) ?? []).length, 4);
  assert.equal((xml.match(/<tied type="start"\/>/g) ?? []).length, 4);
  assert.equal((xml.match(/<tied type="stop"\/>/g) ?? []).length, 4);
  assert.equal((xml.match(/<accent\/>/g) ?? []).length, 4);

  assert.doesNotMatch(xml, /<strong-accent\b|<dynamics\b|<lyric>|<time-modification>|<tuplet\b|<dot\/>/);
  const sounded = notes(xml).filter((body) => !body.includes('<rest/>'));
  assert.ok(sounded.length > 0);
  for (const body of sounded) assert.match(body, /<notehead>normal<\/notehead>/);
});

test('Phase 2 U4 checkpoint separates evidence and keeps U5 content outside the task', async () => {
  const markdown = await readFile(pagePath, 'utf8');

  assert.match(markdown, /ACENTO ≠ RITMO/);
  assert.match(markdown, /mapa temporal/);
  assert.match(markdown, /mapa dinámico/);
  assert.match(markdown, /precisión de lectura/);
  assert.match(markdown, /continuidad/);
  assert.match(markdown, /recuperación/);
  assert.match(markdown, /variable limitante/);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);

  for (const decision of ['CONTINUAR', 'CONTINUAR + CORRECTIVO', 'REDUCIR NOVEDAD', 'DETENER CARGA']) {
    assert.match(markdown, new RegExp(`### ${decision.replace('+', '\\+')}`));
  }

  assert.match(markdown, /## MÍNIMO PARA ABRIR U5/);
  assert.match(markdown, /No se exige:[\s\S]*cero errores;[\s\S]*un BPM fijo o alto;[\s\S]*B7 funcional global;[\s\S]*D5 funcional o primera vista avanzada;[\s\S]*tresillos ni cambios 2↔3↔4;[\s\S]*6\/8;/);
  assert.match(markdown, /Este checkpoint no introduce ni evalúa todavía ese contenido/);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0);
  assert.match(markdown, /no actualiza automáticamente/i);
});

import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u4-l3-aplicacion-b7.md');
const baseScorePath = path.resolve('public/bateria/notation/f2/u4/f2-u4-l1-sincopa-ii.musicxml');
const textureScorePath = path.resolve('public/bateria/notation/f2/u4/f2-u4-l3-textura-manos.musicxml');
const pasUrl = 'https://pas.org/wp-content/uploads/2024/04/pas-rudiments.pdf';

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function noteBodies(xml: string): string[] {
  return [...xml.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((match) => match[1]);
}

function rhythmicSignature(xml: string): string[] {
  return noteBodies(xml).map((body) => {
    const kind = body.includes('<rest/>') ? 'rest' : 'note';
    const duration = body.match(/<duration>(\d+)<\/duration>/)?.[1] ?? '';
    const type = body.match(/<type>([^<]+)<\/type>/)?.[1] ?? '';
    const tieStart = body.includes('<tie type="start"/>') ? 'start' : '';
    const tieStop = body.includes('<tie type="stop"/>') ? 'stop' : '';
    const dots = (body.match(/<dot\/>/g) ?? []).length;
    return [kind, duration, type, tieStart, tieStop, dots].join('|');
  });
}

test('Phase 2 U4 L3 opens B7 only after the rhythmic line is decoded and keeps PAS normative', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u4-l3\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*4\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-4\s*$/m);
  assert.match(data, /^slug:\s*la-linea-manda-aplicacion-b7\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*3\s*$/m);
  assert.match(data, /rudiments:\s*\n\s*- Single Paradiddle/m);
  assert.match(data, /\bB7\b/);

  for (const competency of ['A1', 'A2', 'B7', 'C1', 'C2', 'C3', 'D2', 'D6', 'F1', 'F2', 'K2', 'K4', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U4 L3`);
  }

  assert.ok(markdown.includes(pasUrl), 'U4 L3 must link the official PAS normative PDF');
  assert.match(markdown, /Single Paradiddle.*ya fue introducido en Fase 1/is);
  assert.match(markdown, /no se vuelve a enseñar/i);
  assert.match(markdown, /PAS sigue siendo la autoridad para la forma normativa exacta/i);
  assert.match(markdown, /LA LÍNEA RÍTMICA MANDA; EL RUDIMENTO SIRVE A LA LECTURA, NO AL REVÉS/);
  assert.match(markdown, /DECODIFICAR LÍNEA → TOCAR LÍNEA BASE → ELEGIR TEXTURA → APLICAR → COMPARAR/);
});

test('Phase 2 U4 L3 application score preserves the complete L1 rhythmic signature and adds only hand labels', async () => {
  const [baseScore, textureScore] = await Promise.all([
    readFile(baseScorePath, 'utf8'),
    readFile(textureScorePath, 'utf8'),
  ]);
  await access(textureScorePath);

  assert.deepEqual(rhythmicSignature(textureScore), rhythmicSignature(baseScore), 'L3 texture must not change any L1 note/rest duration or tie');
  assert.match(textureScore, /<score-partwise version="4\.0">/);
  assert.match(textureScore, /<time><beats>4<\/beats><beat-type>4<\/beat-type><\/time>/);
  assert.match(textureScore, /<staff-details><staff-lines>5<\/staff-lines><\/staff-details>/);
  assert.match(textureScore, /<sound tempo="120"\/>/);
  assert.match(textureScore, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(textureScore, /No reproduce la partitura PAS/);

  const lyrics = [...textureScore.matchAll(/<lyric><text>([RL])<\/text><\/lyric>/g)].map((match) => match[1]);
  assert.equal(lyrics.length, 15, 'Every new attack, and only new attacks, should receive one hand label');
  assert.ok(lyrics.every((label) => label === 'R' || label === 'L'));

  const tiedStops = noteBodies(textureScore).filter((body) => body.includes('<tie type="stop"/>'));
  assert.equal(tiedStops.length, 4);
  for (const body of tiedStops) {
    assert.doesNotMatch(body, /<lyric>/, 'A tied continuation is not a new attack and must not receive a hand label');
  }

  assert.doesNotMatch(textureScore, /<accent\b|<strong-accent\b|<dynamics\b/);
  assert.doesNotMatch(textureScore, /<time-modification>|<tuplet\b/);

  const sounded = noteBodies(textureScore).filter((body) => !body.includes('<rest/>'));
  for (const body of sounded) assert.match(body, /<notehead>normal<\/notehead>/);

  const measures = [...textureScore.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const total = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    assert.equal(total, 16, `Measure ${number} must fill exactly 4/4 at divisions=4`);
  }
});

test('Phase 2 U4 L3 keeps static course scores gated and distinguishes the original application from PAS engraving', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /f2-u4-l1-sincopa-ii\.musicxml/);
  assert.match(markdown, /f2-u4-l3-textura-manos\.musicxml/);
  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 2);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.equal((markdown.match(/data-score-source-label="MusicXML — fuente del ejercicio"/g) ?? []).length, 2);
  assert.match(markdown, /no.*presentamos esta línea como la partitura PAS #16/is);
  assert.match(markdown, /no.*equivalga a ejecutar el Single Paradiddle normativo/is);
  assert.match(markdown, /PAS continúa siendo la fuente normativa del rudimento/is);
});

test('Phase 2 U4 L3 preserves the approved practice shape, evaluation semantics and L4/U9 boundaries', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. PAS #16 — Single Paradiddle: recuperar la referencia — 3 min',
    '## 2. Decodificar y tocar la línea base — 5–6 min',
    '## 3. Elegir textura y aplicar — 8–10 min',
    '## 4. Comparar y transferir — 4–5 min',
    '## 5. Registro — 2 min',
  ]) assert.ok(markdown.includes(heading), `Missing U4 L3 block: ${heading}`);

  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL EN ESTA TAREA/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige cero errores, un BPM concreto/i);
  assert.match(markdown, /no actualiza automáticamente B7/i);
  assert.match(markdown, /leer, seguir y recuperarse/i);
  assert.match(markdown, /primera vista como competencia central seguirá reservada para U9/i);
  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 0);
});

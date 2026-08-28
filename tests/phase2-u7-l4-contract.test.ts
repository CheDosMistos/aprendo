import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u7-l4-leer-escuchar-clasificar-y-explicar.md');
const scorePath = path.resolve('public/bateria/notation/f2/u7/f2-u7-l4-transfer-6-8-9-8-12-8.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function measureTotals(xml: string): number[] {
  return [...xml.matchAll(/<measure number="\d+">([\s\S]*?)<\/measure>/g)].map(([, body]) =>
    [...body.matchAll(/<duration>(\d+)<\/duration>/g)].reduce((sum, match) => sum + Number(match[1]), 0),
  );
}

test('Phase 2 U7 L4 introduces E5 only as controlled aural metric recognition', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u7-l4\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*7\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-7\s*$/m);
  assert.match(data, /^slug:\s*leer-escuchar-clasificar-y-explicar\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*4\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  const competencies = data.match(/^competencies:.*$/m)?.[0] ?? '';
  for (const competency of ['C1', 'C2', 'D4', 'E1', 'E2', 'E5', 'F2']) {
    assert.match(competencies, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in U7 L4`);
  }
  assert.doesNotMatch(competencies, /\bD5\b/);

  assert.match(markdown, /E5 EMPIEZA AQUÍ COMO RECONOCIMIENTO CONTROLADO/);
  assert.match(markdown, /4 pulsos de entrada/i);
  assert.match(markdown, /primer puente hacia E5/i);
  assert.match(markdown, /no demuestra todavía reconocimiento métrico general en repertorio/i);
  assert.match(markdown, /cantidad de ataques ≠ organización métrica/i);
});

test('Phase 2 U7 L4 compound transfer MusicXML closes 6/8, 9/8 and 12/8 exactly without tuplets', async () => {
  const xml = await readFile(scorePath, 'utf8');
  await access(scorePath);

  assert.match(xml, /<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.match(xml, /<time><beats>9<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.match(xml, /<time><beats>12<\/beats><beat-type>8<\/beat-type><\/time>/);
  assert.deepEqual(measureTotals(xml), [36, 54, 72]);
  assert.equal((xml.match(/<note>/g) ?? []).length, 27);
  assert.equal((xml.match(/<duration>6<\/duration><type>eighth<\/type>/g) ?? []).length, 27);
  assert.equal((xml.match(/<instrument id="P1-I1"\/>/g) ?? []).length, 27);
  assert.equal((xml.match(/<notehead>normal<\/notehead>/g) ?? []).length, 27);
  assert.equal((xml.match(/<beam number="1">begin<\/beam>/g) ?? []).length, 9);
  assert.equal((xml.match(/<beam number="1">continue<\/beam>/g) ?? []).length, 9);
  assert.equal((xml.match(/<beam number="1">end<\/beam>/g) ?? []).length, 9);
  assert.match(xml, /<metronome><beat-unit>quarter<\/beat-unit><beat-unit-dot\/><per-minute>80<\/per-minute><\/metronome>/);
  assert.match(xml, /<sound tempo="120"\/>/);
  assert.match(xml, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.doesNotMatch(xml, /<rest\/>|<time-modification>|<tuplet\b|<actual-notes>|<normal-notes>|<tie\b|<tied\b/);
});

test('Phase 2 U7 L4 configures five hidden-answer aural stimuli with explicit primary-pulse subdivisions', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.equal((markdown.match(/data-rhythm-dictation/g) ?? []).length, 5);
  assert.equal((markdown.match(/data-bpm="72"/g) ?? []).length, 5);
  assert.equal((markdown.match(/data-subdivision="3"/g) ?? []).length, 3);
  assert.equal((markdown.match(/data-subdivision="2"/g) ?? []).length, 2);

  for (const snippet of [
    'data-subdivision="3" data-pattern="111111" data-answer="6/8 prototípico — 2 pulsos principales × 3 subdivisiones: compuesto."',
    'data-subdivision="2" data-pattern="111111" data-answer="3/4 prototípico — 3 pulsos principales × 2 subdivisiones: simple."',
    'data-subdivision="3" data-pattern="111111111" data-answer="9/8 prototípico — 3 pulsos principales × 3 subdivisiones: compuesto."',
    'data-subdivision="2" data-pattern="11111111" data-answer="4/4 prototípico — 4 pulsos principales × 2 subdivisiones: simple."',
    'data-subdivision="3" data-pattern="111111111111" data-answer="12/8 prototípico — 4 pulsos principales × 3 subdivisiones: compuesto."',
  ]) assert.ok(markdown.includes(snippet), `Missing aural stimulus: ${snippet}`);

  assert.match(markdown, /A y B contienen \*\*seis ataques regulares\*\*/);
  assert.match(markdown, /en A, seis posiciones ocupan `2×3`/);
  assert.match(markdown, /en B, seis posiciones ocupan `3×2`/);
  assert.match(markdown, /Mostrar respuesta/);
});

test('Phase 2 U7 L4 preserves written feedback gating, evidence chain, and later-unit boundaries', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-feedback="after-attempt"/g) ?? []).length, 1);
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0);
  assert.match(markdown, /MusicXML — fuente de la transferencia 6\/8–9\/8–12\/8/);
  assert.match(markdown, /INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN/);
  assert.match(markdown, /CONTINUAR[\s\S]*CONTINUAR \+ CORRECTIVO[\s\S]*REDUCIR NOVEDAD[\s\S]*DETENER CARGA/);
  assert.match(markdown, /## MÍNIMO PARA PASAR AL CHECKPOINT DE U7/);
  assert.match(markdown, /reconocimiento métrico general en repertorio ambiguo/);
  assert.match(markdown, /primera vista formal D5 — U9/);
  assert.match(markdown, /sextillos — U8/);
  assert.match(markdown, /click reducido, half-time o gaps — U10/);
  assert.match(markdown, /actualizar automáticamente E5, D4 o F2 a `FUNCIONAL`/);
});

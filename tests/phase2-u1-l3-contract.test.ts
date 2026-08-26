import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const lessonPath = path.resolve('src/courses/bateria/content/pages/f2-u1-l3-aplicacion-rudimental.md');
const reusedScorePath = path.resolve('public/bateria/notation/f2/u1/f2-u1-rejilla-binaria-silencios.musicxml');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

test('Phase 2 U1 L3 opens B7 prudently without assigning a new PAS', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const data = frontmatter(markdown);

  assert.match(data, /^contentId:\s*bat-f2-u1-l3\s*$/m);
  assert.match(data, /^phase:\s*2\s*$/m);
  assert.match(data, /^unit:\s*1\s*$/m);
  assert.match(data, /^unitSlug:\s*fase-2-unidad-1\s*$/m);
  assert.match(data, /^slug:\s*aplicacion-rudimental-sin-perder-la-linea\s*$/m);
  assert.match(data, /^kind:\s*lesson\s*$/m);
  assert.match(data, /^order:\s*3\s*$/m);
  assert.match(data, /^rudiments:\s*\[\]\s*$/m);

  for (const competency of ['B7', 'C1', 'C2', 'D1', 'F1', 'K2', 'K5', 'K6']) {
    assert.match(data, new RegExp(`\\b${competency}\\b`), `Expected ${competency} in the L3 contract`);
  }

  assert.match(markdown, /la lectura manda; el rudimento es una textura posible/i);
  assert.match(markdown, /no intenta enseñar un rudimento nuevo/i);
  assert.match(markdown, /evidencia reciente/i);
  assert.match(markdown, /no para volver a enseñar PAS/i);
  assert.match(markdown, /PAS — International Drum Rudiments \(PDF oficial\)/);
  assert.match(markdown, /https:\/\/pas\.org\/wp-content\/uploads\/2024\/04\/pas-rudiments\.pdf/);
});

test('Phase 2 U1 L3 deliberately reuses the understood L2 score and keeps notation visible', async () => {
  const markdown = await readFile(lessonPath, 'utf8');
  const score = await readFile(reusedScorePath, 'utf8');

  await access(reusedScorePath);
  assert.match(markdown, /f2-u1-rejilla-binaria-silencios\.musicxml/);
  assert.equal((markdown.match(/data-notation-score/g) ?? []).length, 1, 'L3 should reuse one understood notation source');
  assert.equal((markdown.match(/data-score-first-sight="true"/g) ?? []).length, 0, 'L3 is practice on understood material, not formal first sight');
  assert.match(markdown, /No es material de primera vista/i);
  assert.match(markdown, /partitura permanece visible/i);
  assert.match(markdown, /MusicXML — fuente del ejercicio/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /No reproduce PAS ni material de métodos comerciales/);
});

test('Phase 2 U1 L3 preserves the approved five-block timing and one-variable transformation', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  for (const heading of [
    '## 1. Recuperación PAS — 4–5 min',
    '## 2. Línea base — 5–6 min',
    '## 3. Aplicación — 8–10 min',
    '## 4. Transferencia — 4–5 min',
    '## 5. Registro — 2 min',
  ]) {
    assert.ok(markdown.includes(heading), `Missing approved block: ${heading}`);
  }

  assert.match(markdown, /Modifica \*\*solo una cosa por vez\*\*/i);
  assert.match(markdown, /Opción A — doubles como sticking/i);
  assert.match(markdown, /No añadas golpes entre notas/i);
  assert.match(markdown, /Opción B — célula de paradiddle cuando encaje/i);
  assert.match(markdown, /La línea no se deforma/i);
  assert.match(markdown, /Opción C — acento o dinámica/i);
  assert.match(markdown, /Opción D — liderazgo izquierdo/i);
  assert.match(markdown, /\*\*Permanece:\*\*[\s\S]*ritmo escrito[\s\S]*duración[\s\S]*pulso y subdivisión/i);
  assert.match(markdown, /\*\*Puede cambiar:\*\*[\s\S]*sticking[\s\S]*textura de manos[\s\S]*mano líder[\s\S]*dinámica\/acento/i);
});

test('Phase 2 U1 L3 transfer is original and does not invent a PAS score', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.ok((markdown.match(/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/g) ?? []).length >= 2);
  assert.match(markdown, /segunda versión muy breve/i);
  assert.match(markdown, /uno o dos compases/i);
  assert.match(markdown, /No necesitas escribir una nueva partitura si el ritmo no cambia/i);
  assert.doesNotMatch(markdown, /data-score-title=".*PAS/i);
  assert.doesNotMatch(markdown, /data-score-src=".*pas-rudiments/i);
});

test('Phase 2 U1 L3 advancement separates reading from technical application and has no BPM gate', async () => {
  const markdown = await readFile(lessonPath, 'utf8');

  assert.match(markdown, /INFERENCIA:[\s\S]*EVIDENCIA:[\s\S]*TAREA:[\s\S]*CONDICIONES:[\s\S]*DECISIÓN:/);
  assert.match(markdown, /CONTINUAR.*CONTINUAR \+ CORRECTIVO.*REDUCIR NOVEDAD.*DETENER CARGA/s);
  assert.match(markdown, /Completar la sesión \*\*no actualiza automáticamente\*\* B7, C1, C2, D1 ni el estado del PAS elegido/i);
  assert.match(markdown, /## MÍNIMO PARA AVANZAR/);
  assert.match(markdown, /## COMPETENTE \/ FUNCIONAL/);
  assert.match(markdown, /## AVANZADO EN ESTA TAREA/);
  assert.match(markdown, /No se exige un BPM concreto/i);
  assert.match(markdown, /SÍNTOMA → HIPÓTESIS → PRUEBA → CORRECCIÓN → EJERCICIO CORRECTIVO/);
  assert.match(markdown, /volver a sticking simple no es fracaso de D1/i);
});

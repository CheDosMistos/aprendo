import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const lessonPath = path.join(root, 'src/courses/bateria/content/pages/f2-u2-checkpoint-puerta-semicorcheas-silencios.md');
const scorePath = path.join(root, 'public/bateria/notation/f2/u2/f2-u2-checkpoint-a.musicxml');
const pagesDir = path.join(root, 'src/courses/bateria/content/pages');
const lesson = fs.readFileSync(lessonPath, 'utf8');
const score = fs.readFileSync(scorePath, 'utf8');

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

test('Phase 2 U2 checkpoint uses the checkpoint schema and approved inference', () => {
  assert.match(lesson, /contentId: bat-f2-u2-check/);
  assert.match(lesson, /kind: checkpoint/);
  assert.match(lesson, /order: 5/);
  assert.match(lesson, /title: Puerta de semicorcheas y silencios/);
  assert.match(lesson, /rudiments: \[\]/);
  assert.match(lesson, /¿D1\/C2 y el inicio de C3 permiten avanzar hacia U3 sin depender de dibujos memorizados\?/);
  assert.match(lesson, /no sirve para “aprobar U2”/);
});

test('Phase 2 U2 checkpoint keeps Sample A exclusive and protected before first sight', () => {
  const asset = '/bateria/notation/f2/u2/f2-u2-checkpoint-a.musicxml';
  assert.match(lesson, new RegExp(`data-score-src="${asset.replaceAll('/', '\\/').replace('.', '\\.')}"[^>]*data-score-first-sight="true"`));
  assert.match(lesson, new RegExp(`data-score-source-url="${asset.replaceAll('/', '\\/').replace('.', '\\.')}"`));
  assert.match(lesson, /exclusiva de este checkpoint/);

  const pageFiles = fs.readdirSync(pagesDir).filter((name) => name.endsWith('.md'));
  const references = pageFiles.reduce((count, name) => {
    const text = fs.readFileSync(path.join(pagesDir, name), 'utf8');
    return count + occurrences(text, asset);
  }, 0);
  assert.equal(references, 2, 'exclusive asset should appear only as src + source URL inside the checkpoint page');
});

test('Phase 2 U2 checkpoint includes hearing-to-writing and optional recent 2↔4 evidence', () => {
  assert.equal(occurrences(lesson, 'data-rhythm-dictation'), 1);
  assert.match(lesson, /data-subdivision="4"/);
  assert.match(lesson, /data-pattern="10100110"/);
  assert.match(lesson, /Muestra B — OÍR → ESCRIBIR/);
  assert.match(lesson, /dos pulsos/);

  assert.match(
    lesson,
    /data-score-src="\/bateria\/notation\/f2\/u2\/f2-u2-cambio-2-a-4-silencios\.musicxml"[^>]*data-score-feedback="after-attempt"/,
  );
  assert.match(lesson, /Si tienes una muestra reciente y representativa de L2 donde alternaste densidades `2 ↔ 4`, \*\*reutilízala\*\*/);
  assert.match(lesson, /C3 no necesita ser FUNCIONAL para avanzar a U3/);
});

test('Phase 2 U2 checkpoint preserves multidimensional conditions, health and decisions', () => {
  for (const label of ['**INFERENCIA:**', '**EVIDENCIA:**', '**TAREA:**', '**CONDICIONES:**', '**DECISIÓN:**']) {
    assert.ok(lesson.includes(label), `missing evaluation label ${label}`);
  }
  for (const decision of ['### CONTINUAR', '### CONTINUAR + CORRECTIVO', '### REDUCIR NOVEDAD', '### DETENER CARGA']) {
    assert.ok(lesson.includes(decision), `missing decision ${decision}`);
  }
  for (const signal of ['dolor;', 'hormigueo;', 'entumecimiento;', 'pérdida de fuerza;', 'deterioro técnico fuerte por fatiga;', 'tensión persistente.']) {
    assert.ok(lesson.includes(signal), `missing health/load signal ${signal}`);
  }
  assert.match(lesson, /El BPM describe la condición de la muestra; \*\*no define el nivel\*\*/);
  assert.match(lesson, /Completar este checkpoint \*\*no actualiza automáticamente D1, C2, C3, E4 ni ninguna otra competencia\*\*/);
});

test('Phase 2 U2 checkpoint keeps the minimum for U3 below mastery and protects U3 novelty', () => {
  assert.match(lesson, /## MÍNIMO PARA AVANZAR A U3/);
  assert.match(lesson, /\*\*C3 funcional\*\*/);
  assert.match(lesson, /PAS adicionales/);
  assert.match(lesson, /síncopa formalmente dominada/);
  assert.match(lesson, /primera vista avanzada/);
  assert.match(lesson, /\*\*ataque ≠ duración\*\*, ligaduras, puntillos y síncopa I/);
  assert.doesNotMatch(lesson, /BPM mínimo|BPM objetivo|aprobar.*BPM/i);
});

test('Phase 2 U2 checkpoint MusicXML is exclusive original 4/4 sixteenth-grid material', () => {
  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /Asset exclusivo del checkpoint 20\.U2/);
  assert.match(score, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(score, /<staff-lines>5<\/staff-lines>/);
  assert.match(score, /<sign>percussion<\/sign>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /<rest\/>/);
  assert.doesNotMatch(score, /<tie\b|<tied\b|<dot\s*\/>|<time-modification>|<tuplet\b/);

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const durations = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].map((match) => Number(match[1]));
    assert.equal(durations.reduce((sum, value) => sum + value, 0), 16, `measure ${number} must fill exactly 4/4`);
    assert.ok(body.includes('<rest/>'), `measure ${number} must contain sixteenth rests`);
    for (const noteBody of [...body.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((match) => match[1]).filter((text) => text.includes('<unpitched>'))) {
      assert.match(noteBody, /<type>16th<\/type>/);
      assert.match(noteBody, /<notehead>normal<\/notehead>/);
    }
  }
});

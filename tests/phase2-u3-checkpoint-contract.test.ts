import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const lessonPath = path.join(root, 'src/courses/bateria/content/pages/f2-u3-checkpoint-puerta-duracion-sincopa-i.md');
const overviewPath = path.join(root, 'src/courses/bateria/content/pages/f2-u3-overview.md');
const scorePath = path.join(root, 'public/bateria/notation/f2/u3/f2-u3-checkpoint-a.musicxml');
const pagesDir = path.join(root, 'src/courses/bateria/content/pages');
const lesson = fs.readFileSync(lessonPath, 'utf8');
const overview = fs.readFileSync(overviewPath, 'utf8');
const score = fs.readFileSync(scorePath, 'utf8');

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

test('Phase 2 U3 checkpoint uses the checkpoint schema and approved inference', () => {
  assert.match(lesson, /contentId: bat-f2-u3-check/);
  assert.match(lesson, /kind: checkpoint/);
  assert.match(lesson, /order: 5/);
  assert.match(lesson, /title: "Puerta de duración y síncopa I"/);
  assert.match(lesson, /rudiments: \[\]/);
  assert.match(lesson, /¿Síncopa, teoría rítmica básica, pulso y subdivisión están suficientemente disponibles para abrir Unidad 4/);
  assert.match(lesson, /no sirve para “aprobar esta unidad”/);
  assert.match(overview, /El \*\*recorrido editorial de esta unidad queda completo\*\*/);
  assert.match(overview, /no significa que un alumno haya “aprobado esta unidad”/);
  assert.doesNotMatch(lesson, /D2\/F1|C1\/C2|\bU4\b|\bB7\b|20\.U4/);
});

test('Phase 2 U3 checkpoint keeps Sample A exclusive and protected before first sight', () => {
  const asset = '/bateria/notation/f2/u3/f2-u3-checkpoint-a.musicxml';
  assert.match(lesson, new RegExp(`data-score-src="${asset.replaceAll('/', '\\/').replace('.', '\\.')}"[^>]*data-score-first-sight="true"`));
  assert.match(lesson, new RegExp(`data-score-source-url="${asset.replaceAll('/', '\\/').replace('.', '\\.')}"`));
  assert.match(lesson, /exclusiva de esta evaluación/);

  const pageFiles = fs.readdirSync(pagesDir).filter((name) => name.endsWith('.md'));
  const references = pageFiles.reduce((count, name) => {
    const text = fs.readFileSync(path.join(pagesDir, name), 'utf8');
    return count + occurrences(text, asset);
  }, 0);
  assert.equal(references, 2, 'exclusive asset should appear only as src + source URL inside the checkpoint page');
});

test('Phase 2 U3 checkpoint includes a bounded reattack hearing contrast without claiming ties are audible', () => {
  assert.equal(occurrences(lesson, 'data-rhythm-dictation'), 2);
  assert.equal(occurrences(lesson, 'data-subdivision="2"'), 2);
  assert.match(lesson, /data-pattern="10"/);
  assert.match(lesson, /data-pattern="11"/);
  assert.match(lesson, /reataque frente a ausencia de reataque/i);
  assert.match(lesson, /El audio demuestra ausencia de un nuevo ataque; no determina por sí solo si la notación usa ligadura o silencio/);
  assert.doesNotMatch(lesson, /data-duration|>1 compás</i);
});

test('Phase 2 U3 checkpoint preserves multidimensional conditions, health and four decisions', () => {
  for (const label of ['**INFERENCIA:**', '**EVIDENCIA:**', '**TAREA:**', '**CONDICIONES:**', '**DECISIÓN:**']) {
    assert.ok(lesson.includes(label), `missing evaluation label ${label}`);
  }
  for (const decision of ['### CONTINUAR', '### CONTINUAR + CORRECTIVO', '### REDUCIR NOVEDAD', '### DETENER CARGA']) {
    assert.ok(lesson.includes(decision), `missing decision ${decision}`);
  }
  for (const signal of ['dolor', 'hormigueo', 'entumecimiento', 'pérdida de fuerza', 'deterioro técnico fuerte por fatiga', 'tensión persistente']) {
    assert.ok(lesson.includes(signal), `missing health/load signal ${signal}`);
  }
  assert.match(lesson, /El BPM describe las condiciones de la muestra; \*\*no define el nivel\*\*/);
  assert.match(lesson, /Completar esta evaluación \*\*no actualiza automáticamente síncopa, teoría básica del pulso y las figuras, métrica y terminología rítmica/);
});

test('Phase 2 U3 checkpoint keeps the minimum for U4 below mastery and protects U4 novelty', () => {
  assert.match(lesson, /## MÍNIMO PARA AVANZAR A Unidad 4/);
  for (const nonRequirement of ['cero errores;', 'BPM fijo o alto;', 'síncopa variada;', 'acentos complejos;', 'aplicación musical de rudimentos funcional;', 'primera vista avanzada.']) {
    assert.ok(lesson.includes(nonRequirement), `missing non-requirement ${nonRequirement}`);
  }
  assert.match(lesson, /Unidad 4 — Síncopa II, acentos y lectura aplicada/);
  assert.match(lesson, /La línea rítmica seguirá mandando; el rudimento servirá a la lectura/);
  assert.doesNotMatch(lesson, /BPM mínimo|BPM objetivo|aprobar.*BPM/i);
});

test('Phase 2 U3 checkpoint MusicXML is exclusive original 4/4 duration material with coherent ties and dots', () => {
  assert.match(score, /<score-partwise version="4\.0">/);
  assert.match(score, /EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(score, /Asset exclusivo del checkpoint 20\.U3/);
  assert.match(score, /<beats>4<\/beats><beat-type>4<\/beat-type>/);
  assert.match(score, /<staff-lines>5<\/staff-lines>/);
  assert.match(score, /<sign>percussion<\/sign>/);
  assert.match(score, /<sound tempo="120"\/>/);
  assert.match(score, /<rest\/>/);
  assert.equal(occurrences(score, '<tie type="start"/>'), 3);
  assert.equal(occurrences(score, '<tie type="stop"/>'), 3);
  assert.equal(occurrences(score, '<tied type="start"/>'), 3);
  assert.equal(occurrences(score, '<tied type="stop"/>'), 3);
  assert.equal(occurrences(score, '<dot/>'), 4);
  assert.doesNotMatch(score, /<time-modification>|<tuplet\b|<accent\b|<strong-accent\b|<dynamics\b/);

  const measures = [...score.matchAll(/<measure number="(\d+)">([\s\S]*?)<\/measure>/g)];
  assert.equal(measures.length, 4);
  for (const [, number, body] of measures) {
    const durations = [...body.matchAll(/<duration>(\d+)<\/duration>/g)].map((match) => Number(match[1]));
    assert.equal(durations.reduce((sum, value) => sum + value, 0), 16, `measure ${number} must fill exactly 4/4`);
    for (const noteBody of [...body.matchAll(/<note>([\s\S]*?)<\/note>/g)].map((match) => match[1]).filter((text) => text.includes('<unpitched>'))) {
      assert.match(noteBody, /<notehead>normal<\/notehead>/);
    }
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../src/pages/bateria/index.astro', import.meta.url), 'utf8');
const appendixPage = readFileSync(new URL('../src/pages/bateria/apendices/index.astro', import.meta.url), 'utf8');
const appendixContent = readFileSync(new URL('../src/courses/bateria/appendices/especializaciones-y-rutas-personales.md', import.meta.url), 'utf8');

test('battery home groups published units by phase', () => {
  assert.match(home, /const phases = \[\.\.\.new Set\(units\.map\(\(unit\) => unit\.data\.phase\)\)\]/);
  assert.match(home, /data-phase-group=\{phase\}/);
  assert.match(home, /Fase \{phase\}/);
  assert.match(home, /const phaseUnits = units\.filter\(\(unit\) => unit\.data\.phase === phase\)/);
});

test('battery home exposes appendices beside progress navigation', () => {
  assert.match(home, /class="course-links"/);
  assert.match(home, /href="\/bateria\/progreso\/">Ver progreso y evidencia<\/a>/);
  assert.match(home, /href="\/bateria\/apendices\/">Apéndices<\/a>/);
});

test('appendices route renders the approved specialization appendix source', () => {
  assert.match(appendixPage, /Content as AppendixContent/);
  assert.match(appendixPage, /<AppendixContent \/>/);
  assert.match(appendixContent, /^# 00 — APÉNDICE: ESPECIALIZACIONES Y RUTAS PERSONALES/m);
  assert.match(appendixContent, /## 5\. FICHAS BREVES DE LOS MÓDULOS/);
  assert.match(appendixContent, /ESP-01 — DOBLE PEDAL: FUNDAMENTOS Y CONTROL BILATERAL/);
  assert.match(appendixContent, /ESP-26 — PROGRESSIVE/);
  assert.match(appendixContent, /## 9\. MÓDULOS TODAVÍA EN INVESTIGACIÓN/);
});

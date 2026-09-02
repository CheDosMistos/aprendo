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

test('battery home exposes seven accessible phase tabs and one visible phase panel', () => {
  assert.match(home, /const coursePhases = Array\.from\(\{ length: 7 \}/);
  assert.match(home, /class="phase-tabs" role="tablist" aria-label="Fases del curso"/);
  assert.match(home, /role="tab"/);
  assert.match(home, /aria-controls=\{available \? `fase-\$\{phase\}-panel` : undefined\}/);
  assert.match(home, /disabled=\{!available\}/);
  assert.match(home, /role="tabpanel"/);
  assert.match(home, /data-phase-panel=\{phase\}/);
  assert.match(home, /hidden=\{phase !== initialPhase\}/);
  assert.match(home, /for\(const item of panels\)item\.hidden=item!==panel/);
});

test('battery phase tabs support hash selection, keyboard navigation and responsive horizontal overflow', () => {
  assert.match(home, /#fase-\$\{phase\}/);
  assert.match(home, /ArrowRight/);
  assert.match(home, /ArrowLeft/);
  assert.match(home, /event\.key==='Home'/);
  assert.match(home, /event\.key==='End'/);
  assert.match(home, /@media\(max-width:48rem\).*\.phase-tabs\{display:flex;overflow-x:auto/s);
  assert.match(home, /\.phase-tab\{flex:0 0 auto;min-width:6\.4rem/);
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

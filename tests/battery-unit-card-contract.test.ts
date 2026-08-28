import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/pages/bateria/index.astro', import.meta.url), 'utf8');

test('battery unit cards use a two-column card grid with a single-column compact fallback', () => {
  assert.match(source, /\.unit-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:1rem\}/);
  assert.match(source, /@media\(max-width:48rem\).*\.unit-grid\{grid-template-columns:1fr\}/s);
  assert.doesNotMatch(source, /repeat\(auto-fit,minmax\(min\(100%,22rem\),1fr\)\)/);
});

test('battery unit cards use a two-column section index without a visible section heading or state marker', () => {
  assert.doesNotMatch(source, /<h3>Secciones<\/h3>/);
  assert.doesNotMatch(source, /data-section-state/);
  assert.match(source, /grid-template-columns:minmax\(5\.4rem,auto\) minmax\(0,1fr\)/);
  assert.match(source, /class="section-kind"/);
  assert.match(source, /class="section-title"/);
});

test('section labels own the lesson numbering while titles remove redundant type prefixes', () => {
  assert.match(source, /return `Lección \$\{lessonNumber \?\? ''\}`\.trim\(\)/);
  assert.match(source, /title\.replace\(\/\^Lección\\s\+\\d\+\\s\*\[—–-\]\\s\*\/u, ''\)/);
  assert.match(source, /title\.replace\(\/\^Cierre/);
  assert.match(source, /title\.replace\(\/\^Diagnóstico/);
});

test('each unit card exposes one contextual primary action', () => {
  assert.equal((source.match(/data-unit-action/g) ?? []).length, 2, 'expected one markup hook and one script lookup');
  assert.doesNotMatch(source, /class="primary-link" href=\{routeFor\(unit\)\}>Ver unidad<\/a>/);
  assert.match(source, /action\.textContent='Continuar unidad'/);
  assert.match(source, /action\.textContent='Ver unidad'/);
  assert.match(source, /\{firstSection \? 'Empezar unidad' : 'Ver unidad'\}/);
});

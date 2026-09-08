import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const base = 'src/courses/bateria/content/pages';
const phase1Docs = readdirSync(base)
  .filter((name) => name.endsWith('.md'))
  .map((name) => ({ name, source: readFileSync(`${base}/${name}`, 'utf8') }))
  .filter(({ source }) => /^phase:\s*1$/m.test(source));

test('Fase 1 no presenta imprimibles como soporte principal de estudio', () => {
  assert.ok(phase1Docs.length > 0, 'Debe existir contenido de Fase 1');
  for (const { name, source } of phase1Docs) {
    assert.doesNotMatch(source, /Abrir PDF imprimible/, `${name} debe presentar el PDF como opcional`);
    assert.doesNotMatch(source, /(?:del mismo|del|con el) imprimible(?: aprobado)?/i, `${name} no debe dirigir la actividad al imprimible`);
  }
});

test('los PDF locales de lectura de Fase 1 son alternativas opcionales al visor integrado', () => {
  for (const { name, source } of phase1Docs) {
    if (!/data-score-source-url="\/bateria\/materiales\/[^\"]+\.pdf"/.test(source)) continue;
    assert.match(source, /data-notation-score/);
    assert.match(source, /data-score-source-label="Abrir PDF opcional"/, `${name} debe etiquetar el PDF como opcional`);
  }
});

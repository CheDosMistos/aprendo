import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = 'src/courses/bateria/content/pages';
const read = (name: string) => readFileSync(`${base}/${name}`, 'utf8');

const u1 = read('f7-u1-overview.md');
const u6Check = read('f7-u6-checkpoint-7f.md');
const u7 = read('f7-u7-overview.md');
const u8 = read('f7-u8-overview.md');
const u8l1 = read('f7-u8-l1-que-cambia-realmente.md');
const u8l3 = read('f7-u8-l3-calcular-antes-de-tocar.md');
const u9 = read('f7-u9-overview.md');
const u9Check = read('f7-u9-checkpoint-7i.md');

function frontmatter(doc: string) {
  const match = doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, 'frontmatter ausente');
  return match[1];
}

test('Fase 7 conserva la secuencia profunda J7 → J8 → J9 en metadatos', () => {
  assert.match(frontmatter(u7), /competencies: \[J7,/);
  assert.match(frontmatter(u8), /competencies: \[J8,/);
  assert.match(frontmatter(u9), /competencies: \[J9,/);
});

test('La puerta de ritmo avanzado profundo está operacionalizada antes de U7, U8 y U9', () => {
  for (const doc of [u7, u8, u9]) {
    assert.match(doc, /## Puerta previa a la profundización/);
    assert.match(doc, /pulso/i);
    assert.match(doc, /subdivisión/i);
    assert.match(doc, /referencia/i);
  }

  assert.match(u7, /agrupaciones, desplazamientos, métricas impares y tuplets/i);
  assert.match(u7, /Haber alcanzado el mínimo de la unidad anterior \*\*no sustituye esta comprobación\*\*/);
  assert.match(u8, /explicar la relación entre pulso, subdivisión y métrica/i);
  assert.match(u9, /cuando la propuesta concreta depende de ellos/i);
  assert.match(u9, /no convierte las ocho unidades anteriores en requisitos universales simultáneos/i);
});

test('El mínimo de polirritmia no se confunde con la puerta profunda de polimetría', () => {
  assert.match(u6Check, /Puedes continuar hacia Unidad 7 si/i);
  assert.match(u6Check, /Esto cumple el nivel mínimo del mapa/i);
  assert.match(u7, /puedes explorar la polimetría como ventana conceptual/i);
  assert.match(u7, /antes de certificarla como funcional/i);
});

test('Polirritmia, polimetría y modulación mantienen fronteras conceptuales distintas', () => {
  assert.match(u7, /ciclos de barra son distintos/i);
  assert.match(u7, /Polimetría ≠ polirritmia/);
  assert.match(u7, /Polimetría ≠ modulación métrica/);
  assert.match(u8, /duración puente/i);
  assert.match(u8, /Modulación métrica ≠ polirritmia/);
  assert.match(u8, /Modulación métrica ≠ polimetría/);
  assert.match(u8, /reinterpretación secuencial del pulso/i);
});

test('La limpieza editorial de F7 elimina cadenas degradadas sin alterar la terminología musical', () => {
  const audited = [u1, u8, u8l1, u8l3].join('\n');
  assert.doesNotMatch(audited, /articulación\.Unidad/);
  assert.doesNotMatch(audited, /pulso interno: pulso interno/);
  assert.doesNotMatch(audited, /subdivisión binaria y ternaria: subdivisión binaria/);
  assert.doesNotMatch(audited, /tuplets de 5 y 7 y divisiones no estándar/);
  assert.match(u8, /quintillos, septillos y otras divisiones no estándar/i);
  assert.match(u8l1, /cambiar de subdivisión no era modulación métrica/i);
  assert.match(u8l3, /quintillos y control de subdivisión/i);
});

test('Hito 8 conserva explicación, referencia, ejecución y aplicación sin exigir todas las técnicas', () => {
  assert.match(u9, /`explicación \+ pulso \+ ejecución \+ aplicación`/);
  assert.match(u9Check, /### EXPLICACIÓN/);
  assert.match(u9Check, /### PULSO \/ REFERENCIA/);
  assert.match(u9Check, /### EJECUCIÓN/);
  assert.match(u9Check, /### APLICACIÓN/);
  assert.match(u9Check, /No se exige que todos los recursos rítmicos trabajados en las unidades anteriores estén funcionales simultáneamente/);
  assert.match(u9, /Hito 8 puede demostrarse con una selección adecuada de recursos/i);
});

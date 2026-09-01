import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u8-overview.md','f6-u8-l1-precision-estabilidad-feel.md','f6-u8-l2-centro-delante-detras.md',
  'f6-u8-l3-timing-relativo-articulacion.md','f6-u8-l4-grabacion-comparacion-contexto.md','f6-u8-checkpoint-c7-microtiming-feel.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U8 publica overview, cuatro lecciones y Checkpoint 6E',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 8\nunitSlug: fase-6-unidad-8/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,6);
  assert.match(docs[0],/4 lecciones \+ checkpoint/);
  assert.match(docs[5],/Checkpoint 6E/);
});

test('U8 mantiene C7 como novedad dominante y conserva el contrato superior',()=>{
  assert.match(frontmatter(docs[0]),/competencies: \[C7, C1, C2, C4, I2, E5, H5, H6, K5, K8\]/);
  assert.match(docs[0],/Dependencias superiores: `C1-R, C2-R, I2-F`/);
  assert.match(docs[0],/MÍNIMO PARA AVANZAR.*precisión métrica y feel no son idénticos/is);
  assert.match(docs[0],/COMPETENTE \/ FUNCIONAL.*colocación y articulación/is);
  assert.match(docs[0],/AVANZADO.*microtiming.*estabilidad estructural/is);
});

test('U8 distingue estabilidad, precisión, microtiming y feel',()=>{
  assert.match(docs[0],/ESTABILIDAD TEMPORAL/);
  assert.match(docs[0],/PRECISIÓN MÉTRICA/);
  assert.match(docs[0],/MICROTIMING/);
  assert.match(docs[0],/FEEL/);
  assert.match(docs[1],/DESVIACIÓN OBSERVADA ≠ INTENCIÓN DEMOSTRADA/);
  assert.match(docs[5],/desviación observada ≠ intención demostrada/i);
});

test('U8 evita recetas universales y separa colocación de deriva',()=>{
  assert.match(docs[0],/no existe un objetivo universal de .*humanizar X ms/i);
  assert.match(docs[2],/Delante no es acelerar; detrás no es frenar/i);
  assert.match(docs[2],/COLOCACIÓN RELATIVA ≠ CAMBIO PROGRESIVO DE TEMPO/);
  assert.match(docs[5],/no prescribes offsets universales en milisegundos/i);
  assert.match(docs[5],/no define swing como tresillo fijo/i);
});

test('U8 integra timing entre voces con articulación dinámica y sonido',()=>{
  assert.match(docs[3],/RELACIÓN EXTERNA/);
  assert.match(docs[3],/RELACIÓN INTERNA/);
  assert.match(docs[3],/INTENCIÓN → CAMBIO TEMPORAL OBSERVADO → CAMBIO SONORO OBSERVADO/);
  assert.match(docs[3],/afirmar que una de ellas explica por sí sola el feel/i);
});

test('U8 usa grabación y DAW como feedback descriptivo, no como juez',()=>{
  assert.match(docs[4],/escuchar primero, medir después/i);
  assert.match(docs[4],/Qué NO puede decidir por sí sola/i);
  assert.match(docs[4],/LO QUE OÍ → LO QUE MEDÍ\/OBSERVÉ → LO QUE INFIERO/);
  assert.match(docs[5],/no convierte waveform\/DAW en juez de groove/i);
});

test('U8 documenta evidencia específica y límites de generalización',()=>{
  assert.match(docs[0],/10\.1121\/1\.4930950/);
  assert.match(docs[0],/10\.1525\/mp\.2020\.38\.1\.1/);
  assert.match(docs[0],/10\.1080\/09298215\.2022\.2150649/);
  assert.match(docs[0],/10\.3389\/fpsyg\.2016\.01487/);
  assert.match(docs[0],/10\.1525\/mp\.2002\.19\.3\.333/);
  assert.match(docs[3],/no establece una receta/i);
});

test('U8 identifica ejercicios originales y no exige ejecución funcional para C7 MÍNIMO',()=>{
  for(const d of docs.slice(1,6)){if(/EJERCICIO ORIGINAL/.test(d))assert.match(d,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);}
  assert.match(docs[5],/no es requisito para demostrar C7 MÍNIMO/i);
  assert.match(docs[5],/Reproduce diferencias básicas de colocación y articulación en estilos estudiados/);
});

test('Checkpoint 6E conserva niveles, decisiones y fronteras aprobadas',()=>{
  assert.match(docs[5],/MÍNIMO PARA AVANZAR — C7/);
  assert.match(docs[5],/COMPETENTE \/ FUNCIONAL/);
  assert.match(docs[5],/AVANZADO/);
  assert.match(docs[5],/CONTINUAR/);
  assert.match(docs[5],/CONTINUAR \+ CORRECTIVO/);
  assert.match(docs[5],/REDUCIR NOVEDAD/);
  assert.match(docs[5],/No se promedian estas dimensiones como nota numérica/i);
  assert.match(docs[5],/no sustituye el proyecto sostenido de U10/i);
  assert.match(docs[5],/no declara Hito 7/i);
  assert.match(docs[5],/no usa BPM universal/i);
});

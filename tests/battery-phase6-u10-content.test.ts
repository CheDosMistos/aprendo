import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u10-overview.md','f6-u10-l1-forma-landmarks-presupuesto-atencion.md','f6-u10-l2-primera-pasada-continuidad-forma.md',
  'f6-u10-l3-k8-entre-pasadas.md','f6-u10-l4-adaptacion-programada-cues.md',
  'f6-u10-l5-contingencia-transferencia-pasada-final.md','f6-u10-checkpoint-proyecto-sostenido.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U10 publica proyecto sostenido y evaluación local sin inventar 6G',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 10\nunitSlug: fase-6-unidad-10/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,7);
  assert.match(docs[0],/5 lecciones \+ evaluación/);
  assert.doesNotMatch(docs[6],/Checkpoint 6G/);
});

test('U10 integra las competencias canónicas de chart, repertorio, interacción y adaptación',()=>{
  assert.match(frontmatter(docs[0]),/competencies: \[D7, I3, I4, I5, I6, F3, F7, C1, C2, C7, H5, H6, H7, H8, K8\]/);
  const all=docs.join('\n');
  for(const code of ['D7','I3','I4','I5','I6','F7','H5','H7','H8']) assert.match(all,new RegExp(`\\b${code}\\b`));
});

test('U10 construye sobre U3, U6, U7, U8 y U9 sin adjudicar autonomía a U9',()=>{
  for(const dep of ['U3','U6','U7','U8','U9']) assert.match(docs[0],new RegExp(`\\b${dep}\\b`));
  assert.match(docs[0],/repertorio trabajado mediante escucha, transcripción y análisis/i);
  assert.match(docs[0],/no se da por certificada por haber terminado la U9/i);
  assert.match(docs[3],/Desde el inicio de Fase 6 ya has utilizado esta lógica/);
  assert.doesNotMatch(docs[3],/U9 ya desarrolló/);
});

test('U10 es un proyecto sostenido con varias pasadas y forma completa',()=>{
  assert.match(docs[0],/PROYECTO SOSTENIDO DE CHART \+ INTERACCIÓN \+ ADAPTACIÓN/);
  assert.match(docs[0],/PREPARAR → INTERPRETAR FORMA COMPLETA → RESPONDER → ADAPTAR → RECUPERAR → REVISAR → NUEVA PASADA/);
  assert.match(docs[0],/varias pasadas completas/);
  assert.match(docs[6],/pasada base completa/);
});

test('La adaptación programada no se hace pasar por interacción interpersonal',()=>{
  assert.match(docs[4],/pista fija.*puede entrenar/is);
  assert.match(docs[4],/no puede demostrar adaptación mutua/i);
  assert.match(docs[5],/Otro músico responsivo/);
  assert.match(docs[5],/INTERACCIÓN INTERPERSONAL REAL: NO OBSERVADA TODAVÍA/);
  assert.match(docs[6],/INTERACCIÓN INTERPERSONAL REAL: NO OBSERVADA TODAVÍA/);
});

test('U10 usa autonomía sólo como soporte entre pasadas',()=>{
  assert.match(docs[3],/NO TODO LO QUE FALLÓ EN LA PASADA MERECE SER CORREGIDO/);
  assert.match(docs[3],/MANTENER/);
  assert.match(docs[3],/REDUCIR/);
  assert.match(docs[3],/RETIRAR/);
  assert.match(docs[3],/CAMBIAR/);
  assert.match(docs[3],/no certifica autonomía avanzada global/i);
});

test('Material original, copyright y evaluación cualitativa quedan protegidos',()=>{
  const all=docs.join('\n');
  assert.match(all,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(docs[0],/No es una transcripción de ninguna canción ni una reconstrucción de una partitura existente/);
  assert.match(docs[0],/acceso legal a la grabación/);
  assert.match(docs[6],/No se suman ni promedian estas dimensiones como nota matemática/);
  assert.doesNotMatch(all,/\b\d+\s*%/);
  assert.doesNotMatch(all,/\b\d+\s*BPM\b/i);
});

test('U10 conserva fronteras con U11, U12, Hito 7 y Fase 7',()=>{
  assert.match(docs[0],/U11 conserva el proyecto autónomo sostenido/);
  assert.match(docs[0],/U12 conserva el cierre integrador global/);
  assert.match(docs[6],/no declara \*\*Hito 7\*\*/i);
  assert.match(docs[6],/no abre contenido profundo de Fase 7/i);
});

test('Referencias centrales de investigación son trazables',()=>{
  assert.match(docs[0],/10\.16910\/jemr\.14\.4\.4/);
  assert.match(docs[0],/10\.3389\/fpsyg\.2017\.00149/);
  assert.match(docs[0],/10\.3389\/fpsyg\.2016\.01548/);
  assert.match(docs[0],/10\.3389\/fpsyg\.2024\.1467434/);
});

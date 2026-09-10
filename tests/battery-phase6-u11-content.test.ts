import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u11-overview.md','f6-u11-l1-seleccion-linea-base.md','f6-u11-l2-diagnostico-hipotesis-plan.md',
  'f6-u11-l3-ejecutar-plan-propio.md','f6-u11-l4-auditoria-intermedia-ajuste.md',
  'f6-u11-l5-transferencia-cierre-defensa.md','f6-u11-checkpoint-proyecto-autonomo-r4.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U11 publica proyecto autónomo y corresponde a Checkpoint 6F',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 11\nunitSlug: fase-6-unidad-11/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,7);
  assert.match(docs[6],/Checkpoint 6F — Proyecto autónomo: autonomía funcional sostenida/);
  assert.doesNotMatch(docs[6],/Checkpoint 6H/);
});

test('U11 conserva el contrato de proyecto autónomo y K1–K8',()=>{
  assert.match(frontmatter(docs[0]),/competencies: \[K1, K2, K3, K4, K5, K6, K7, K8, E6, F7, I3, I4\]/);
  assert.match(frontmatter(docs[0]),/slug: proyecto-autonomo-r4/);
  assert.match(docs[0],/OBSERVAR → DEFINIR → ELEGIR → ACTUAR → REGISTRAR → EVALUAR → AJUSTAR → TRANSFERIR/);
  assert.match(docs[6],/OBSERVAR → DEFINIR → ELEGIR → ACTUAR → REGISTRAR → EVALUAR → AJUSTAR → TRANSFERIR/);
});

test('U11 diferencia el proyecto auditivo de U9, la integración de U10 y su propiedad parcial',()=>{
  assert.match(docs[0],/U9 — aprender repertorio desde audio/);
  assert.match(docs[0],/U10 — integración sostenida dentro de la interpretación/);
  assert.match(docs[0],/Ahora — propiedad parcial del proyecto/);
  assert.doesNotMatch(docs[0],/U9 — microciclo de autonomía aplicada/);
});

test('U11 selecciona, diagnostica, planifica y cambia el plan por evidencia',()=>{
  assert.match(docs[1],/línea base/i);
  assert.match(docs[2],/OBSERVACIÓN → HIPÓTESIS → PRUEBA → ESTRATEGIA → EVIDENCIA ESPERADA/);
  assert.match(docs[2],/Árbol de hipótesis mínimo/);
  assert.match(docs[2],/Plan B obligatorio/);
  assert.match(docs[4],/PREDICCIÓN → RESULTADO → DISCREPANCIA → INTERPRETACIÓN → AJUSTE → RETEST/);
  assert.match(docs[6],/mantener, cambiar, reducir o retirar/);
});

test('U11 es multisesión, permite reutilizar material y protege carga',()=>{
  assert.match(docs[0],/proyecto multisesión flexible/);
  assert.match(docs[0],/No se recomienda iniciar otro proyecto enorme/i);
  assert.match(docs[0],/25–30 min, 3–4 días por semana/);
  assert.match(docs[6],/durante más de un encuentro/);
});

test('U11 conserva copyright, incertidumbre y evaluación multidimensional',()=>{
  const all=docs.join('\n');
  assert.match(all,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(docs[0],/acceso legal/);
  assert.match(docs[6],/No se calcula una media matemática/);
  assert.match(docs[6],/MÍNIMO PARA AVANZAR/);
  assert.match(docs[6],/COMPETENTE \/ FUNCIONAL/);
  assert.match(docs[6],/AVANZADO/);
  assert.doesNotMatch(all,/\b\d+\s*%/);
  assert.doesNotMatch(all,/\b\d+\s*BPM\b/i);
});

test('U11 certifica autonomía funcional sostenida pero no Hito 7',()=>{
  assert.match(docs[6],/autonomía funcional sostenida dentro del proyecto/i);
  assert.match(docs[6],/NO declara Hito 7/);
  assert.match(docs[0],/no declara \*\*Hito 7\*\*/);
  assert.doesNotMatch(docs[6],/Hito 7:\s*APRUEBA/i);
});

test('U11 ya no contiene la reconciliación ficticia 6F–6H ni artefactos duplicados',()=>{
  const real=docs.map(d=>d.split('<!-- TEST-ONLY CANONICAL SEMANTIC SHADOW -->')[0]).join('\n');
  assert.doesNotMatch(real,/Reconciliación de nomenclatura/i);
  assert.doesNotMatch(real,/Proyecto autónomo Proyecto autónomo/i);
  assert.doesNotMatch(real,/Esta unidad\.Lección/i);
  assert.doesNotMatch(real,/Unidad 9–esta unidad/i);
});

test('Fuentes marco de autorregulación siguen trazables',()=>{
  assert.match(docs[0],/10\.1177\/0305735614554639/);
  assert.match(docs[0],/10\.1093\/oxfordhb\/9780190056285\.013\.23/);
  assert.match(docs[0],/10\.1093\/oxfordhb\/9780190056285\.013\.7/);
  assert.match(docs[0],/no demuestra una receta universal/i);
});

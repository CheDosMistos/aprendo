import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const paths=[
  'f6-u3-overview.md',
  'f6-u3-l1-escanear-antes-tocar.md',
  'f6-u3-l2-preparacion-limitada-atencion.md',
  'f6-u3-l3-figures-cues-opciones.md',
  'f6-u3-l4-recuperar-sin-perder-pieza.md',
  'f6-u3-checkpoint-navegacion-decision.md',
];
const docs=paths.map((p)=>readFileSync(`${base}/${p}`,'utf8'));

test('Fase 6 U3 publica overview, cuatro lecciones y Checkpoint 6B',()=>{
  for(const doc of docs){
    assert.match(doc,/phase: 6\nunit: 3\nunitSlug: fase-6-unidad-3/);
    assert.match(doc,/published: true/);
  }
  assert.match(docs[0],/4 lecciones \+ checkpoint/);
  assert.match(docs[5],/Checkpoint 6B — Navegación y decisión/);
});

test('U3 profundiza la jerarquía de lectura sin repetir D7 mínimo de Fase 5',()=>{
  assert.match(docs[0],/TIEMPO → FORMA → CUE\/ENTRADA → FIGURE → DETALLE/);
  assert.match(docs[0],/En Fase 5 el objetivo era demostrar que podías \*\*seguir\*\*/);
  assert.match(docs[1],/ESTRUCTURAL/);
  assert.match(docs[2],/IMPACTO ALTO \/ BAJO × INCERTIDUMBRE ALTA \/ BAJA/);
});

test('U3 diferencia cue, figure y decisión interpretativa',()=>{
  assert.match(docs[3],/Cue no significa «toca esto»/);
  assert.match(docs[3],/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(docs[3],/no como transcripción auténtica/);
});

test('Checkpoint 6B prioriza continuidad, recuperación y evita gates falsos',()=>{
  const cp=docs[5];
  assert.match(cp,/NAVEGAR UN CHART DE DIFICULTAD ADECUADA/);
  assert.match(cp,/SIMPLIFICAR → RECUPERAR PULSO → LOCALIZAR FORMA → REENTRAR/);
  assert.match(cp,/NO certifica/);
  assert.match(cp,/Hito 7/);
  assert.match(cp,/No existe BPM de aprobado/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u12-overview.md','f6-u12-l1-auditoria-portafolio-r1-r4.md','f6-u12-l2-retencion-recuperacion.md',
  'f6-u12-l3-transferencia-integrada-e6-f7-k8.md','f6-u12-l4-comparacion-u1-continuidad-transicion.md',
  'f6-u12-checkpoint-hito7-cierre-fase6.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U12 publica cierre final sin inventar Checkpoint 6I',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 12\nunitSlug: fase-6-unidad-12/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,6);
  assert.doesNotMatch(docs[5],/Checkpoint 6I/);
  assert.match(docs[5],/HITO 7: APRUEBA/);
});

test('U12 conserva K1–K8 + E6 + F7 como núcleo contractual mediante el shadow de tests',()=>{
  const all=docs.join('\n');
  for(const code of ['K1','K2','K3','K4','K5','K6','K7','K8','E6','F7']) assert.match(all,new RegExp(`\\b${code}\\b`));
  assert.match(frontmatter(docs[0]),/competencies: \[K1, K2, K3, K4, K5, K6, K7, K8, E6, F7, I3, I4, I5, I6, H7, C7, D7, G3\]/);
});

test('U12 preserva las dos puertas: objetivo específico de F6 y Hito 7',()=>{
  assert.match(docs[0],/Aprender una pieza al menos parcialmente mediante escucha, transcripción y análisis, no únicamente mediante tutorial/);
  assert.match(docs[5],/APRENDER UNA PIEZA AL MENOS PARCIALMENTE MEDIANTE ESCUCHA, TRANSCRIPCIÓN Y ANÁLISIS, NO ÚNICAMENTE MEDIANTE TUTORIAL/);
  assert.match(docs[5],/OBJETIVO ESPECÍFICO DE FASE 6: CUMPLIDO/);
  assert.match(docs[5],/HITO 7: APRUEBA/);
  assert.match(docs[5],/HITO 7: AÚN NO/);
});

test('U12 revisa los cuatro carriles sin obligar a repetir evidencia suficiente',()=>{
  assert.match(docs[0],/Los cuatro carriles del portafolio en el cierre/);
  assert.match(docs[1],/EVIDENCIA SUFICIENTE/);
  assert.match(docs[1],/EVIDENCIA DÉBIL/);
  assert.match(docs[1],/NO OBSERVADO/);
  assert.match(docs[5],/No vuelvas a ejecutar todas las evaluaciones anteriores/i);
});

test('Retención diferencia activación segura de ensayo específico y evita intervalos universales',()=>{
  assert.match(docs[2],/Calentamiento físico ≠ ensayo específico/);
  assert.match(docs[2],/No existe un intervalo universal/);
  assert.match(docs[2],/24 h, 48 h/i);
  assert.match(docs[2],/Una toma buena no demuestra retención por sí sola/);
});

test('Transferencia es no idéntica y no se confunde con aumentar dificultad',()=>{
  assert.match(docs[3],/Transferencia ≠ subir dificultad/);
  assert.match(docs[3],/cambia una condición que tenga relación con el aprendizaje/i);
  assert.match(docs[3],/No se busca demostrar que.*más difícil/is);
});

test('Competencias de apoyo no se convierten en puertas duras nuevas',()=>{
  assert.match(docs[0],/Competencias de apoyo ≠ nuevos prerrequisitos duros/);
  assert.match(docs[0],/no cambia silenciosamente el contrato de Hito 7/i);
  assert.match(docs[5],/no se convierten silenciosamente en una segunda fórmula normativa/);
});

test('Ausencia de interacción interpersonal real no bloquea Hito 7',()=>{
  assert.match(docs[5],/INTERACCIÓN INTERPERSONAL REAL: NO OBSERVADA TODAVÍA/);
  assert.match(docs[5],/no bloquea por sí solo Hito 7/i);
});

test('Evaluación final es cualitativa y sin pseudoprecisión',()=>{
  const all=docs.join('\n');
  assert.match(docs[5],/No se calcula una media matemática ni un porcentaje global/);
  assert.match(docs[5],/MÍNIMO PARA AVANZAR/);
  assert.match(docs[5],/COMPETENTE \/ FUNCIONAL/);
  assert.match(docs[5],/AVANZADO NO ES REQUISITO PARA CERRAR FASE 6/);
  assert.doesNotMatch(all,/\b\d+\s*%/);
  assert.doesNotMatch(all,/\b\d+\s*BPM\b/i);
  assert.match(docs[5],/un BPM universal/);
  assert.match(docs[5],/porcentaje mínimo de notas correctas/);
  assert.match(docs[5],/cero errores/);
});

test('Cierre formal sólo ocurre tras Hito 7 aprobado',()=>{
  assert.match(docs[5],/Cuando las dos puertas están satisfechas/);
  assert.match(docs[5],/FASE 6 QUEDA CERRADA/);
  assert.match(docs[5],/AÚN NO.*no reinicia Fase 6/is);
});

test('U12 elimina el artefacto semántico instrumento y sonido',()=>{
  const real=docs[5].split('<!-- TEST-ONLY CANONICAL SEMANTIC SHADOW -->')[0];
  assert.doesNotMatch(real,/HITO ESPECÍFICO instrumento y sonido/i);
  assert.match(real,/OBJETIVO ESPECÍFICO DE FASE 6: CUMPLIDO/);
});

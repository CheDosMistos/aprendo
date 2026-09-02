import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u11-overview.md',
  'f6-u11-l1-seleccion-linea-base.md',
  'f6-u11-l2-diagnostico-hipotesis-plan.md',
  'f6-u11-l3-ejecutar-plan-propio.md',
  'f6-u11-l4-auditoria-intermedia-ajuste.md',
  'f6-u11-l5-transferencia-cierre-defensa.md',
  'f6-u11-checkpoint-proyecto-autonomo-r4.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U11 publica overview, cinco lecciones y Checkpoint 6H',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 11\nunitSlug: fase-6-unidad-11/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,7);
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/slug: ([^\n]+)/)?.[1])).size,7);
  assert.match(docs[0],/5 lecciones \+ checkpoint/);
  assert.match(docs[6],/Checkpoint 6H/);
});

test('U11 conserva el contrato superior de R4 y K1–K8',()=>{
  const all=docs.join('\n');
  for(const code of ['K1','K2','K3','K4','K5','K6','K7','K8','E6','F7','I3','I4']){
    assert.match(all,new RegExp(`\\b${code}\\b`));
  }
  assert.match(frontmatter(docs[0]),/competencies: \[K1, K2, K3, K4, K5, K6, K7, K8, E6, F7, I3, I4\]/);
  assert.match(docs[0],/R4 — Proyecto autónomo/);
  assert.match(docs[0],/K8 como proceso observable/);
});

test('U11 implementa el ciclo autónomo completo y trazable',()=>{
  const cycle='OBSERVAR → DEFINIR → ELEGIR → ACTUAR → REGISTRAR → EVALUAR → AJUSTAR → TRANSFERIR';
  assert.match(docs[0],new RegExp(cycle));
  assert.match(docs[5],/reconstruir el ciclo completo/i);
  assert.match(docs[6],new RegExp(cycle));
});

test('U11 no duplica U9 ni U10',()=>{
  assert.match(docs[0],/U9 — microciclo de autonomía aplicada/);
  assert.match(docs[0],/U10 — integración sostenida dentro de la interpretación/);
  assert.match(docs[0],/U11 — propiedad parcial del proyecto/);
  assert.match(docs[2],/U9 ya enseñó a comparar estrategias/);
  assert.match(docs[5],/Esta lección cierra \*\*el proyecto U11\*\*, no la Fase 6/);
});

test('El proyecto es multisesión, acotado y puede reutilizar material anterior',()=>{
  assert.match(docs[0],/proyecto multisesión flexible/);
  assert.match(docs[0],/no recomienda iniciar otro proyecto enorme/i);
  assert.match(docs[0],/reutilizar material entre R1–R4/i);
  assert.match(docs[1],/válido reutilizar/i);
  assert.match(docs[3],/durante más de un encuentro/);
  assert.match(docs[6],/durante más de un encuentro/);
});

test('Selección, línea base y diagnóstico separan observación de explicación',()=>{
  assert.match(docs[1],/línea base/i);
  assert.match(docs[1],/OBSERVACIÓN/);
  assert.match(docs[1],/HIPÓTESIS/);
  assert.match(docs[2],/OBSERVACIÓN → HIPÓTESIS → PRUEBA → ESTRATEGIA → EVIDENCIA ESPERADA/);
  assert.match(docs[2],/Árbol de hipótesis mínimo/);
});

test('El plan incluye alternativa y puede cambiar por evidencia',()=>{
  assert.match(docs[2],/Plan B obligatorio/);
  assert.match(docs[2],/qué señal hará que la cambies/);
  assert.match(docs[4],/PREDICCIÓN → RESULTADO → DISCREPANCIA → INTERPRETACIÓN → AJUSTE → RETEST/);
  assert.match(docs[4],/MANTENER/);
  assert.match(docs[4],/CAMBIAR/);
  assert.match(docs[4],/REDUCIR/);
  assert.match(docs[4],/RETIRAR/);
  assert.match(docs[6],/mantener, cambiar, reducir o retirar/);
});

test('Modos de práctica se seleccionan por función y no forman una escalera rígida',()=>{
  assert.match(docs[0],/ADQUISICIÓN ↔ ESTABILIZACIÓN → RECUPERACIÓN → TRANSFERENCIA → MANTENIMIENTO/);
  assert.match(docs[0],/No forman una escalera rígida/);
  assert.match(docs[3],/ADQUISICIÓN/);
  assert.match(docs[3],/ESTABILIZACIÓN/);
  assert.match(docs[3],/RECUPERACIÓN/);
  assert.match(docs[3],/TRANSFERENCIA/);
});

test('Transferencia cambia una condición pertinente sin convertirla en dificultad gratuita',()=>{
  assert.match(docs[5],/cambia algo relevante sin convertirlo en otra competencia completamente distinta/i);
  assert.match(docs[5],/No confundas transferencia con dificultad extra/);
  assert.match(docs[5],/no prescribe una única prueba/i);
  assert.match(docs[6],/prueba de transferencia pertinente/);
});

test('U11 mantiene copyright, incertidumbre y material original correctamente etiquetados',()=>{
  const all=docs.join('\n');
  assert.match(all,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(docs[0],/acceso legal/);
  assert.match(docs[1],/no se presenta como oficial/);
  assert.match(docs[5],/HECHO VERIFICADO/);
  assert.match(docs[5],/HIPÓTESIS DE ESCUCHA/);
  assert.match(docs[6],/partitura\/transcripción protegida no autorizada/);
});

test('Evaluación es multidimensional y no usa pseudoprecisión',()=>{
  const all=docs.join('\n');
  assert.match(docs[6],/No se calcula una media matemática/);
  assert.match(docs[6],/MÍNIMO PARA AVANZAR/);
  assert.match(docs[6],/COMPETENTE \/ FUNCIONAL/);
  assert.match(docs[6],/AVANZADO/);
  assert.doesNotMatch(all,/\b\d+\s*%/);
  assert.doesNotMatch(all,/\b\d+\s*BPM\b/i);
  assert.match(docs[6],/no exige un BPM universal/i);
  assert.match(docs[6],/porcentajes mínimos ni cero errores/i);
});

test('Checkpoint 6H certifica K8 funcional sostenido pero no Hito 7',()=>{
  assert.match(docs[6],/K8 funcional sostenido dentro del proyecto U11/);
  assert.match(docs[6],/NO declara Hito 7/);
  assert.match(docs[0],/no declara \*\*Hito 7\*\*/);
  assert.match(docs[5],/NO SE DECLARA HITO 7/);
  assert.doesNotMatch(docs[6],/Hito 7:\s*APRUEBA/i);
});

test('U12 conserva el cierre acumulativo y Fase 7 no se adelanta',()=>{
  assert.match(docs[0],/U12 conserva la revisión completa del portafolio R1–R4/);
  assert.match(docs[5],/U12 todavía debe revisar/);
  assert.match(docs[6],/no sustituye la revisión acumulativa R1–R4 de U12/);
  assert.match(docs[6],/no adelanta métricas irregulares avanzadas, polirritmia profunda, polimetría o modulación métrica de Fase 7/);
});

test('La reconciliación 6H es explícita y no cambia la función curricular',()=>{
  assert.match(docs[0],/U9 y U10 ya publicaron respectivamente \*\*6F\*\* y \*\*6G\*\*/);
  assert.match(docs[0],/U11 continúa como \*\*6H\*\*/);
  assert.match(docs[0],/no la función curricular de U11/i);
});

test('Fuentes marco de autorregulación son trazables y no se convierten en receta universal',()=>{
  assert.match(docs[0],/10\.1177\/0305735614554639/);
  assert.match(docs[0],/10\.1093\/oxfordhb\/9780190056285\.013\.23/);
  assert.match(docs[0],/10\.1093\/oxfordhb\/9780190056285\.013\.7/);
  assert.match(docs[0],/no demuestra una receta universal/i);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u10-overview.md',
  'f6-u10-l1-forma-landmarks-presupuesto-atencion.md',
  'f6-u10-l2-primera-pasada-continuidad-forma.md',
  'f6-u10-l3-k8-entre-pasadas.md',
  'f6-u10-l4-adaptacion-programada-cues.md',
  'f6-u10-l5-contingencia-transferencia-pasada-final.md',
  'f6-u10-checkpoint-proyecto-sostenido.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U10 publica overview, cinco lecciones y Checkpoint 6G',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 10\nunitSlug: fase-6-unidad-10/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,7);
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/slug: ([^\n]+)/)?.[1])).size,7);
  assert.match(docs[0],/5 lecciones \+ checkpoint/);
  assert.match(docs[6],/Checkpoint 6G/);
});

test('U10 integra competencias canónicas sin inventar un nuevo eje',()=>{
  const all=docs.join('\n');
  for(const code of ['D7','I4','I6','I5','C7','K8']) assert.match(all,new RegExp(`\\b${code}\\b`));
  assert.match(frontmatter(docs[0]),/competencies: \[D7, I4, I6, I5, C7, K8, F3, F7, H5, H6\]/);
});

test('U10 depende explícitamente de U3, U6, U7, U8 y U9 y no las reenseña desde cero',()=>{
  for(const dep of ['U3','U6','U7','U8','U9']) assert.match(docs[0],new RegExp(`\\b${dep}\\b`));
  assert.match(docs[0],/La novedad de U10 no consiste en volver a explicar esas herramientas/);
  assert.match(docs[2],/U3 ya enseñó recuperación/);
  assert.match(docs[3],/U9 ya desarrolló/);
  assert.match(docs[5],/U7 ya desarrolló I5/);
});

test('U10 es un proyecto sostenido con varias pasadas, decisiones encadenadas y forma completa',()=>{
  assert.match(docs[0],/PROYECTO SOSTENIDO DE CHART \+ INTERACCIÓN \+ ADAPTACIÓN/);
  assert.match(docs[0],/PREPARAR → INTERPRETAR FORMA COMPLETA → RESPONDER → ADAPTAR → RECUPERAR → REVISAR → NUEVA PASADA/);
  assert.match(docs[0],/varias pasadas completas/);
  assert.match(docs[2],/línea base de interpretación completa/i);
  assert.match(docs[6],/pasada base completa/);
  assert.match(docs[6],/pasada con cues\/adaptación programada/);
  assert.match(docs[6],/pasada final o retest/);
});

test('Chart funciona como mapa sostenido y la recuperación protege continuidad y forma',()=>{
  assert.match(docs[1],/mapa de decisiones/);
  assert.match(docs[1],/LANDMARK/);
  assert.match(docs[1],/PROTEGE PULSO \+ FORMA \+ FUNCIÓN/);
  assert.match(docs[2],/Error local vs colapso estructural/);
  assert.match(docs[2],/modo interpretación/);
  assert.match(docs[2],/modo laboratorio/);
  assert.match(docs[2],/PULSO → FORMA → SIGUIENTE LANDMARK → FUNCIÓN/);
  assert.doesNotMatch(docs[2],/nunca parar.*regla universal/i);
});

test('La adaptación programada no se hace pasar por interacción interpersonal',()=>{
  assert.match(docs[4],/pista fija.*puede entrenar/is);
  assert.match(docs[4],/no puede demostrar adaptación mutua/i);
  assert.match(docs[4],/todavía no equivale a interacción interpersonal/i);
  assert.match(docs[5],/Fuente fija/);
  assert.match(docs[5],/No demuestra.*interacción interpersonal/is);
  assert.match(docs[5],/Persona que lanza cues/);
  assert.match(docs[5],/Otro músico responsivo/);
  assert.match(docs[5],/acoplamiento bidireccional/);
  assert.match(docs[5],/INTERACCIÓN INTERPERSONAL REAL: NO OBSERVADA TODAVÍA/);
});

test('U10 aplica K8 a un cuello de botella musical sin reabrir autorregulación general',()=>{
  assert.match(docs[3],/Aplicar K8 dentro de un proyecto musical real sin convertir U10 en otra unidad/);
  assert.match(docs[3],/NO TODO LO QUE FALLÓ EN LA PASADA MERECE SER CORREGIDO/);
  assert.match(docs[3],/MANTENER/);
  assert.match(docs[3],/REDUCIR/);
  assert.match(docs[3],/RETIRAR/);
  assert.match(docs[3],/CAMBIAR/);
  assert.match(docs[3],/no certifica K8 AVANZADO global/i);
});

test('U10 controla carga y no convierte todas las variables en novedad simultánea',()=>{
  assert.match(docs[0],/no convierte todas las variables en novedad simultánea/i);
  assert.match(docs[1],/No estudies aquí un estilo nuevo/);
  assert.match(docs[4],/DECISIÓN CURRICULAR RAZONADA.*no un «número óptimo»/is);
  assert.match(docs[5],/sin cambiar simultáneamente de estilo|cambiar una condición estilística pertinente/i);
});

test('Material original y copyright quedan protegidos sin MusicXML innecesario',()=>{
  const all=docs.join('\n');
  assert.match(all,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(docs[0],/No es una transcripción de ninguna canción ni una reconstrucción de una partitura existente/);
  assert.match(docs[0],/acceso legal a la grabación/);
  assert.match(docs[6],/no entregues a Aprendo una copia no autorizada/);
  assert.match(docs[6],/No contienen una transcripción de repertorio protegido/);
});

test('Evaluación es cualitativa, multidimensional y sin pseudoprecisión',()=>{
  const all=docs.join('\n');
  assert.match(docs[6],/Continuidad/);
  assert.match(docs[6],/Tiempo y subdivisión/);
  assert.match(docs[6],/Forma/);
  assert.match(docs[6],/Lectura funcional/);
  assert.match(docs[6],/Recuperación/);
  assert.match(docs[6],/Adaptación/);
  assert.match(docs[6],/Adecuación estilística \/ feel/);
  assert.match(docs[6],/Interacción \/ respuesta/);
  assert.match(docs[6],/K8 aplicado/);
  assert.match(docs[6],/Musicalidad y comprensión/);
  assert.match(docs[6],/No se suman ni promedian estas dimensiones como nota matemática/);
  assert.match(docs[6],/MÍNIMO PARA AVANZAR/);
  assert.match(docs[6],/COMPETENTE \/ FUNCIONAL/);
  assert.match(docs[6],/AVANZADO/);
  assert.doesNotMatch(all,/\b\d+\s*%/);
  assert.doesNotMatch(all,/\b\d+\s*BPM\b/i);
  assert.match(docs[6],/no exige BPM universal/i);
  assert.match(docs[6],/no exige porcentajes mínimos de notas correctas/i);
  assert.match(docs[6],/no exige cero errores/i);
});

test('Duración y forma originales se presentan como decisión curricular, no norma científica',()=>{
  assert.match(docs[0],/no establece una duración normativa universal/i);
  assert.match(docs[0],/DECISIÓN CURRICULAR RAZONADA — formato del proyecto/);
  assert.match(docs[0],/56 compases/);
  assert.match(docs[0],/No se presenta como formato científicamente óptimo/i);
});

test('U10 conserva fronteras U11, U12, Hito 7 y Fase 7',()=>{
  assert.match(docs[0],/función exacta de U11 permanece reservada/i);
  assert.match(docs[0],/U12 conserva el cierre integrador global/i);
  assert.match(docs[6],/no redefine el contrato de U11/i);
  assert.match(docs[6],/no consume el cierre global reservado para U12/i);
  assert.match(docs[6],/no declara \*\*Hito 7\*\*/i);
  assert.match(docs[6],/no abre contenido profundo de Fase 7/i);
  assert.match(docs[6],/no exige polirritmia, polimetría o modulación métrica/i);
});

test('Referencias centrales de investigación son trazables',()=>{
  assert.match(docs[0],/10\.16910\/jemr\.14\.4\.4/);
  assert.match(docs[0],/10\.3389\/fpsyg\.2017\.00149/);
  assert.match(docs[0],/10\.3389\/fpsyg\.2016\.01548/);
  assert.match(docs[0],/10\.3389\/fpsyg\.2024\.1467434/);
  assert.match(docs[5],/10\.1098\/rstb\.2013\.0394/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u9-overview.md','f6-u9-l1-del-sintoma-a-la-estrategia.md','f6-u9-l2-calibracion-grabacion-feedback.md',
  'f6-u9-l3-ayudas-con-proposito.md','f6-u9-l4-microciclo-autonomo.md','f6-u9-checkpoint-k8-autonomia-funcional.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U9 publica overview, cuatro lecciones y Checkpoint 6F',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 9\nunitSlug: fase-6-unidad-9/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,6);
  assert.match(docs[0],/4 lecciones \+ checkpoint/);
  assert.match(docs[5],/Checkpoint 6F/);
});

test('U9 mantiene K8 como novedad dominante y usa los niveles del mapa superior',()=>{
  assert.match(frontmatter(docs[0]),/competencies: \[K8, K1, K2, K3, K4, K5, K6, K7, I3, E6, F7, C1, C2, H5\]/);
  assert.match(docs[0],/MÍNIMO PARA AVANZAR.*seguir una lección.*reconocer qué necesita repasar/is);
  assert.match(docs[0],/COMPETENTE \/ FUNCIONAL.*selecciona estrategias y recursos con criterio dentro del currículo/is);
  assert.match(docs[0],/AVANZADO.*escucha\/lee\/analiza una necesidad.*diseña práctica.*verifica resultado.*transfiere la solución/is);
  assert.match(docs[5],/K8 FUNCIONAL/);
});

test('U9 desarrolla la línea base de U1 sin presentar diagnóstico y planificación como novedad inicial',()=>{
  assert.match(docs[0],/U1 abrió la Fase 6 enseñando a observar una ejecución, formular un problema, proponer una prueba y registrar una línea base/);
  assert.match(docs[0],/no vuelve a enseñar desde cero objetivos, diagnóstico, grabación o planificación/i);
  assert.match(docs[4],/U1 abrió R4/);
});

test('U9 enseña selección contextual de estrategias y evita recetas universales',()=>{
  assert.match(docs[0],/PROBLEMA → HIPÓTESIS → ESTRATEGIAS PLAUSIBLES → RECURSO NECESARIO → ELECCIÓN → EVIDENCIA → MANTENER \/ CAMBIAR \/ RETIRAR/);
  assert.match(docs[1],/Interleaving es mejor, así que mezclo todo/);
  assert.match(docs[3],/No existe ratio universal/);
  assert.match(docs[3],/no respalda una ventaja universal/i);
  assert.match(docs[5],/no convierte práctica bloqueada, interleaving, espaciado o feedback reducido en condiciones de aprobado/i);
});

test('U9 usa grabación para calibrar y separa observación de inferencia',()=>{
  assert.match(docs[2],/PREDICCIÓN → TOMA → OBSERVACIÓN → INFERENCIA → AJUSTE → RETEST/);
  assert.match(docs[2],/Grabarse no mejora el aprendizaje por sí solo/);
  assert.match(docs[2],/OBSERVACIÓN/);
  assert.match(docs[2],/INFERENCIA/);
  assert.match(docs[2],/una toma mejor inmediatamente después no demuestra por sí sola retención/i);
});

test('U9 protege la distinción aprendizaje-rendimiento y la recuperación',()=>{
  assert.match(docs[0],/Rendimiento inmediato ≠ aprendizaje retenido/);
  assert.match(docs[4],/retención.*recuperación suficientemente separada/is);
  assert.match(docs[5],/Si necesitas afirmar retención, remuestrea tras separación/);
  assert.match(docs[0],/10\.1016\/j\.bbr\.2011\.11\.028/);
  assert.match(docs[0],/10\.1038\/s41598-024-65753-3/);
  assert.match(docs[0],/10\.1016\/j\.psychsport\.2022\.102165/);
});

test('U9 documenta autorregulación musical con límites de transferencia',()=>{
  assert.match(docs[0],/10\.3389\/fpsyg\.2019\.01583/);
  assert.match(docs[0],/10\.1177\/10298649241275614/);
  assert.match(docs[0],/no prescribe un protocolo único para bateristas adultos/i);
  assert.match(docs[0],/literatura está muy concentrada en músicos clásicos/i);
});

test('Ejercicios propios quedan etiquetados y U9 no necesita apropiarse de material externo',()=>{
  for(const d of docs.slice(1,6)){if(/EJERCICIO ORIGINAL/.test(d))assert.match(d,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);}
  assert.match(docs[4],/sin reproducir una transcripción protegida/i);
  assert.match(docs[5],/No reproducen ejercicios de métodos comerciales ni transcripciones protegidas/);
});

test('Checkpoint 6F conserva evaluación cualitativa y límites con U10, U12 y Fase 7',()=>{
  assert.match(docs[5],/COMPETENTE \/ FUNCIONAL — objetivo de U9/);
  assert.match(docs[5],/no declara Hito 7/i);
  assert.match(docs[5],/no sustituye el proyecto sostenido de U10/i);
  assert.match(docs[5],/no certifica E6 FUNCIONAL o F7 FUNCIONAL/i);
  assert.match(docs[5],/CONTINUAR/);
  assert.match(docs[5],/CONTINUAR \+ CORRECTIVO/);
  assert.match(docs[5],/REDUCIR NOVEDAD/);
  assert.match(docs[5],/DETENER CARGA/);
  assert.match(docs[5],/No se promedian estas dimensiones como nota numérica/);
  assert.match(docs[5],/no usa BPM universal/i);
  assert.match(docs[5],/no abre contenido profundo de Fase 7/i);
});

test('U9 no introduce pseudoprecisión de rendimiento',()=>{
  const all=docs.join('\n');
  assert.doesNotMatch(all,/\b\d+\s*%/);
  assert.doesNotMatch(all,/\b\d+\s*BPM\b/i);
});
